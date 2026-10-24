import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReportPhotos1792713600000 implements MigrationInterface {
  name = 'AddReportPhotos1792713600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "WATER_REPORT" ADD "photoUrl" character varying, ADD "repairPhotoUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "WATER_REPORT" DROP COLUMN "repairPhotoUrl", DROP COLUMN "photoUrl"`,
    );
  }
}
