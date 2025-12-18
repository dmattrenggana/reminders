/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019ae4e2-2306-a7a6-e1e4-c07c554280b1'
        permanent: false,
        statusCode: 307,
      },
    ]
  },
};

export default nextConfig;
