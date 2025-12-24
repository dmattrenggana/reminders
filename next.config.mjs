/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/.well-known/farcaster.json",
        destination: "https://api.farcaster.xyz/miniapps/hosted-manifest/019ae4e2-2306-a7a6-e1e4-c07c554280b1",
        permanent: false,
      },
    ];
  },
  // CSP headers moved to vercel.json for better compatibility
  // vercel.json takes precedence and has more complete configuration
  webpack: (config, { isServer }) => {
    // Fix for @metamask/sdk trying to use React Native dependencies in browser
    // @react-native-async-storage/async-storage is not needed in browser environment
    // This is a dependency of @wagmi/connectors but we only use injected() connector
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
      };
      
      // Ignore the module entirely to prevent build errors
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
      };
    }
    return config;
  },
};

export default nextConfig;
