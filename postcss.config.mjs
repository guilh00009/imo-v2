import tailwindConfig from './tailwind.config.ts';

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: { config: tailwindConfig },
    autoprefixer: {},
  },
};

export default config;
