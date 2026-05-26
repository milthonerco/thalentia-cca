import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";

import vercel from "@astrojs/vercel";

export default defineConfig({

  output: "server",

  adapter:
    vercel(),

  integrations: [

    tailwind()

  ]

});