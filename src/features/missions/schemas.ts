import { z } from "zod";

export const joinCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6}$/, "Enter a 6-character mission code.");
export const nicknameSchema = z.string().trim().min(2, "Use at least 2 characters.").max(24, "Keep your nickname under 24 characters.");

export const missionCreateSchema = z.object({
  billId: z.string().trim().min(1),
  title: z.string().trim().min(6).max(90),
  gradeBand: z.enum(["6–8", "9–10", "11–12"]),
  learningObjective: z.string().trim().min(12).max(240),
});

export const responseSaveSchema = z.object({
  participantId: z.string().uuid(),
  missionId: z.string().min(1),
  nickname: nicknameSchema,
  currentChapter: z.number().int().min(0).max(6),
  initialPosition: z.enum(["support", "unsure", "oppose"]).optional(),
  initialConfidence: z.number().int().min(1).max(5).optional(),
  evidenceRatings: z.record(z.string(), z.number().int().min(-2).max(2)),
  answers: z.record(z.string(), z.number().int().min(0)),
  reflection: z.string().max(800).optional(),
  personalConnection: z.string().max(800).optional(),
  finalPosition: z.enum(["support", "unsure", "oppose"]).optional(),
  finalConfidence: z.number().int().min(1).max(5).optional(),
  letter: z.string().max(4000).optional(),
  reviewStatus: z.enum(["draft", "submitted", "approved", "returned", "excluded"]),
  feedback: z.string().max(600).optional(),
  completedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});

export const reviewSchema = z.object({
  status: z.enum(["approved", "returned", "excluded"]),
  feedback: z.string().trim().max(600).optional(),
}).refine((value) => value.status !== "returned" || Boolean(value.feedback), {
  message: "Feedback is required when returning a letter.",
  path: ["feedback"],
});
