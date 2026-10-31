import { describe, it, expect } from 'vitest';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const interviewConfigSchema = z.object({
  target_role: z.string().min(2),
  experience_level: z.string().min(1),
  difficulty: z.string().min(1),
  question_count: z.number().min(3).max(10),
  job_description: z.string().max(5000).optional(),
});

describe('Frontend Form Schemas & Validations', () => {
  it('validates correct login credentials', () => {
    const valid = loginSchema.safeParse({
      email: 'candidate@example.com',
      password: 'password123',
    });
    expect(valid.success).toBe(true);

    const invalidEmail = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(invalidEmail.success).toBe(false);
  });

  it('validates register requirements including minimum password length of 8', () => {
    const shortPassword = registerSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'short',
    });
    expect(shortPassword.success).toBe(false);

    const valid = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password1234',
    });
    expect(valid.success).toBe(true);
  });

  it('enforces interview question count boundaries between 3 and 10', () => {
    const tooFew = interviewConfigSchema.safeParse({
      target_role: 'Python Developer',
      experience_level: 'Intermediate',
      difficulty: 'Medium',
      question_count: 2,
    });
    expect(tooFew.success).toBe(false);

    const tooMany = interviewConfigSchema.safeParse({
      target_role: 'Python Developer',
      experience_level: 'Intermediate',
      difficulty: 'Medium',
      question_count: 11,
    });
    expect(tooMany.success).toBe(false);

    const valid = interviewConfigSchema.safeParse({
      target_role: 'Python Developer',
      experience_level: 'Intermediate',
      difficulty: 'Medium',
      question_count: 5,
    });
    expect(valid.success).toBe(true);
  });
});
