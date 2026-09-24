/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  outputFileTracingIncludes: {
    '/*': ['./public/fonts/**'],
  },
};

export default nextConfig;
