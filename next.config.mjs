/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['@resvg/resvg-js', 'sharp'],
  outputFileTracingIncludes: {
    '/api/og-image': ['./public/fonts/**'],
    '/api/cron/publish': ['./public/fonts/**'],
    '/api/debug-font': ['./public/fonts/**'],
  },
};

export default nextConfig;
