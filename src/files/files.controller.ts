import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CompleteUploadDTO,
  FileUploadDTO,
  StartigUploadDTO,
} from './files.DTO';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}
  @Post('start-upload')
  async startUpload(@Body() data: StartigUploadDTO) {
    return await this.filesService.startUpload(data);
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Body() data: FileUploadDTO,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.filesService.upload(
      'resumable',
      data.objectName,
      data.uploadId,
      data.partNumber,
      file.buffer,
    );
  }
  @Post('complete-upload')
  async completeUpload(@Body() data: CompleteUploadDTO) {
    return await this.filesService.completeUpload(
      'resumable',
      data.objectName,
      data.uploadId,
      data.parts,
      data.documentId,
    );
  }
}
