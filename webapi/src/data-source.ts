import { DataSource } from 'typeorm';

process.loadEnvFile?.();

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const port = Number(process.env.DB_PORT ?? '3306');

if (Number.isNaN(port)) {
  throw new Error('DB_PORT must be a valid number');
}

const dataSource = new DataSource({
  type: 'mariadb',
  host: getRequiredEnv('DB_HOST'),
  port,
  username: getRequiredEnv('DB_USERNAME'),
  password: getRequiredEnv('DB_PASSWORD'),
  database: getRequiredEnv('DB_DATABASE'),
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});

export default dataSource;