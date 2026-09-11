import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { envs } from '../config/envs.js';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: envs.mailer.service,
      auth: {
        user: envs.mailer.user,
        pass: envs.mailer.token,
      },
    });
  }

  async sendEmail(to: string, subject: string, template: string) {
    try {
      const info = await this.transporter.sendMail({
        from: envs.mailer.user,
        to,
        subject,
        html: template,
      });
      this.logger.log(
        `Email enviado correctamente a ${to} - ID: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Error enviando email a ${to}`, error);
      return false;
    }
  }
}
