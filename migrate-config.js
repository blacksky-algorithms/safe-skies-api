require('dotenv').config();

const encodedPassword = encodeURIComponent(process.env.PGPASSWORD);
const connectionString = `postgresql://${process.env.PGUSER}:${encodedPassword}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;

module.exports = {
  databaseUrl: connectionString,
  migrationsDir: 'migrations',
};
