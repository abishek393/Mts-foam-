/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  experimental: {
    // Product images reach the API through a server action, and server actions
    // cap the request body at 1 MB by default — which a single real photograph
    // exceeds. Multer accepts 6 files of 5 MB each, so the front door has to be
    // at least as wide as the back one, or large uploads fail before the API
    // ever sees them.
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },

  images: {
    // Next 16 blocks the image optimizer from fetching any host that resolves
    // to a private or local IP, as SSRF protection. In development the API is
    // on localhost:5000, so uploaded product photos are refused with a 400
    // ("url" parameter is not allowed) and render broken — while the seeded
    // placeholders keep working, because those are local /images paths Next
    // serves itself rather than fetching over HTTP.
    //
    // Enabled for development only. In production the API sits on a real
    // domain, and leaving this on would let anyone use the optimizer to probe
    // hosts inside the deployment's network.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",

    // The placeholder product imagery in /public is SVG. The optimizer refuses
    // SVG unless this is set; the sandbox CSP below keeps any script inside an
    // SVG from executing. Uploaded imagery cannot be SVG — the API's upload
    // filter accepts only JPEG, PNG and WebP.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
