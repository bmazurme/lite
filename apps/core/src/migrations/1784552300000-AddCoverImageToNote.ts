import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoverImageToNote1784552300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" ADD "coverImage" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "coverImage"`);
  }
}
