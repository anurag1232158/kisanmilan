"use client";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const SESSION_MS = 30 * 60 * 1000; // 30 min
const WARN_BEFORE_MS = 1 * 60 * 1000; // 1 min before

export function useSessionTimeout() {
  const router = useRouter();
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);
  const warnTimer = useRef<NodeJS.Timeout | null>(null);

  const clearAll = () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
  };

  const doLogout = useCallback(() => {
    clearAll();

    localStorage.clear(); // ✅ clear all (avoid mismatch)
    window.dispatchEvent(new Event("authChange"));

    router.replace("/Login");
  }, [router]);

  const startTimers = useCallback(() => {
    clearAll();

    // ⚠️ Warning before logout
    warnTimer.current = setTimeout(() => {
      const stay = window.confirm(
        "Session expire hone wali hai. Continue?"
      );

      if (stay) {
        startTimers(); // restart
      } else {
        doLogout();
      }
    }, SESSION_MS - WARN_BEFORE_MS);

    // 🔥 Final logout
    logoutTimer.current = setTimeout(() => {
      doLogout();
    }, SESSION_MS);
  }, [doLogout]);

  const resetOnActivity = useCallback(() => {
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    startTimers();

    // ❌ REMOVE mousemove (important)
    const events = ["click", "keydown", "scroll"];

    events.forEach((e) =>
      window.addEventListener(e, resetOnActivity)
    );

    return () => {
      clearAll();
      events.forEach((e) =>
        window.removeEventListener(e, resetOnActivity)
      );
    };
  }, [startTimers, resetOnActivity]);
}