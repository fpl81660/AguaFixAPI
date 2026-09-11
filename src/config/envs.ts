import 'dotenv/config';
import env from 'env-var';

export const envs = {
  database: {
    host: env.get('DB_HOST').required().asString(),
    port: env.get('DB_PORT').required().asPortNumber(),
    user: env.get('DB_USER').required().asString(),
    password: env.get('DB_PASSWORD').required().asString(),
    name: env.get('DB_NAME').required().asString(),
  },

  mailer: {
    service: env.get('MAILER_SERVICE').required().asString(),
    user: env.get('MAILER_USER').required().asString(),
    token: env.get('MAILER_TOKEN').required().asString(),
  },
};
