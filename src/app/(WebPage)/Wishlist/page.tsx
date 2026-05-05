"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = `${process.env.NEXT_PUBLIC_API_URL}`;

interface WishlistItem {
  _id: string;
  createdAt: string;
  product_id: {
    _id: string;
    product_name: string;
    image_url: string;
    price: number;
    stock: number;
    category: string;
    unit: string;
    description: string;
    is_available: boolean;
    location: string;
    farmer_id: {
      _id: string;
      name: string;
      phone: string;
      location: string;
    } | null;
  };
} 

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchWishlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/Login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWishlist(Array.isArray(data) ? data : []);
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (productId: string, wishlistItemId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setRemovingId(wishlistItemId);
    try {
      const res = await fetch(`${API}/wishlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json();
      if (data.action === "removed") {
        setWishlist((prev) => prev.filter((item) => item._id !== wishlistItemId));
        showToast("💔 Wishlist se remove ho gaya");
      }
    } catch {
      showToast("Remove nahi ho paya", "error");
    } finally {
      setRemovingId(null);
    }
  };

  const addToCart = async (productId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/Login");
      return;
    }
    try {
      const res = await fetch(`${API}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("🛒 Cart mein add ho gaya!");
      } else {
        showToast(data.message || data.error || "Add nahi hua", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  if (loading)
    return (
      <>
     
      </>
    );

  return (
        <div className="bg-light py-4 pt-2">
      <div className="container-fluid">
      {/* Toast */}
      {toast && (
        <div
          className={`position-fixed top-0 end-0 m-3 alert alert-${toast.type === "success" ? "success" : "danger"} shadow d-flex align-items-center gap-2`}
          style={{ zIndex: 9999, minWidth: 280, borderRadius: 12, fontSize: 14 }}
        >
          <span>{toast.msg}</span>
          <button className="btn-close ms-auto" style={{ fontSize: 10 }} onClick={() => setToast(null)} />
        </div>
      )}
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-success text-white rounded-3 shadow-sm">
          <div>
            <h5 className="mb-0 fw-bold text-white">❤️ Meri Wishlist</h5>
            <small className="opacity-75">{wishlist.length} product{wishlist.length !== 1 ? "s" : ""} saved</small>
          </div>
          <Link href="/Product" className="btn btn-warning btn-sm fw-semibold" style={{ borderRadius: 8 }}>
            🛍️ Aur Products Dekho
          </Link>
        </div>
        </div>
           
      <div className="container pb-3">

        {wishlist.length === 0 ? (
          /* Empty State */
          <div className="text-center py-5">
            <div style={{ fontSize: 72 }}>💔</div>
            <h4 className="mt-3 fw-bold">Wishlist Khaali Hai</h4>
            <p className="text-muted">Koi product pasand aaya toh ❤️ dabao aur yahaan save karo</p>
            <Link href="/Product" className="btn btn-success px-4 py-2 mt-2 fw-semibold" style={{ borderRadius: 10 }}>
              🌾 Products Browse Karo
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {wishlist.map((item) => {
              const p = item.product_id;
              if (!p) return null;

              const isOutOfStock = !p.stock || p.stock === 0;
              const farmerName = p.farmer_id?.name || "Unknown Farmer";
              const farmerLocation = p.farmer_id?.location || p.location || "";

              return (
                <div key={item._id} className="col-12 col-md-6 col-lg-4">
                  <div
                    className="card border-0 shadow-sm h-100"
                    style={{ borderRadius: 16, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "";
                    }}
                  >
                    {/* Product Image */}
                    <div className="position-relative" style={{ height: 200, background: "#f8f9fa" }}>
                      <img
                        src={p.image_url || "https://placehold.co/400x300"}
                        alt={p.product_name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/400x300"; }}
                      />
                      {/* Category Badge */}
                      {p.category && (
                        <span
                          className="position-absolute badge bg-warning text-dark"
                          style={{ top: 10, left: 10, borderRadius: 8, fontSize: 11, fontWeight: 600 }}
                        >
                          🌿 {p.category}
                        </span>
                      )}
                      {/* Out of Stock Badge */}
                      {isOutOfStock && (
                        <span
                          className="position-absolute badge bg-danger"
                          style={{ top: 10, right: 10, borderRadius: 8, fontSize: 11 }}
                        >
                          Out of Stock
                        </span>
                      )}
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromWishlist(p._id, item._id)}
                        disabled={removingId === item._id}
                        className="position-absolute btn btn-light shadow-sm d-flex align-items-center justify-content-center"
                        style={{ bottom: 10, right: 10, borderRadius: "50%", width: 36, height: 36, padding: 0, fontSize: 16 }}
                        title="Wishlist se hatao"
                      >
                        {removingId === item._id ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : "❤️"}
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className="card-body p-3 d-flex flex-column gap-2">
                      {/* Product Name */}
                      <h5 className="fw-bold pb-2 border-bottom">
                        {p.product_name}
                      </h5>

                      {/* Price */}
                      <div className="d-flex align-items-baseline gap-1">
                        <span className="fw-bold text-success" style={{ fontSize: 20 }}>₹{p.price}</span>
                        <span className="text-muted" style={{ fontSize: 12 }}>/ {p.unit}</span>
                      </div>

                      {/* Farmer Info */}
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="d-flex align-items-center justify-content-center text-white rounded-circle flex-shrink-0"
                          style={{ width: 28, height: 28, background: "#198754", fontSize: 11, fontWeight: 700 }}
                        >
                          {farmerName[0]?.toUpperCase() || "F"}
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ fontSize: 12 }}>👨‍🌾 {farmerName}</div>
                          {farmerLocation && (
                            <div className="text-muted" style={{ fontSize: 11 }}>📍 {farmerLocation}</div>
                          )}
                        </div>
                      </div>

                      {/* Stock Info */}
                      <div className="d-flex flex-wrap gap-1">
                        <span
                          className={`badge px-2 py-2 ${isOutOfStock ? "bg-danger" : "bg-success"} bg-opacity-10 ${isOutOfStock ? "text-danger" : "text-white"}`}
                          style={{ borderRadius: 6, fontSize: 11, fontWeight: 600 }}
                        >
                          {isOutOfStock
                            ? "⚠️ Out of Stock"
                            : `✅ Stock: ${p.stock} ${p.unit}`}
                        </span>
                      </div>

                      {/* Description */}
                      {p.description && (
                        <p className="text-muted mb-0" style={{ fontSize: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {p.description}
                        </p>
                      )}

                      {/* Added Date */}
                      <div className="text-muted" style={{ fontSize: 11 }}>
                        ❤️ Added: {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex gap-2 mt-auto pt-2">
                        <Link
                          href={`/ProductDetails/${p._id}`}
                          className="btn btn-outline-success flex-grow-1 py-1 fw-semibold"
                          style={{ borderRadius: 8, fontSize: 13 }}
                        >
                          👁️ Detail
                        </Link>
                        <button
                          className="btn btn-success flex-grow-1 py-1 fw-semibold"
                          style={{ borderRadius: 8, fontSize: 13 }}
                          onClick={() => addToCart(p._id)}
                          disabled={isOutOfStock}
                        >
                          🛒 Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}