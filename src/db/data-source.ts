import { DataSource, DataSourceOptions } from 'typeorm';
import { envs } from '../config/envs.js';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: envs.database.host,
  port: envs.database.port,
  username: envs.database.user,
  password: envs.database.password,
  database: envs.database.name,
  entities: [process.cwd() + '/dist/**/*.entity.js'],
  migrations: [process.cwd() + '/dist/db/migrations/*.js'],
  synchronize: false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
