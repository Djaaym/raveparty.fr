import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // `/suivi` and `/admin` are the owner's private pages, and `/api/` answers nothing a crawler can
    // use. Disallow is politeness, not protection, the password on /api/track/stats is
    // what actually closes the door.
    rules: { userAgent: "*", allow: "/", disallow: ["/suivi", "/admin", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
