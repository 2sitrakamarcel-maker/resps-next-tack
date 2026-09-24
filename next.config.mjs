/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  outputFileTracingIncludes: {
    '/api/og-image': ['./public/fonts/**'],
    '/api/cron/publish': ['./public/fonts/**'],
    '/api/debug-font': ['./public/fonts/**'],
  },
};

export default nextConfig;
