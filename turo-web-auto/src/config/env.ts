import { z } from 'zod';

const EnvSchema = z.object({
  HEADLESS: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  TURO_BASE_URL: z.string().default('https://turo.com'),
  SLOW_MO_MS: z.coerce.number().default(0),
  DEFAULT_TIMEOUT_MS: z.coerce.number().default(15000)
});

export const env = EnvSchema.parse(process.env);
