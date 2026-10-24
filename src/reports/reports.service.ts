import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity.js';
import { CreateReportDto } from './dtos/create-report.dto.js';
import { EmailService } from '../email/email.service.js';
import { generateReportTemplate } from './templates/report.template.js';
import { envs } from '../config/envs.js';
import { StorageService } from '../storage/storage.service.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly emailsService: EmailService,
    private readonly storageService: StorageService,
  ) {}

  async create(createReportDto: CreateReportDto, photo: Express.Multer.File) {
    const photoUrl = await this.storageService.uploadFile(photo, 'reports/');
    const report = this.reportRepository.create({
      ...createReportDto,
      photoUrl,
      repairPhotoUrl: null,
    });
    await this.reportRepository.save(report);

    const htmlTemplate = generateReportTemplate(createReportDto, photoUrl);
    await this.emailsService.sendEmail(
      envs.reports.notificationEmail || envs.mailer.user,
      'Nuevo Reporte de Fuga de Agua',
      htmlTemplate,
    );

    return report;
  }

  async findAll() {
    return this.reportRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
