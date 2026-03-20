"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const AdminOnlyWrapper = dynamic(
  () => import("../../../(AdminPage)/Dynamic/AdminOnlyWrapper/AdminNavFooter"),
  { ssr: false }
);
const ClientOnlyWrapper = dynamic(
  () => import("../ClientOnlyWrapper/UserNavFooter"),
  { ssr: false }
);

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<"admin" | "user" | null>(null);

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
      // ✅ 'user' key use karo — 'authUser' nahi
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

      // Expiry check
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
        parsed.role === "user"   ||
        parsed.role === "buyer"  ||
        parsed.role === "farmer" ||
        parsed.role === "agent"
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

  if (
    pathname === "/Login" ||
    pathname === "/Register" ||
    pathname === "/AdminLogin" ||
    pathname === "/AdminRegister"
  )
    return <>{children}</>;

  if (pathname.startsWith("/Admin")) {
    if (role !== "admin") return null;
    return <AdminOnlyWrapper>{children}</AdminOnlyWrapper>;
  }

  return <ClientOnlyWrapper>{children}</ClientOnlyWrapper>;
}