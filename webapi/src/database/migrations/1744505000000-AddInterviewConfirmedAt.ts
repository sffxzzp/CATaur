import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInterviewConfirmedAt1744505000000 implements MigrationInterface {
  name = 'AddInterviewConfirmedAt1744505000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`application\` ADD \`interviewConfirmedAt\` datetime NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`application\` DROP COLUMN \`interviewConfirmedAt\``,
    );
  }
}
