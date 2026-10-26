import type { Metadata } from "next";
import { Jost, Michroma } from "next/font/google";
import "./globals.css";

const michroma = Michroma({
  variable: "--font-michroma",
  weight: "400",
  subsets: ["latin"],
});

const jost = Jost({
  variable: "--font-jost",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TapTapAdd",
  description: "Turn your CV into a portfolio site, linked to a card you tap.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${michroma.variable} ${jost.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
