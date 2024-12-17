import tailwindConfig from './tailwind.config.ts';

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: { 
      config: tailwindConfig 
    },
    autoprefixer: {},
  },
};

// Explicitly prevent fallback to JavaScript config
config.plugins.tailwindcss.config = tailwindConfig;

export default config;
