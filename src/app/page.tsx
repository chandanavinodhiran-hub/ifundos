import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/** Root page — redirects authenticated users to their role-specific dashboard */
export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "CONTRACTOR":
      redirect("/contractor");
    case "FUND_MANAGER":
      redirect("/dashboard");
    case "ADMIN":
      redirect("/admin");
    case "AUDITOR":
      redirect("/audit");
    default:
      redirect("/login");
  }
}
