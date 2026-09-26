/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["jose", "jwks-rsa"],
};

module.exports = nextConfig;
