import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity.js';
import { CreateReportDto } from './dtos/create-report.dto.js';
import { EmailService } from '../email/email.service.js';
import { generateReportTemplate } from './templates/report.template.js';
import { envs } from '../config/envs.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly emailsService: EmailService,
  ) {}

  async create(createReportDto: CreateReportDto) {
    const report = this.reportRepository.create(createReportDto);
    await this.reportRepository.save(report);

    const htmlTemplate = generateReportTemplate(createReportDto);
    await this.emailsService.sendEmail(
      envs.mailer.user,
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
