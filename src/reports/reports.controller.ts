import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService } from './reports.service.js';
import { CreateReportDto } from './dtos/create-report.dto.js';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('photo', {
      // Busboy rechaza al alcanzar el límite; +1 permite exactamente 5 MiB.
      limits: { fileSize: 5 * 1024 * 1024 + 1, files: 1, fields: 4 },
    }),
  )
  create(
    @Body() createReportDto: CreateReportDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png)$/,
            overrideMimeType: true,
          }),
        ],
        exceptionFactory: () =>
          new BadRequestException(
            'Adjunta una foto JPEG o PNG válida en el campo photo',
          ),
      }),
    )
    photo: Express.Multer.File,
  ) {
    return this.reportsService.create(createReportDto, photo);
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }
}
