"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

type Role = "farmer" | "buyer" | "agent" | "admin";
interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  location?: string;
  createdAt?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminUsers() {
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users,       setUsers]       = useState<User[]>([]);
  const [filtered,    setFiltered]    = useState<User[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [roleFilter,  setRoleFilter]  = useState<"All" | Role>("All");
  const [toast,       setToast]       = useState<{ msg: string; type: "success" | "danger" } | null>(null);
  const [editUser,    setEditUser]    = useState<User | null>(null);
  const [editSaving,  setEditSaving]  = useState(false);
  const [sortBy,      setSortBy]      = useState<"name" | "role" | "createdAt">("createdAt");
  const [sortDir,     setSortDir]     = useState<"asc" | "desc">("desc");
  const [viewUser,    setViewUser]    = useState<User | null>(null);

  // ─── Auth guard ───────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/AdminLogin"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin") { router.push("/"); return; }
    fetchUsers();
  }, []);

  // ─── Filter + sort ────────────────────────────────────────────
  useEffect(() => {
    let data = [...users];
    if (roleFilter !== "All") data = data.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.location?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
      );
    }
    data.sort((a, b) => {
      let av = a[sortBy] ?? "", bv = b[sortBy] ?? "";
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    setFiltered(data);
  }, [users, search, roleFilter, sortBy, sortDir]);

  // ─── API helpers ──────────────────────────────────────────────
  const getToken = () => localStorage.getItem("token") ?? "";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/user`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) { router.push("/AdminLogin"); return; }
      const data = await res.json();
      // Handle both array and { users: [] } shapes
      const arr = Array.isArray(data) ? data : (data.users ?? []);
      setUsers(arr);
    } catch (e) {
      console.error("fetchUsers error:", e);
      showToast("Server se connect nahi ho pa raha", "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = (msg: string, type: "success" | "danger" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" ko delete karna chahte ho?`)) return;
    try {
      const res = await fetch(`${API}/user/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      showToast(`${name} deleted ✅`);
      fetchUsers();
    } catch (e: any) {
      showToast(e.message, "danger");
    }
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const res = await fetch(`${API}/user/${editUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: editUser.name,
          email: editUser.email,
          role: editUser.role,
          location: editUser.location,
          phone: editUser.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      showToast("User updated ✅");
      setEditUser(null);
      fetchUsers();
    } catch (e: any) {
      showToast(e.message, "danger");
    } finally {
      setEditSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/AdminLogin");
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  // ─── UI helpers ───────────────────────────────────────────────
  const ROLE_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
    farmer: { bg: "#dcfce7", color: "#15803d", icon: "🌾" },
    buyer:  { bg: "#dbeafe", color: "#1d4ed8", icon: "🛒" },
    agent:  { bg: "#fef3c7", color: "#b45309", icon: "🏪" },
    // admin:  { bg: "#fce7f3", color: "#9d174d", icon: "🛡️" },
  };

  const RoleBadge = ({ role }: { role: string }) => {
    const s = ROLE_STYLE[role] ?? { bg: "#f3f4f6", color: "#374151", icon: "👤" };
    return (
      <span style={{
        background: s.bg, color: s.color,
        padding: "3px 10px", borderRadius: 20,
        fontSize: 11, fontWeight: 700,
        display: "inline-flex", alignItems: "center", gap: 4,
      }}>
        {s.icon} {role}
      </span>
    );
  };

  const Avatar = ({ name, size = 34 }: { name: string; size?: number }) => {
    const colors = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6"];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: color, color: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: size * 0.38, flexShrink: 0,
        textTransform: "uppercase",
      }}>
        {name?.charAt(0)}
      </div>
    );
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col
      ? <span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === "asc" ? "▲" : "▼"}</span>
      : <span style={{ marginLeft: 4, fontSize: 10, color: "#cbd5e1" }}>↕</span>;

  const roleCounts = {
    All:    users.length,
    farmer: users.filter(u => u.role === "farmer").length,
    buyer:  users.filter(u => u.role === "buyer").length,
    agent:  users.filter(u => u.role === "agent").length,
    // admin:  users.filter(u => u.role === "admin").length,
  };

  const navLinks = [
    { href: "/AdminDashboard", icon: "📊", label: "Dashboard" },
    { href: "/AdminUsers",     icon: "👥", label: "Users" },
    { href: "/AdminProducts",  icon: "📦", label: "Products" },
    { href: "/AdminOrders",    icon: "🧾", label: "Orders" },
    { href: "/AdminRates",     icon: "📈", label: "Rates" },
  ];

  // ─── Styles ───────────────────────────────────────────────────
  const TH: React.CSSProperties = {
    padding: "11px 14px", fontSize: 11, fontWeight: 700,
    color: "#64748b", background: "#f8fafc", textAlign: "left",
    userSelect: "none", cursor: "pointer", whiteSpace: "nowrap",
  };
  const TD: React.CSSProperties = {
    padding: "11px 14px", fontSize: 13,
    borderTop: "1px solid #f1f5f9", verticalAlign: "middle",
  };

  // ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", minHeight: "100vh",
     
      background: "#f1f5f9",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 224 : 64, background: "#0f172a",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease", overflow: "hidden",
        position: "sticky", top: 0, height: "100vh", flexShrink: 0,
      }}>
        <div style={{
          padding: "18px 16px", borderBottom: "1px solid #1e293b",
          display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap",
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🛡️</span>
          {sidebarOpen && (
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fbbf24" }}>
              kisanmilan
            </span>
          )}
        </div>

        <nav style={{ flex: 1, paddingTop: 8 }}>
          {navLinks.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 18px", color: active ? "#fbbf24" : "#94a3b8",
                textDecoration: "none", fontSize: 13, fontWeight: 500,
                background: active ? "#1e293b" : "transparent",
                borderLeft: active ? "3px solid #fbbf24" : "3px solid transparent",
                whiteSpace: "nowrap", transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && item.label}
              </Link>
            );
          })}
        </nav>

        <button onClick={logout} style={{
          margin: 10, padding: "10px 14px",
          background: "rgba(239,68,68,0.1)", color: "#ef4444",
          border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8,
          cursor: "pointer", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
        }}>
          <span style={{ flexShrink: 0 }}>🚪</span>
          {sidebarOpen && "Logout"}
        </button>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          background: "white", padding: "0 24px", height: 58,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky", top: 0, zIndex: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(o => !o)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 20, color: "#64748b", padding: 4,
              borderRadius: 6, lineHeight: 1,
            }}>☰</button>
            <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>
              👥 Users Management
            </span>
            <span style={{
              background: "#f1f5f9", color: "#64748b",
              borderRadius: 20, padding: "2px 10px",
              fontSize: 11, fontWeight: 600,
            }}>
              {filtered.length} results
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={fetchUsers} style={{
              background: "#f0fdf4", color: "#16a34a",
              border: "1px solid #bbf7d0", borderRadius: 8,
              padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>🔄 Refresh</button>
            <span style={{
              background: "#fbbf24", color: "#1e293b",
              borderRadius: 20, padding: "4px 14px",
              fontWeight: 700, fontSize: 12,
            }}>🛡️ Admin</span>
          </div>
        </header>

        <main style={{ padding: 24, flex: 1 }}>

          {/* Toast */}
          {toast && (
            <div style={{
              position: "fixed", top: 20, right: 20, zIndex: 9999,
              background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
              color: toast.type === "success" ? "#15803d" : "#dc2626",
              padding: "12px 20px", borderRadius: 10,
              fontWeight: 600, fontSize: 13,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              display: "flex", alignItems: "center", gap: 8,
              animation: "slideIn 0.2s ease",
            }}>
              {toast.type === "success" ? "✅" : "❌"} {toast.msg}
            </div>
          )}

          {/* Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14, marginBottom: 20,
          }}>
            {[
              { label: "Total Users", value: roleCounts.All,    color: "#6366f1", icon: "👥", bg: "#eef2ff" },
              { label: "Farmers",     value: roleCounts.farmer, color: "#16a34a", icon: "🌾", bg: "#f0fdf4" },
              { label: "Buyers",      value: roleCounts.buyer,  color: "#0284c7", icon: "🛒", bg: "#f0f9ff" },
              { label: "Agents",      value: roleCounts.agent,  color: "#d97706", icon: "🏪", bg: "#fffbeb" },
              // { label: "Admins",      value: roleCounts.admin,  color: "#9d174d", icon: "🛡️", bg: "#fdf2f8" },
            ].map(c => (
              <div key={c.label} style={{
                background: "white", borderRadius: 12,
                padding: "16px 18px", borderTop: `3px solid ${c.color}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                cursor: "pointer", transition: "transform 0.15s",
              }}
                onClick={() => setRoleFilter(c.label === "Total Users" ? "All" : c.label.toLowerCase().replace("s","") as any)}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: c.bg, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 18, marginBottom: 8,
                }}>{c.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: c.color, lineHeight: 1 }}>
                  {c.value}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 600 }}>
                  {c.label}
                </div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div style={{
            background: "white", borderRadius: 12, padding: "14px 18px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 16,
            display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
          }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <span style={{
                position: "absolute", left: 10, top: "50%",
                transform: "translateY(-50%)", fontSize: 14, color: "#94a3b8",
              }}>🔍</span>
              <input
                placeholder="Name, email, phone ya location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px 8px 32px",
                  border: "1px solid #e2e8f0", borderRadius: 8,
                  fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{
                  position: "absolute", right: 8, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", fontSize: 16, padding: 2,
                }}>×</button>
              )}
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["All", "farmer", "buyer", "agent"] as const).map(r => (
                <button key={r} onClick={() => setRoleFilter(r)} style={{
                  padding: "7px 14px", borderRadius: 20, fontSize: 12,
                  fontWeight: 600, cursor: "pointer", border: "none",
                  background: roleFilter === r ? "#0f172a" : "#f1f5f9",
                  color: roleFilter === r ? "white" : "#64748b",
                  transition: "all 0.15s",
                }}>
                  {r === "All" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
                  {" "}({roleCounts[r as keyof typeof roleCounts]})
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: "white", borderRadius: 12, overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              padding: "14px 18px", borderBottom: "1px solid #f1f5f9",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                Showing {filtered.length} of {users.length} users
              </span>
              {search && (
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Search: "<strong>{search}</strong>"
                </span>
              )}
            </div>

            {loading ? (
              <div style={{
                textAlign: "center", padding: 80,
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, border: "3px solid #e2e8f0",
                  borderTopColor: "#16a34a", borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }} />
                <span style={{ color: "#94a3b8", fontSize: 13 }}>Users load ho rahe hain...</span>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={TH}>#</th>
                      <th style={TH} onClick={() => toggleSort("name")}>
                        Name <SortIcon col="name" />
                      </th>
                      <th style={TH}>Email</th>
                      <th style={TH}>Phone</th>
                      <th style={TH} onClick={() => toggleSort("role")}>
                        Role <SortIcon col="role" />
                      </th>
                      <th style={TH}>Location</th>
                      <th style={TH} onClick={() => toggleSort("createdAt")}>
                        Joined <SortIcon col="createdAt" />
                      </th>
                      <th style={TH}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{
                          ...TD, textAlign: "center", color: "#94a3b8", padding: 60,
                        }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>😕</div>
                          <div style={{ fontWeight: 600 }}>Koi user nahi mila</div>
                          {search && (
                            <button onClick={() => setSearch("")} style={{
                              marginTop: 10, padding: "6px 16px",
                              borderRadius: 8, border: "none",
                              background: "#f1f5f9", color: "#64748b",
                              cursor: "pointer", fontSize: 12, fontWeight: 600,
                            }}>Clear Search</button>
                          )}
                        </td>
                      </tr>
                    ) : filtered.map((u, i) => (
                      <tr key={u._id} style={{
                        background: i % 2 === 0 ? "white" : "#fafafa",
                        transition: "background 0.1s",
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafafa")}
                      >
                        <td style={{ ...TD, color: "#94a3b8", fontWeight: 600, fontSize: 12 }}>
                          {i + 1}
                        </td>
                        <td style={TD}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={u.name ?? "?"} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                ID: {u._id.slice(-6)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...TD, color: "#64748b", fontSize: 12 }}>{u.email}</td>
                        <td style={{ ...TD, fontSize: 12 }}>{u.phone || "—"}</td>
                        <td style={TD}><RoleBadge role={u.role ?? "buyer"} /></td>
                        <td style={{ ...TD, fontSize: 12, color: "#64748b" }}>
                          {u.location ? `📍 ${u.location}` : "—"}
                        </td>
                        <td style={{ ...TD, fontSize: 11, color: "#94a3b8" }}>
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td style={TD}>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => setViewUser(u)} title="View" style={{
                              padding: "5px 9px", borderRadius: 6,
                              fontSize: 13, cursor: "pointer",
                              background: "#f0f9ff", color: "#0284c7",
                              border: "none", fontWeight: 600,
                            }}>👁️</button>
                            <button onClick={() => setEditUser({ ...u })} title="Edit" style={{
                              padding: "5px 9px", borderRadius: 6,
                              fontSize: 13, cursor: "pointer",
                              background: "#fef3c7", color: "#b45309",
                              border: "none", fontWeight: 600,
                            }}>✏️</button>
                            <button onClick={() => handleDelete(u._id, u.name)} title="Delete" style={{
                              padding: "5px 9px", borderRadius: 6,
                              fontSize: 13, cursor: "pointer",
                              background: "#fee2e2", color: "#dc2626",
                              border: "none", fontWeight: 600,
                            }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── View Modal ── */}
      {viewUser && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={() => setViewUser(null)}>
          <div style={{
            background: "white", borderRadius: 16, padding: 28,
            width: "100%", maxWidth: 400,
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20, gap: 10 }}>
              <Avatar name={viewUser.name ?? "?"} size={64} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#1e293b" }}>{viewUser.name}</div>
                <RoleBadge role={viewUser.role} />
              </div>
            </div>
            {[
              { icon: "📧", label: "Email",    val: viewUser.email },
              { icon: "📱", label: "Phone",    val: viewUser.phone || "—" },
              { icon: "📍", label: "Location", val: viewUser.location || "—" },
              { icon: "🗓️",  label: "Joined",   val: viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" }) : "—" },
              { icon: "🔑", label: "User ID",  val: viewUser._id },
            ].map(row => (
              <div key={row.label} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 0", borderBottom: "1px solid #f1f5f9",
              }}>
                <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{row.icon}</span>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, width: 70 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: "#1e293b", wordBreak: "break-all" }}>{row.val}</span>
              </div>
            ))}
            <button onClick={() => setViewUser(null)} style={{
              width: "100%", marginTop: 20, padding: "10px",
              borderRadius: 8, background: "#f1f5f9", color: "#64748b",
              border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}>Close</button>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editUser && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={() => setEditUser(null)}>
          <div style={{
            background: "white", borderRadius: 16, padding: 28,
            width: "100%", maxWidth: 420,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <Avatar name={editUser.name ?? "?"} size={40} />
              <div>
                <h5 style={{ fontWeight: 700, margin: 0, color: "#1e293b", fontSize: 16 }}>
                  ✏️ Edit User
                </h5>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{editUser.email}</span>
              </div>
            </div>

            {([
              { label: "Name",     key: "name",     type: "text",  icon: "👤" },
              { label: "Email",    key: "email",    type: "email", icon: "📧" },
              { label: "Phone",    key: "phone",    type: "text",  icon: "📱" },
              { label: "Location", key: "location", type: "text",  icon: "📍" },
            ] as const).map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>
                  {f.icon} {f.label}
                </label>
                <input
                  type={f.type}
                  value={(editUser as any)[f.key] ?? ""}
                  onChange={e => setEditUser({ ...editUser, [f.key]: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 12px",
                    border: "1px solid #e2e8f0", borderRadius: 8,
                    fontSize: 13, outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#16a34a")}
                  onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>
                🎭 Role
              </label>
              <select
                value={editUser.role ?? "buyer"}
                onChange={e => setEditUser({ ...editUser, role: e.target.value as Role })}
                style={{
                  width: "100%", padding: "9px 12px",
                  border: "1px solid #e2e8f0", borderRadius: 8,
                  fontSize: 13, outline: "none", background: "white",
                }}
              >
                {(["farmer", "buyer", "agent"] as const).map(r => (
                  <option key={r} value={r}>
                    {ROLE_STYLE[r].icon} {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleEditSave} disabled={editSaving} style={{
                flex: 1, padding: "10px", borderRadius: 8,
                background: editSaving ? "#86efac" : "#16a34a",
                color: "white", border: "none",
                fontWeight: 700, cursor: editSaving ? "not-allowed" : "pointer",
                fontSize: 14, transition: "background 0.2s",
              }}>
                {editSaving ? "⏳ Saving..." : "✅ Save Changes"}
              </button>
              <button onClick={() => setEditUser(null)} style={{
                flex: 1, padding: "10px", borderRadius: 8,
                background: "#f1f5f9", color: "#64748b",
                border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14,
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}