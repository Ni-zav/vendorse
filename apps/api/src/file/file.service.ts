import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';

@Injectable()
export class FileService {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(FileService.name);
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get('AWS_BUCKET_NAME') || 'vendorse';
    
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      endpoint: this.configService.get('MINIO_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || 'minioadmin',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  async generateUploadUrl(key: string, contentType: string): Promise<{ url: string; fields: Record<string, string> }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return {
      url: signedUrl,
      fields: {
        key,
        'Content-Type': contentType,
      },
    };
  }

  async generateDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  generateFileKey(fileName: string, userId: string): string {
    const timestamp = Date.now();
    const hash = createHash('sha256')
      .update(`${userId}-${timestamp}-${fileName}`)
      .digest('hex')
      .slice(0, 8);
    
    return `${userId}/${hash}-${fileName}`;
  }

  async validateFile(buffer: Buffer): Promise<{ isValid: boolean; reason?: string }> {
    // TODO: Implement virus scanning and file validation
    // For now, just check file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
      return {
        isValid: false,
        reason: 'File size exceeds maximum allowed size of 10MB',
      };
    }

    return { isValid: true };
  }

  getFileSignature(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}