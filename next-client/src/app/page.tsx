"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isManager = hostname === "manager.kawaiimonkey.top";

    if (isManager) {
      router.replace("/login");
    } else {
      router.replace("/candidate/jobs");
    }
  }, [router]);

  return null;
}
