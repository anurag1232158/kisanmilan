"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSessionTimeout } from "./Timeout/UseSessionTimeout";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  useSessionTimeout();

  useEffect(() => {
    if (
      pathname === "/Login" ||
      pathname === "/AdminLogin" ||
      pathname === "/Register" ||
      pathname === "/AdminRegister"
    ) {
      return;
    }

    let savedUser: string | null = null;
    if (typeof window !== "undefined") {
      savedUser = localStorage.getItem("user");
    }

    const protectedAdmin = pathname.startsWith("/Admin");
    const protectedUser  =
      pathname.startsWith("/Checkout")   ||
      pathname.startsWith("/Profile")    ||
      pathname.startsWith("/Dashboard")  ||
      pathname.startsWith("/Orders")     ||
      pathname.startsWith("/ProductAdd");

    if (!savedUser) {
      if (protectedAdmin) router.replace("/AdminLogin");
      else if (protectedUser) router.replace("/Login");
      return;
    }

    try {
      const parsed = JSON.parse(savedUser);

      if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        if (protectedAdmin) router.replace("/AdminLogin");
        else if (protectedUser) router.replace("/Login");
        return;
      }

      if (parsed.role === "admin") {
        setRole("admin");
      } else if (
        parsed.role === "user"    ||
        parsed.role === "buyer"   ||
        parsed.role === "farmer"  ||
        parsed.role === "agent"   ||
        parsed.role === "dpartner"
      ) {
        setRole("user");
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        if (protectedAdmin) router.replace("/AdminLogin");
        else if (protectedUser) router.replace("/Login");
      }
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      if (protectedAdmin) router.replace("/AdminLogin");
      else if (protectedUser) router.replace("/Login");
    }
  }, [pathname, router]);

  // Auth pages — seedha render karo
  if (
    pathname === "/Login" ||
    pathname === "/Register" ||
    pathname === "/AdminLogin" ||
    pathname === "/AdminRegister"
  ) {
    return <>{children}</>;
  }

  // Admin pages — role check karo
  if (pathname.startsWith("/Admin")) {
    if (role !== "admin") return null;
    return <>{children}</>;
  }

  // Baaki sab pages
  return <>{children}</>;
}