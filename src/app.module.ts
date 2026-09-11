import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { EmailModule } from './email/email.module.js';

@Module({
  imports: [DbModule, AuthModule, ReportsModule, EmailModule],
})
export class AppModule {}
