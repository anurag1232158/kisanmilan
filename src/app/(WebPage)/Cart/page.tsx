"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function CartPage() {
  const router = useRouter(); 
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/Login");
        return;
      }
      const res = await fetch(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCart(Array.isArray(data) ? data : []);
    } catch {
      setCart([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCart();
  }, []);
  const removeItem = async (id: string) => {
    if (!confirm("Remove this item from cart?")) return;
    setRemovingId(id);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/cart/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart((prev) => prev.filter((item) => item._id !== id));
      showToast("Item removed from cart");
    } catch {
      showToast("Failed to remove item", "error");
    } finally {
      setRemovingId(null);
    }
  };
  const updateQty = async (id: string, qty: number) => {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/cart/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: qty }),
      });
      setCart((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, quantity: qty } : item,
        ),
      );
    } catch {
      showToast("Failed to update quantity", "error");
    } finally {
      setUpdatingId(null);
    }
  };
  const total = cart.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0,
  );
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const savings = 0; // Can add discount logic here
  if (loading)
    return (
      <>
      </>
    );

  return (
    <div className="bg-light py-4 pt-2">
    
      {/* TOAST */}
      {toast && (
        <div className={`position-fixed top-0 end-0 m-3 fs-6 rounded-3 alert alert-${toast.type === "success" ? "success" : "danger"} shadow d-flex align-items-center gap-2`}
          style={{ zIndex: 9999, minWidth: 280, opacity: 0.9 }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3 px-3 py-1 bg-success text-white rounded-3 shadow-sm">
        <div className="container py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex flex-column text-white">
            <h4 className="fw-bold mb-0 text-white">🛒 Shopping Cart</h4>
            <small className="text-gray-200">
              {totalItems} item{totalItems !== 1 ? "s" : ""} in your cart
            </small>
          </div>
          <Link href="/Product" className="btn btn-outline-warning text-warning btn-sm px-3 rounded-3"> ← Continue Shopping</Link>
        </div>
      </div>
      </div>

      <div className="container py-4">
        {/* EMPTY CART */}
        {cart.length === 0 ? (
          <div className="text-center py-2">
            <div>🛒</div>
            <h4 className="mt-3 fw-bold">Your cart is empty</h4>
            <p className="text-muted"> Looks like you haven't added anything yet.</p>
            <button className="btn btn-success px-5 py-2 mt-2 rounded-3" onClick={() => router.push("/Product")}> Browse Products</button>
          </div>
         ) : (
          <div className="row g-4">

            <div className="col-lg-8">
              <div className="d-flex justify-content-between align-items-center mb-1 px-3 py-2 bg-white rounded-3">
                <h6 className="fw-semibold mb-0 fs-6"> Cart Items <span className="badge bg-success text-white"> {cart.length} </span> </h6>
                <button className="btn btn-link text-danger p-0 fs-6"  
                onClick={() => { if (confirm("Clear all items from cart?")) { cart.forEach((item) => removeItem(item._id)); } }}> 🗑 Clear All</button>
              </div>
     {cart.slice(0, visibleCount).map((item) => (
     
      <div key={item._id} className="card border-0 shadow-sm mb-2 rounded-3" style={{ opacity: removingId === item._id ? 0.5 : 1, transition: "opacity 0.3s" }}>
       
       <div className="row g-0 align-items-center position-relative"> 
       <div className="col-3">
        <img src={item.product?.image_url || "https://placehold.co/200"}
          className="img-fluid p-2 bg-light rounded-3 w-100"
          alt={item.product?.product_name} />
      </div>

      <div className="col-5 px-3 py-2">
        {/* ✅ Sold by moved to TOP inside col-5, not absolute */}
        <div className="fw-normal my-2 fs-7">
          🧑‍🌾 Sold by: {item.product?.farmer_name || "Unknown Farmer"}
        </div>
        <h6 className="fw-bold mb-2 fs-5">{item.product?.product_name}</h6>
        <div className="py-1 fs-7">{item.product?.description}</div>
        <div className="mb-2">
          {item.product?.category && (
            <span className="badge bg-success bg-opacity-10 text-white mb-2 fs-8 fw-semibold rounded-3">
              {item.product.category}
            </span>
          )}
        </div>
        <div className="text-success fw-bold fs-6">
          ₹{item.product?.price}
          {item.product?.unit && (
            <span className="text-muted fw-normal fs-5">/ {item.product.unit}</span>
          )}
        </div>
      </div>
      <div className="col-4 p-3 text-end">
          <div className="fs-8 mb-2 position-absolute top-0 end-0 bg-warning px-2 py-1 rounded-3 w-bold">
          {item.product?.stock > 0
            ? `In stock: ${item.product.stock} ${item.product.unit || ""}`
            : "Out of stock"}
        </div>

        <div className="fw-bold text-success mb-2 fs-6">
        Amount: ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
        </div>

        <div className="d-flex align-items-center justify-content-end gap-2 my-3">
          <span className="text-muted fs-5">Qty:</span>
          <div className="d-flex align-items-center border rounded-3 overflow-hidden">
            <button className="btn btn-light border-0 px-3 py-1 fs-6"
              disabled={updatingId === item._id || item.quantity <= 1}
              onClick={() => updateQty(item._id, item.quantity - 1)}>−
            </button>
            <span className="px-3 py-0 fw-semibold border text-center fs-6">
              {updatingId === item._id
                ? <span className="spinner-border spinner-border-sm" />
                : item.quantity}
            </span>
            <button className="btn btn-light border-0 px-3 py-1 fs-6"
              disabled={updatingId === item._id}
              onClick={() => updateQty(item._id, item.quantity + 1)}>+
            </button>
          </div>
        </div>
        <button className="btn btn-outline-danger btn-sm rounded-3 fs-7 py-0"
          onClick={() => removeItem(item._id)}
          disabled={removingId === item._id}>
          🗑 Remove
        </button>
      </div>

    </div>
  </div>
))}

{cart.length > 4 && (
  <div className="text-center mt-3">
    {visibleCount < cart.length ? (
      <button
        className="btn btn-outline-success px-4 rounded-3"
        onClick={() => setVisibleCount(cart.length)}
      >
        Show More ⬇️
      </button>
    ) : (
      <button
        className="btn btn-outline-secondary px-4 rounded-3"
        onClick={() => setVisibleCount(4)}
      >
        Show Less ⬆️
      </button>
    )}
  </div>
)}
            </div>

            {/* RIGHT: ORDER SUMMARY */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm sticky-top" style={{ borderRadius: 14, top: 80 }} >
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Order Summary</h5>
                  <hr className="my-3" />

                  <div className="d-flex justify-content-between mb-2 fs-6">
                    <span className="text-muted"> Subtotal ({totalItems} items) </span>
                    <span className="fw-semibold"> ₹{total.toLocaleString()} </span>
                  </div>

                  <div className="d-flex justify-content-between mb-2 fs-6">
                    <span className="text-muted">Delivery</span>
                    <span className="text-success fw-semibold">Free</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 fs-6">
                    <span className="text-muted">Tax</span>
                    <span className="fw-semibold">₹0</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 fs-6">
                    <span className="text-muted">Discount</span>
                    <span className="text-danger fw-semibold"> −₹{savings} </span>
                  </div>

                  {savings > 0 && (
                    <div className="d-flex justify-content-between mb-2 fs-6">
                      <span className="text-muted">Savings</span>
                      <span className="text-danger fw-semibold"> −₹{savings} </span>
                    </div>
                  )}

                  <hr className="my-2" />
                  <div className="d-flex justify-content-between mb-4 fs-5">
                    <span className="fw-bold">Total</span>
                    <span className="fw-bold text-success"> ₹{total.toLocaleString()} </span>
                  </div>

                  <button className="btn btn-success w-100 py-2 fw-bold fs-6 rounded-3" 
                  onClick={() => router.push("/Checkout")}>⚡ Proceed to Checkout</button>
                  <div className="text-center mt-3">
                   <small className="text-muted"> 🔒 Secure & Safe Checkout</small>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="card-footer bg-transparent border-top px-4 py-3">
                  <div className="row g-2 text-center">
                    {[
                      { icon: "🚚", label: "Free Delivery" },
                      { icon: "↩️", label: "Easy Returns" },
                      { icon: "🌿", label: "Fresh Products" },
                    ].map((b) => (
                      <div key={b.label} className="col-4">
                        <div className="fs-8">{b.icon}</div>
                        <div className="text-muted fs-8">  {b.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
