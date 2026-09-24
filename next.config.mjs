/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  outputFileTracingIncludes: {
    '/*': ['./public/fonts/**'],
    '/api/og-image': ['./public/fonts/**'],
    '/api/cron/publish': ['./public/fonts/**'],
  },
};

export default nextConfig;
