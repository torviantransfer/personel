import type { MetadataRoute } from "next";

/** Uygulama arama motorlarına kapalıdır. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
