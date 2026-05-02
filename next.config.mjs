/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Temporary while attachments are embedded in note HTML as base64.
      // Move media/PDF files to object storage before raising app file limits further.
      bodySizeLimit: "90mb",
    },
  },
};

export default nextConfig;
