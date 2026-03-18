import { z } from "zod";

export const STATUS_VALUES = ["active", "experimental", "deprecated"] as const;
export const RISK_VALUES = ["safe", "review", "restricted"] as const;
export const MAX_SUMMARY_LENGTH = 100;
export const MAX_CATEGORY_VOCAB = 5;
export const MAX_TAG_VOCAB = 15;

export const catalogSchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  category: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).min(1),
  audience: z.array(z.string().trim().min(1)).min(1),
  owner: z.string().trim().min(1),
  status: z.enum(STATUS_VALUES),
  risk: z.enum(RISK_VALUES),
  lastValidated: z.preprocess((value) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    return value;
  }, z.string().trim().min(1)),
  featured: z.boolean(),
  order: z.number().int().optional(),
  links: z.array(z.object({ title: z.string(), url: z.string().url() })).optional(),
  notes: z.string().optional(),
});

export type CatalogMetadata = z.infer<typeof catalogSchema>;
