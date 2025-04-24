import { z } from 'zod';

export const sendEmailSchema = z.object({
  email: z.string().email(),
});

export type SendEmailDto = z.infer<typeof sendEmailSchema>;
