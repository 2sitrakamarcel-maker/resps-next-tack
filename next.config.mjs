/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  outputFileTracingIncludes: {
    '/api/og-image': ['./public/fonts/**', './node_modules/harfbuzzjs/**', './node_modules/satori/yoga.wasm'],
    '/api/cron/publish': ['./public/fonts/**', './node_modules/harfbuzzjs/**', './node_modules/satori/yoga.wasm'],
    '/api/debug-font': ['./public/fonts/**'],
  },
};

export default nextConfig;
