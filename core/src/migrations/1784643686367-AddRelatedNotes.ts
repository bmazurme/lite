import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelatedNotes1784643686367 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "note_related_notes" (
        "noteId" integer NOT NULL,
        "relatedNoteId" integer NOT NULL,
        CONSTRAINT "PK_note_related_notes" PRIMARY KEY ("noteId", "relatedNoteId")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_note_related_notes_noteId" ON "note_related_notes" ("noteId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_note_related_notes_relatedNoteId" ON "note_related_notes" ("relatedNoteId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "note_related_notes"
        ADD CONSTRAINT "FK_note_related_notes_note"
        FOREIGN KEY ("noteId") REFERENCES "note"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "note_related_notes"
        ADD CONSTRAINT "FK_note_related_notes_related_note"
        FOREIGN KEY ("relatedNoteId") REFERENCES "note"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note_related_notes" DROP CONSTRAINT "FK_note_related_notes_related_note"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note_related_notes" DROP CONSTRAINT "FK_note_related_notes_note"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_note_related_notes_relatedNoteId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_note_related_notes_noteId"`);
    await queryRunner.query(`DROP TABLE "note_related_notes"`);
  }
}
