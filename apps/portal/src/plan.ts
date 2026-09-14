import { z } from "zod";
import { FeaturesSchema } from "./feature";

export const EpicSchema = z.object({
  id: z.number(),
  title: z.string(),
  features: z.array(z.string()),
});

export const PlanSchema = z.object({ epics: z.array(EpicSchema) });

export const PlannedSchema = z.object({
  ...FeaturesSchema.shape,
  ...PlanSchema.shape,
  gone: z.array(z.string()),
});

export const ChangeSchema = z.discriminatedUnion("change", [
  z.object({
    change: z.literal("start"),
    title: z.string().trim().min(1, "an epic needs a title"),
  }),
  z.object({
    change: z.literal("pick"),
    feature: z.string().min(1, "only a feature with an id can be picked"),
    epic: z.number().int(),
  }),
  z.object({
    change: z.literal("take out"),
    feature: z.string(),
  }),
  z.object({
    change: z.literal("move epic"),
    epic: z.number().int(),
    before: z.number().int().optional(),
  }),
]);

export const RefusedSchema = z.object({ refused: z.string() });

export type Epic = z.infer<typeof EpicSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type Planned = z.infer<typeof PlannedSchema>;
export type Change = z.infer<typeof ChangeSchema>;
export type Refused = z.infer<typeof RefusedSchema>;
