require('dotenv').config();

const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  email: {
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: Number(process.env.SMTP_PORT || 465),
    user: process.env.SMTP_USER || '756849845@qq.com',
    pass: process.env.SMTP_PASS || 'xnafuogqjvlabfde',
    from: process.env.SMTP_FROM || 'CATaur Talent <756849845@qq.com>'
  },
  db: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  }
};

module.exports = config;
