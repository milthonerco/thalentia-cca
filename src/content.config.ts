import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const items = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/items" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    edad: z.string().optional(),
    lugar: z.string().optional(),
    horario: z.string().optional(),
    image: z.string().optional(),
    category: z.string(),
  }),
});

export const collections = { items };