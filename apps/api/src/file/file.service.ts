import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';
import { PrismaService } from '../database/prisma.service';

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const ALLOWED_DOCUMENT_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
};

type Actor = {
  id: string;
  role: string;
  orgId: string;
};

@Injectable()
export class FileService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const production = this.configService.get('NODE_ENV') === 'production';
    const bucket = this.configService.get<string>('AWS_BUCKET_NAME');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (production && (!bucket || !accessKeyId || !secretAccessKey)) {
      throw new Error(
        'AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required in production',
      );
    }

    this.bucket = bucket || 'vendorse';
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      endpoint: this.configService.get('MINIO_ENDPOINT') || undefined,
      credentials: {
        accessKeyId: accessKeyId || 'minioadmin',
        secretAccessKey: secretAccessKey || 'minioadmin',
      },
      forcePathStyle: Boolean(this.configService.get('MINIO_ENDPOINT')),
    });
  }

  validateUpload(fileName: string, contentType: string, fileSize: number) {
    const safeName = this.sanitizeFileName(fileName);
    const normalizedType = contentType.trim().toLowerCase();
    const allowedExtensions = ALLOWED_DOCUMENT_TYPES[normalizedType];

    if (!allowedExtensions) {
      throw new BadRequestException('Documents must be PDF, DOC, or DOCX files');
    }

    const lowerName = safeName.toLowerCase();
    if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
      throw new BadRequestException(
        'File extension does not match the declared content type',
      );
    }

    if (!Number.isInteger(fileSize) || fileSize <= 0) {
      throw new BadRequestException('File size must be a positive integer');
    }

    if (fileSize > MAX_DOCUMENT_SIZE) {
      throw new BadRequestException('File size exceeds the 10MB document limit');
    }

    return {
      fileName: safeName,
      contentType: normalizedType,
      fileSize,
    };
  }

  validateProposalUpload(fileName: string, contentType: string, fileSize: number) {
    return this.validateUpload(fileName, contentType, fileSize);
  }

  async createUploadIntent(
    fileName: string,
    contentType: string,
    fileSize: number,
    ownerId: string,
    purpose = 'PROCUREMENT_DOCUMENT',
  ) {
    const upload = this.validateUpload(fileName, contentType, fileSize);
    const key = this.generateFileKey(upload.fileName, ownerId);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: upload.contentType,
      ContentLength: upload.fileSize,
    });
    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 15 * 60 });

    const file = await this.prisma.fileObject.create({
      data: {
        ownerId,
        purpose: purpose.trim().slice(0, 80) || 'PROCUREMENT_DOCUMENT',
        storageKey: key,
        originalFileName: upload.fileName,
        contentType: upload.contentType,
        sizeBytes: upload.fileSize,
        verificationStatus: 'PENDING',
      },
      select: {
        id: true,
        originalFileName: true,
        contentType: true,
        sizeBytes: true,
        verificationStatus: true,
      },
    });

    return {
      file,
      url,
      fields: {
        key,
        'Content-Type': upload.contentType,
      },
    };
  }

  async finalizeUpload(fileId: string, actorId: string) {
    const file = await this.prisma.fileObject.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File upload record not found');
    if (file.ownerId !== actorId) throw new ForbiddenException('This upload belongs to another user');
    if (file.verificationStatus === 'VERIFIED') return file;

    try {
      const head = await this.s3Client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: file.storageKey }),
      );
      if (Number(head.ContentLength) !== file.sizeBytes) {
        throw new BadRequestException('Uploaded file size does not match the upload intent');
      }
      if ((head.ContentType || '').toLowerCase() !== file.contentType.toLowerCase()) {
        throw new BadRequestException('Uploaded file content type does not match the upload intent');
      }

      const object = await this.s3Client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: file.storageKey }),
      );
      if (!object.Body) throw new BadRequestException('Uploaded file content is unavailable');
      const bytes = await object.Body.transformToByteArray();
      if (bytes.byteLength !== file.sizeBytes) {
        throw new BadRequestException('Uploaded file body size is invalid');
      }
      const sha256 = createHash('sha256').update(bytes).digest('hex');

      return await this.prisma.fileObject.update({
        where: { id: fileId },
        data: {
          sha256,
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      await this.prisma.fileObject.update({
        where: { id: fileId },
        data: { verificationStatus: 'REJECTED' },
      });
      throw new BadRequestException('Uploaded object could not be verified');
    }
  }

  async generateAuthorizedDownloadUrl(fileId: string, actor: Actor) {
    const file = await this.prisma.fileObject.findUnique({
      where: { id: fileId },
      include: {
        responseDocument: {
          include: {
            responseVersion: {
              include: {
                response: {
                  include: {
                    event: { include: { project: true } },
                    assignments: {
                      where: { reviewerId: actor.id },
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!file || file.verificationStatus !== 'VERIFIED') {
      throw new NotFoundException('Verified file not found');
    }

    let allowed = actor.role === 'ADMIN' || file.ownerId === actor.id;
    const response = file.responseDocument?.responseVersion.response;

    if (!allowed && response) {
      if (
        actor.role === 'BUYER' &&
        response.event.project.workspaceOrgId === actor.orgId
      ) {
        allowed = ['OPENED', 'EVALUATING', 'AWARDED'].includes(
          response.event.status,
        );
      }
      if (actor.role === 'VENDOR' && response.supplierOrgId === actor.orgId) {
        allowed = true;
      }
      if (
        actor.role === 'REVIEWER' &&
        ['OPENED', 'EVALUATING', 'AWARDED'].includes(response.event.status) &&
        response.assignments.length > 0
      ) {
        allowed = true;
      }
    }

    if (!allowed) {
      throw new ForbiddenException('You are not authorized to download this document');
    }

    const url = await getSignedUrl(
      this.s3Client,
      new GetObjectCommand({ Bucket: this.bucket, Key: file.storageKey }),
      { expiresIn: 5 * 60 },
    );
    return { url, expiresInSeconds: 300 };
  }

  async generateUploadUrl(
    key: string,
    contentType: string,
    fileSize: number,
  ): Promise<{ url: string; fields: Record<string, string> }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    });
    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 15 * 60,
    });
    return {
      url: signedUrl,
      fields: { key, 'Content-Type': contentType },
    };
  }

  generateFileKey(fileName: string, userId: string): string {
    const timestamp = Date.now();
    const safeName = this.sanitizeFileName(fileName);
    const hash = createHash('sha256')
      .update(`${userId}-${timestamp}-${safeName}`)
      .digest('hex')
      .slice(0, 12);
    return `procurement/${userId}/${timestamp}-${hash}-${safeName}`;
  }

  private sanitizeFileName(fileName: string): string {
    const baseName = fileName.split(/[\\/]/).pop()?.trim() || '';
    const safeName = baseName
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+/, '')
      .slice(0, 160);

    if (!safeName) {
      throw new BadRequestException('A valid file name is required');
    }
    return safeName;
  }
}
