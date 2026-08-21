import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublishedToNote1784663026112 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" ADD "published" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "published"`);
  }
}
