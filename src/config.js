module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgres://nqqpgeugwegiew:b23ea01f235651dd5ce673f4f4e526d1de94e8642165ad30a58f8c5e02685ad6@ec2-50-16-221-180.compute-1.amazonaws.com:5432/d9mpitjv6l522b',
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '3h',
};
