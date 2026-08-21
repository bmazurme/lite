import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColorToType1781280198925 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "type" ADD "color" character varying(7) NOT NULL DEFAULT '#4aa1f2'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "type" DROP COLUMN "color"`);
  }
}
