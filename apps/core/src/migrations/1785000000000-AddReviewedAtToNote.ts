import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewedAtToNote1785000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "note" ADD "reviewedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "reviewedAt"`);
  }
}
