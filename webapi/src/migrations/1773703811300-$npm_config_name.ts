import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1773703811300 implements MigrationInterface {
    name = ' $npmConfigName1773703811300'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`location\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`lastLoginAt\``);
        await queryRunner.query(`ALTER TABLE \`candidate\` DROP COLUMN \`currentLocation\``);
        await queryRunner.query(`ALTER TABLE \`audit_log\` DROP COLUMN \`actionDetails\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`location\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`availability\``);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`locationCountry\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`locationState\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`locationCity\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`owner\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`candidate\` ADD \`summary\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`candidate\` ADD \`yearsOfExperience\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`candidate\` ADD \`targetSalary\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`candidate\` ADD \`preferredLocation\` varchar(200) NULL`);
        await queryRunner.query(`ALTER TABLE \`candidate\` ADD \`linkedin\` varchar(500) NULL`);
        await queryRunner.query(`ALTER TABLE \`candidate\` ADD \`phone\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`candidate\` ADD \`currentLocationCountry\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`candidate\` ADD \`currentLocationState\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`candidate\` ADD \`currentLocationCity\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD \`employmentType\` varchar(20) NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD \`workArrangement\` varchar(10) NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD \`locationCountry\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD \`locationState\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD \`locationCity\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD \`owner\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`locationCountry\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`locationState\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`locationCity\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`email\``);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`email\` blob NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`phone\``);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`phone\` blob NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`phone\``);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`phone\` blob NULL`);
        await queryRunner.query(`ALTER TABLE \`system_config\` DROP COLUMN \`value\``);
        await queryRunner.query(`ALTER TABLE \`system_config\` ADD \`value\` longblob NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` CHANGE \`status\` \`status\` varchar(20) NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP COLUMN \`location\``);
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD \`location\` blob NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP COLUMN \`salary\``);
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD \`salary\` blob NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`recruiterNotes\``);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`recruiterNotes\` longblob NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`interviewSubject\``);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`interviewSubject\` blob NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`interviewContent\``);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`interviewContent\` longblob NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`clientDecisionNote\``);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`clientDecisionNote\` longblob NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`clientDecisionNote\``);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`clientDecisionNote\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`interviewContent\``);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`interviewContent\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`interviewSubject\``);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`interviewSubject\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`recruiterNotes\``);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`recruiterNotes\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP COLUMN \`salary\``);
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD \`salary\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP COLUMN \`location\``);
        await queryRunner.query(`ALTER TABLE \`job_order\` ADD \`location\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`job_order\` CHANGE \`status\` \`status\` varchar(20) NOT NULL DEFAULT 'sourcing'`);
        await queryRunner.query(`ALTER TABLE \`system_config\` DROP COLUMN \`value\``);
        await queryRunner.query(`ALTER TABLE \`system_config\` ADD \`value\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`phone\``);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`phone\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`phone\``);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`phone\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`email\``);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`email\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`locationCity\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`locationState\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`locationCountry\``);
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP COLUMN \`owner\``);
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP COLUMN \`locationCity\``);
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP COLUMN \`locationState\``);
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP COLUMN \`locationCountry\``);
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP COLUMN \`workArrangement\``);
        await queryRunner.query(`ALTER TABLE \`job_order\` DROP COLUMN \`employmentType\``);
        await queryRunner.query(`ALTER TABLE \`candidate\` DROP COLUMN \`currentLocationCity\``);
        await queryRunner.query(`ALTER TABLE \`candidate\` DROP COLUMN \`currentLocationState\``);
        await queryRunner.query(`ALTER TABLE \`candidate\` DROP COLUMN \`currentLocationCountry\``);
        await queryRunner.query(`ALTER TABLE \`candidate\` DROP COLUMN \`phone\``);
        await queryRunner.query(`ALTER TABLE \`candidate\` DROP COLUMN \`linkedin\``);
        await queryRunner.query(`ALTER TABLE \`candidate\` DROP COLUMN \`preferredLocation\``);
        await queryRunner.query(`ALTER TABLE \`candidate\` DROP COLUMN \`targetSalary\``);
        await queryRunner.query(`ALTER TABLE \`candidate\` DROP COLUMN \`yearsOfExperience\``);
        await queryRunner.query(`ALTER TABLE \`candidate\` DROP COLUMN \`summary\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`owner\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`locationCity\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`locationState\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`locationCountry\``);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`availability\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`location\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`audit_log\` ADD \`actionDetails\` longtext COLLATE "utf8mb4_bin" NULL`);
        await queryRunner.query(`ALTER TABLE \`candidate\` ADD \`currentLocation\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`lastLoginAt\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`location\` varchar(255) NULL`);
    }

}
