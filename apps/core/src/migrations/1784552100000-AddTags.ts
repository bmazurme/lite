import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTags1784552100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tag" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(50) NOT NULL,
        "slug" character varying(60) NOT NULL,
        CONSTRAINT "UQ_tag_name" UNIQUE ("name"),
        CONSTRAINT "UQ_tag_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_tag" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "note_tags" (
        "noteId" integer NOT NULL,
        "tagId" integer NOT NULL,
        CONSTRAINT "PK_note_tags" PRIMARY KEY ("noteId", "tagId")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_note_tags_noteId" ON "note_tags" ("noteId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_note_tags_tagId" ON "note_tags" ("tagId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "note_tags"
        ADD CONSTRAINT "FK_note_tags_note"
        FOREIGN KEY ("noteId") REFERENCES "note"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "note_tags"
        ADD CONSTRAINT "FK_note_tags_tag"
        FOREIGN KEY ("tagId") REFERENCES "tag"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note_tags" DROP CONSTRAINT "FK_note_tags_tag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note_tags" DROP CONSTRAINT "FK_note_tags_note"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_note_tags_tagId"`);
    await queryRunner.query(`DROP INDEX "IDX_note_tags_noteId"`);
    await queryRunner.query(`DROP TABLE "note_tags"`);
    await queryRunner.query(`DROP TABLE "tag"`);
  }
}
