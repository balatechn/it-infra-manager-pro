/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pdfkit', 'exceljs'],
  },
};

module.exports = nextConfig;
