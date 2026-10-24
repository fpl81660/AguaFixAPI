// Valores ficticios, exclusivos de pruebas: no se conectan a servicios externos.
process.env.DOTENV_CONFIG_PATH = '.env.test-not-used';
Object.assign(process.env, {
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_USER: 'test',
  DB_PASSWORD: 'test-only-not-a-credential',
  DB_NAME: 'aguafix_test',
  MAILER_SERVICE: 'gmail',
  MAILER_USER: 'sender@example.test',
  MAILER_TOKEN: 'test-only-not-a-credential',
  REPORTS_NOTIFICATION_EMAIL: 'crew@example.test',
  AWS_REGION: 'us-east-1',
  AWS_S3_BUCKET: 'aguafix-test',
});
