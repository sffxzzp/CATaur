import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1773705729443 implements MigrationInterface {
    name = ' $npmConfigName1773705729443'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP FOREIGN KEY \`FK_2bc33ef816c92a2ad7870daf3fd\``);
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP COLUMN \`assignedToId\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD \`assignedToId\` char(26) NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD CONSTRAINT \`FK_2bc33ef816c92a2ad7870daf3fd\` FOREIGN KEY (\`assignedToId\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
