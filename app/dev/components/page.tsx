import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gallery } from "./Gallery";
import { SitePreviews } from "./SitePreviews";

export const metadata: Metadata = {
  title: "Component gallery",
  robots: { index: false },
};

// Available locally and on Vercel previews, never in production.
export default function ComponentGalleryPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <Gallery>
      <SitePreviews />
    </Gallery>
  );
}
