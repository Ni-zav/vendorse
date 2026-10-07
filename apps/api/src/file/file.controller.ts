import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload-url')
  @Roles('VENDOR', 'BUYER', 'ADMIN')
  async getUploadUrl(
    @Query('fileName') fileName: string,
    @Query('contentType') contentType: string,
    @Query('fileSize') fileSize: string,
    @Query('purpose') purpose: string,
    @Request() req: any,
  ) {
    return this.fileService.createUploadIntent(
      fileName || '',
      contentType || '',
      Number(fileSize),
      req.user.id,
      purpose || 'PROCUREMENT_DOCUMENT',
    );
  }

  @Post(':id/finalize')
  @Roles('VENDOR', 'BUYER', 'ADMIN')
  finalizeUpload(@Param('id') id: string, @Request() req: any) {
    return this.fileService.finalizeUpload(id, req.user.id);
  }

  @Get(':id/download-url')
  async getDownloadUrl(@Param('id') id: string, @Request() req: any) {
    return this.fileService.generateAuthorizedDownloadUrl(id, {
      id: req.user.id,
      role: req.user.role,
      orgId: req.user.orgId,
    });
  }
}
