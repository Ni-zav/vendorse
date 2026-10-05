import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';

const MAX_PROPOSAL_SIZE = 10 * 1024 * 1024;

const ALLOWED_PROPOSAL_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
};

@Injectable()
export class FileService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get('AWS_BUCKET_NAME') || 'vendorse';

    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      endpoint: this.configService.get('MINIO_ENDPOINT'),
      credentials: {
        accessKeyId:
          this.configService.get('AWS_ACCESS_KEY_ID') || 'minioadmin',
        secretAccessKey:
          this.configService.get('AWS_SECRET_ACCESS_KEY') || 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  validateProposalUpload(
    fileName: string,
    contentType: string,
    fileSize: number,
  ) {
    const safeName = this.sanitizeFileName(fileName);
    const normalizedType = contentType.trim().toLowerCase();
    const allowedExtensions = ALLOWED_PROPOSAL_TYPES[normalizedType];

    if (!allowedExtensions) {
      throw new BadRequestException(
        'Proposal documents must be PDF, DOC, or DOCX files',
      );
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

    if (fileSize > MAX_PROPOSAL_SIZE) {
      throw new BadRequestException(
        'File size exceeds the 10MB proposal document limit',
      );
    }

    return {
      fileName: safeName,
      contentType: normalizedType,
      fileSize,
    };
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
      fields: {
        key,
        'Content-Type': contentType,
      },
    };
  }

  generateFileKey(fileName: string, userId: string): string {
    const timestamp = Date.now();
    const safeName = this.sanitizeFileName(fileName);
    const hash = createHash('sha256')
      .update(`${userId}-${timestamp}-${safeName}`)
      .digest('hex')
      .slice(0, 12);

    return `proposals/${userId}/${timestamp}-${hash}-${safeName}`;
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
