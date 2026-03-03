import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "iFundOS — Saudi Green Initiative Fund Management",
  description:
    "Intelligent fund management for the Saudi Green Initiative. SAR 188 billion deployed with precision.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
