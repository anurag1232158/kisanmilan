// src/utils/auth.tsx
export function logout(router: any, skipConfirm = false) {
  if (typeof window !== "undefined") {

    if (!skipConfirm) {
      const confirmLogout = window.confirm("Are you sure you want to logout?");
      if (!confirmLogout) return;
    }

    const current = localStorage.getItem("authUser");
    let role: string | null = null;

    if (current) {
      try {
        role = JSON.parse(current).role;
      } catch {}
    }

    localStorage.removeItem("authUser");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("session_start");

    window.dispatchEvent(new Event("authChange"));

    if (role === "admin") {
      router.replace("/AdminLogin");
    } else {
      router.replace("/Login");
    }
  }
}