import { defineCollection, z } from 'astro:content';

const items = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    edad: z.string(),
    lugar: z.string(),
    horario: z.string(),
    image: z.string(), 
    category: z.string(), 
  }),
});

export const collections = {
  items,
};
