import { Controller, Post, Get, UseGuards, Param, Query, Request } from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload-url')
  async getUploadUrl(
    @Query('fileName') fileName: string,
    @Query('contentType') contentType: string,
    @Request() req,
  ) {
    const key = this.fileService.generateFileKey(fileName, req.user.id);
    return this.fileService.generateUploadUrl(key, contentType);
  }

  @Get(':key/download-url')
  async getDownloadUrl(@Param('key') key: string) {
    return {
      url: await this.fileService.generateDownloadUrl(key),
    };
  }
}