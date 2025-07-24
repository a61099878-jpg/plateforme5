import { Config } from 'drizzle-kit';

export default {
  schema: './src/backend/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './ensam_stages.db',
  },
} satisfies Config;