// Universal logout function
export function logout(router: any) {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("authUser");
    const role = user ? JSON.parse(user).role : null;

    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;

    localStorage.removeItem("authUser");

    // Redirect based on role
    if (role === "admin") router.replace("/AdminLogin");
    else router.replace("/AdminLogin");
  }
}
