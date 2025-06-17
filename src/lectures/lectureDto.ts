import { z } from 'zod';

export const lectureSchema = z.object({
  title: z.string(),
  description: z.string(),
  recommendation: z.string().optional().nullable(),
  requiredGroups: z.string().optional().nullable(),
  text: z.array(z.string()),
});

export type LectureDto = z.infer<typeof lectureSchema>;
