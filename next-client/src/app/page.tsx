"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isManager = hostname === "manager.kawaiimonkey.top";

    if (isManager) {
      if (localStorage.getItem("authToken")) {
        if (localStorage.getItem("clientLoggedIn") === "1") {
          router.replace("/client");
        } else {
          router.replace("/recruiter");
        }
      } else {
        router.replace("/login");
      }
    } else {
      router.replace("/candidate/jobs");
    }
  }, [router]);

  return null;
}
