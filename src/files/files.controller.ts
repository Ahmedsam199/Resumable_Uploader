import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
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
  /**
   * API Endpoint the user will hit it first to start uploading new file
   * @returns will return an object contain id and key for this file to start uploading
   */
  @Post('start-upload')
  async startUploadNewFile(@Body() data: StartigUploadDTO) {
    return await this.filesService.startUploadNewFile(data);
  }
  /**
   * API Endpoint that recive file chunks with partNumber and the id for file
   * @returns an ETage and partNumber for this chunk to use it forward in combinig this chunks
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileChunk(
    @Body(new ValidationPipe({ transform: true })) data: FileUploadDTO,
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
  /**
   * API Endpoint which hit after uploading all chunks to combine all file from the Parts array
   * @returns The created file record in the database, including its name and path.
   */
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
