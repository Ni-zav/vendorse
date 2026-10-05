import {
  Controller,
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
  @Roles('VENDOR')
  async getUploadUrl(
    @Query('fileName') fileName: string,
    @Query('contentType') contentType: string,
    @Query('fileSize') fileSize: string,
    @Request() req,
  ) {
    const upload = this.fileService.validateProposalUpload(
      fileName || '',
      contentType || '',
      Number(fileSize),
    );

    const key = this.fileService.generateFileKey(
      upload.fileName,
      req.user.id,
    );

    return this.fileService.generateUploadUrl(
      key,
      upload.contentType,
      upload.fileSize,
    );
  }
}
