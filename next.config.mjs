/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for GitHub Pages
  output: "export",
  
  // Disable Next.js image optimization (not supported on GitHub Pages)
  images: {
    unoptimized: true,
  },
  
  // Optional: Set basePath if deploying to a subdirectory
  // e.g., if your repo is "username.github.io/portfolio", set basePath: "/portfolio"
  // Leave commented out for root deployment or custom domain
  // basePath: "/your-repo-name",
  
  // Ensure trailing slashes for static hosting compatibility
  trailingSlash: true,
};

export default nextConfig;
