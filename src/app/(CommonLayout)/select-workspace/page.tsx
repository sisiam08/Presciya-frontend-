"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";


export default function SelectWorkspacePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-16 bg-surface">
      <div className="flex items-center text-on-surface-variant">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Redirecting to your dashboard…
      </div>
    </main>
  );
}
