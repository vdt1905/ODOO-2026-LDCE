import { z } from 'zod';

export const inviteMemberSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    role: z.enum(['editor', 'viewer']).optional().default('editor'),
  })
  .strict();

export const updateMemberSchema = z.object({ role: z.enum(['editor', 'viewer']) }).strict();
