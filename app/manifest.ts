import type { MetadataRoute } from "next";

/** Installable-app manifest: Raktha is local-first, so it deserves a home-screen icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Raktha — Emergency Blood Donor Network",
    short_name: "Raktha",
    description:
      "Register donors, screen eligibility, post emergency blood requests and find compatible donors to call — works offline in your browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#b91c2e",
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
