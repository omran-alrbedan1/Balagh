import { z } from 'zod';

export const complaintDetailsSchema = z.object({
  title: z.string().min(5, 'Title is too short.').max(120, 'Title is too long.'),
  description: z
    .string()
    .min(20, 'Please describe the issue in more detail.')
    .max(2000, 'Description is too long.'),
});

export type ComplaintDetailsValues = z.infer<typeof complaintDetailsSchema>;
