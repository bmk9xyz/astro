// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import astroIcon from 'astro-icon';
import mdx from '@astrojs/mdx';
import playformCompress from "@playform/compress";

import react from "@astrojs/react";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx(), astroIcon({
    include: {
      mdi: ["*"],
      ri: ['*'],
      'simple-icons': ['*'],
    },
  }), playformCompress({
    CSS: false,
    Image: false,
    Action: {
      Passed: async () => true,  
    },
  }), react()],
  output: "server",
  adapter: cloudflare(),
  
});