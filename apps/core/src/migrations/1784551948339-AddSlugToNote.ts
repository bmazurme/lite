import { MigrationInterface, QueryRunner } from 'typeorm';

import { slugify } from '../notes/slugify';

export class AddSlugToNote1784551948339 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" ADD "slug" character varying(180)`,
    );

    // Бэкфилл существующих заметок: транслитерация заголовка + гарантия
    // уникальности суффиксом при коллизии.
    const rows: Array<{ id: number; title: string }> = await queryRunner.query(
      `SELECT "id", "title" FROM "note" ORDER BY "id" ASC`,
    );

    const used = new Set<string>();
    for (const { id, title } of rows) {
      const base = slugify(title);
      let slug = base;
      let n = 2;
      while (used.has(slug)) {
        slug = `${base}-${n++}`;
      }
      used.add(slug);

      await queryRunner.query(`UPDATE "note" SET "slug" = $1 WHERE "id" = $2`, [
        slug,
        id,
      ]);
    }

    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "UQ_note_slug" UNIQUE ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "UQ_note_slug"`,
    );
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "slug"`);
  }
}
