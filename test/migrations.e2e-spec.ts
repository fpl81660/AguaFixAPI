import 'reflect-metadata';
import 'dotenv/config';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Report } from '../src/reports/entities/report.entity.js';
import { User } from '../src/auth/entities/user.entity.js';
import { InitialMigration1789084970215 } from '../src/db/migrations/1789084970215-InitialMigration.js';
import { AddReportPhotos1792713600000 } from '../src/db/migrations/1792713600000-AddReportPhotos.js';

// Solo se ejecuta con npm run test:migrations contra una base desechable *_test.
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) {
  throw new Error(
    'Define TEST_DATABASE_URL con una base PostgreSQL desechable cuyo nombre termine en _test',
  );
}

describe('Migraciones en PostgreSQL', () => {
  let admin: DataSource;
  let dataSource: DataSource;
  let schema: string;

  beforeEach(async () => {
    schema = `aguafix_test_${randomUUID().replaceAll('-', '')}`;
    admin = await new DataSource({ type: 'postgres', url }).initialize();
    await admin.query(`CREATE SCHEMA "${schema}"`);
    dataSource = await new DataSource({
      type: 'postgres',
      url,
      schema,
      synchronize: false,
      entities: [Report, User],
      migrations: [InitialMigration1789084970215, AddReportPhotos1792713600000],
      extra: { options: `-c search_path=${schema},public` },
    }).initialize();
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (admin?.isInitialized) {
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await admin.destroy();
    }
  });

  it('aplica ambas migraciones en una base vacía y permite guardar las URLs', async () => {
    await dataSource.runMigrations();
    const repository = dataSource.getRepository(Report);
    const report = await repository.save(
      repository.create({
        address: 'Prueba',
        description: 'Fuga de prueba',
        severity: 'baja',
        reporterPhone: '5551234567',
        photoUrl: 'https://example.test/reports/photo.png',
        repairPhotoUrl: null,
      }),
    );
    const stored = await repository.findOneByOrFail({ id: report.id });
    assert.equal(stored.photoUrl, report.photoUrl);
    assert.equal(stored.repairPhotoUrl, null);
    assert.deepEqual(await dataSource.runMigrations(), []);
  });

  it('conserva reportes anteriores y permite revertir solo la migración nueva', async () => {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await new InitialMigration1789084970215().up(queryRunner);
      await queryRunner.query(
        `INSERT INTO "WATER_REPORT" (address, description, severity, "reporterPhone") VALUES ($1, $2, $3, $4)`,
        ['Anterior', 'Sin foto', 'media', '5551234567'],
      );
      const migration = new AddReportPhotos1792713600000();
      await migration.up(queryRunner);
      const [report] = await queryRunner.query(`SELECT * FROM "WATER_REPORT"`);
      assert.equal(report.address, 'Anterior');
      assert.equal(report.photoUrl, null);
      assert.equal(report.repairPhotoUrl, null);
      await migration.down(queryRunner);
      const [original] = await queryRunner.query(
        `SELECT * FROM "WATER_REPORT"`,
      );
      assert.equal(original.address, 'Anterior');
      assert.equal('photoUrl' in original, false);
      assert.equal('repairPhotoUrl' in original, false);
      await migration.up(queryRunner);
      assert.equal(
        (await dataSource.getRepository(Report).find())[0].photoUrl,
        null,
      );
    } finally {
      await queryRunner.release();
    }
  });
});
