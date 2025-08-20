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
  async startUploadNewFile(@Body() data: StartigUploadDTO) {
    return await this.filesService.startUploadNewFile(data);
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileChunk(
    @Body() data: FileUploadDTO,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.filesService.uploadFileChunk(
      'resumable',
      data.objectName,
      data.uploadId,
      data.partNumber,
      file.buffer,
    );
  }
  @Post('complete-upload')
  async completeUploadingFile(@Body() data: CompleteUploadDTO) {
    return await this.filesService.completeUploadingFile(
      'resumable',
      data.objectName,
      data.uploadId,
      data.parts,
      data.documentId,
    );
  }
}
