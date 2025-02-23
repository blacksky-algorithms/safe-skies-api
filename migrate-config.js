require('dotenv').config();

const encodedPassword = encodeURIComponent(process.env.PGPASSWORD);
const connectionString = `postgresql://${process.env.PGUSER}:${encodedPassword}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;

console.log(
  'PGPORT:',
  process.env.PGPORT,
  connectionString.replace(encodedPassword, '***pwd obscured***')
);
module.exports = {
  databaseUrl: connectionString,
  migrationsDir: 'migrations',
};
