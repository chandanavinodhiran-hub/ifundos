"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function EvidenceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/grants?filter=evidence");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
    </div>
  );
}
