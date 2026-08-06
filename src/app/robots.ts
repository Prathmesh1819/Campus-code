import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/admin", "/admin", "/_next/"],
    },
    sitemap: "https://campus-code-virid.vercel.app/sitemap.xml",
  };
}
