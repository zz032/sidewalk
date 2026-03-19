const nextConfig = {
  assetPrefix: '/assets',
  async rewrites() {
    return [
      { source: '/@vite/client', destination: '/vite-client-shim.js' },
      { source: '/@vite/:path*', destination: '/vite-client-shim.js' },
      // Map custom asset prefix back to Next's internal _next path
      { source: '/assets/:path*', destination: '/_next/:path*' },
    ]
  },
}
export default nextConfig
