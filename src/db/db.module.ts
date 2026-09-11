import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source.js';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions)],
})
export class DbModule {}
