import tailwindConfig from './tailwind.config.ts';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    // Forcefully prioritize TypeScript extensions
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.js'],
      '.mjs': ['.mts', '.mjs']
    };
    return config;
  },
  // Explicitly use the TypeScript Tailwind config
  tailwind: {
    config: tailwindConfig
  },
  // Additional configuration to ensure TypeScript config is used
  env: {
    TAILWIND_CONFIG_PATH: './tailwind.config.ts'
  }
};

export default nextConfig;
