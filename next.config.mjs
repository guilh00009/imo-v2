import tailwindConfig from './tailwind.config.ts';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.js']
    };
    return config;
  },
  // Explicitly use the TypeScript Tailwind config
  tailwind: {
    config: tailwindConfig
  }
};

export default nextConfig;
