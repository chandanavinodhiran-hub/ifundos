import { AppLayout } from "@/components/layout/app-layout";

/**
 * Layout for all authenticated pages — wraps with sidebar + topbar
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
