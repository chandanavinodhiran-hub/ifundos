import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/ui/toast";
import CursorLight from "@/components/CursorLight";
import "./globals.css";

export const metadata: Metadata = {
  title: "iFundOS — Intelligent Fund Operating System",
  description: "Saudi Environmental Fund — Intelligent Fund Operating System for the Saudi Green Initiative",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <SessionProvider>
          <CursorLight />
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
