"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
const API = `${process.env.NEXT_PUBLIC_API_URL}`;
type Step = "address" | "payment" | "confirm" | "success";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buyNowProductId = searchParams.get("product");
  const buyNowQty       = Number(searchParams.get("qty") || "1");
  const isBuyNow        = searchParams.get("mode") === "buynow" && !!buyNowProductId;
  const isReorder       = searchParams.get("mode") === "reorder"; // ← NEW
  const reorderOrigId   = searchParams.get("orderId") || "";       // ← NEW

  const [user, setUser]       = useState<any>(null);
  const [cart, setCart]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep]       = useState<Step>(isReorder ? "payment" : "address"); // ← reorder skips address step
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [address, setAddress] = useState({ name: "", phone: "", pincode: "", city: "", state: "", street: "" });
  const [payMethod, setPayMethod] = useState<"UPI" | "COD" | "Card" | "NetBanking">("COD");
  const [upiId, setUpiId]     = useState("");
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [reorderData, setReorderData] = useState<any>(null); // ← NEW

  const [reviewStep, setReviewStep]         = useState(false);
  const [reviewProduct, setReviewProduct]   = useState<any>(null);
  const [reviewRating, setReviewRating]     = useState(5);
  const [reviewComment, setReviewComment]   = useState("");
  const [reviewHover, setReviewHover]       = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone]         = useState(false);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (!u) { router.push("/Login"); return; }
    setUser(u);

    if (isReorder) {
      // ── Load reorder data from sessionStorage ──
      const raw = sessionStorage.getItem("reorder_data");
      if (!raw) { router.push("/Orders"); return; }
      const data = JSON.parse(raw);
      setReorderData(data);

      // Parse existing address into form fields
      const parts = (data.delivery_address || "").split("|").map((s: string) => s.trim());
      const addrParts = (parts[0] || "").split(",");
      setAddress({
        name:    parts[1] || u.name || "",
        phone:   parts[2] || u.phone || "",
        street:  addrParts[0]?.trim() || "",
        city:    addrParts[1]?.trim() || "",
        state:   addrParts[2]?.replace(/\s*-\s*\d+/, "").trim() || "",
        pincode: (addrParts[2]?.match(/\d{6}/) || [""])[0],
      });

      // Build synthetic cart item from stored order data
      setCart([{
        _id: `reorder-${data.orderId}`,
        product: {
          _id:          data.product_id,
          product_name: data.product_name,
          price:        data.total_price / data.quantity,
          unit:         data.unit,
          farmer_id:    data.farmer_id,
          image_url:    "",
        },
        quantity:  data.quantity,
        isReorder: true,
      }]);
      setLoading(false);
    } else {
      setAddress((a) => ({ ...a, name: u.name || "", phone: u.phone || "" }));
      if (isBuyNow) {
        loadBuyNowProduct(buyNowProductId!, buyNowQty);
      } else {
        fetchCart();
      }
    }
  }, []);

  const loadBuyNowProduct = async (productId: string, qty: number) => {
    try {
      const res = await fetch(`${API}/products/${productId}`);
      const product = await res.json();
      if (!product || product.error) { router.push("/Product"); return; }
      setCart([{ _id: `buynow-${productId}`, product, quantity: qty, isBuyNow: true }]);
    } catch {
      router.push("/Product");
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      if (items.length === 0) { router.push("/Cart"); return; }
      setCart(items);
    } catch {
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (item: any) => {
    if (!confirm("Remove this item?")) return;
    if (item.isBuyNow || item.isReorder) { router.back(); return; }
    const token = localStorage.getItem("token");
    await fetch(`${API}/cart/${item._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setCart((prev) => prev.filter((i) => i._id !== item._id));
  };

  const total = useMemo(
    () => cart.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0),
    [cart]
  );

  const validateAddress = () => {
    const e: Record<string, string> = {};
    if (!address.name.trim())                             e.name    = "Full name is required";
    if (!/^[6-9]\d{9}$/.test(address.phone))             e.phone   = "Enter a valid 10-digit mobile number";
    if (!/^\d{6}$/.test(address.pincode))                e.pincode = "Enter a valid 6-digit pincode";
    if (!address.city.trim())                             e.city    = "City is required";
    if (!address.state.trim())                            e.state   = "State is required";
    if (!address.street.trim())                           e.street  = "Street address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    const e: Record<string, string> = {};
    if (payMethod === "UPI" && !/^[\w.\-]{2,}@[\w]{2,}$/.test(upiId.trim()))
      e.upiId = "Enter a valid UPI ID (e.g. name@upi)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    setPlacing(true);
    const token = localStorage.getItem("token");
    const deliveryAddress = `${address.street}, ${address.city}, ${address.state} - ${address.pincode} | ${address.name} | ${address.phone}`;
    try {
      const orderIds: string[] = [];
      for (const item of cart) {
        const orderRes = await fetch(`${API}/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            buyer_id:         user.id || user._id,
            seller_id:        item.product?.farmer_id,
            product_id:       item.product?._id,
            product_name:     item.product?.product_name,
            quantity:         item.quantity,
            unit:             item.product?.unit || "kg",
            total_price:      item.product?.price * item.quantity,
            status:           "pending",
            delivery_address: deliveryAddress,
          }),
        });
        const orderData = await orderRes.json();
        const oid = orderData.data?._id;
        if (!oid) throw new Error("Order creation failed");
        orderIds.push(oid);

        await fetch(`${API}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            order_id:       oid,
            buyer_id:       user.id || user._id,
            seller_id:      item.product?.farmer_id,
            amount:         item.product?.price * item.quantity,
            payment_method: payMethod,
            upi_id:         payMethod === "UPI" ? upiId : "",
            transaction_id: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
            status:         payMethod === "COD" ? "pending" : "completed",
          }),
        });
      }

      // ── If reorder: cancel the original pending order ──
      if (isReorder && reorderOrigId) {
        await fetch(`${API}/order/${reorderOrigId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: "cancelled" }),
        });
        sessionStorage.removeItem("reorder_data");
      }

      if (!isBuyNow && !isReorder) {
        await fetch(`${API}/cart`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      }

      setOrderId(orderIds.join(", "));
      if (cart.length > 0) setReviewProduct(cart[0].product);
      setStep("success");
    } catch (err) {
      alert("Order could not be placed. Please try again.");
      console.error(err);
    } finally {
      setPlacing(false);
    }
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) return;
    setReviewSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          product_id:    reviewProduct?._id,
          reviewer_name: user?.name || "Anonymous",
          rating:        reviewRating,
          comment:       reviewComment.trim(),
        }),
      });
      setReviewDone(true);
    } catch {
      setReviewDone(true);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const STEPS = [
    { key: "address", label: "Delivery", icon: "📍", num: 1 },
    { key: "payment", label: "Payment",  icon: "💳", num: 2 },
    { key: "confirm", label: "Review",   icon: "✅", num: 3 },
  ];
  const stepIndex: Record<string, number> = { address: 0, payment: 1, confirm: 2, success: 3 };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <div className="spinner-border text-success" role="status" />
    </div>
  );

  // ── SUCCESS SCREEN ──
  if (step === "success") return (
    <div className="bg-light py-4 pt-2">
      <div className="container-fluid pb-3">
        <div className="bg-success border-bottom shadow-sm rounded-3">
          <div className="container py-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2 mx-3">
              <h5 className="mb-0 fw-bold text-white">Order ID</h5>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-12 col-md-8 col-lg-6 mx-auto">
            <div className="card border-0 shadow text-center px-5 py-3 pb-5 mb-4 rounded-3">
              <div className="fs-1">🎉</div>
              <h3 className="fw-bold text-success mt-3">Order Placed!</h3>
              <p className="text-muted mt-2 fs-5">
                Your order has been successfully placed. The farmer will confirm it shortly.
              </p>
              {orderId && (
                <div className="bg-light rounded-3 p-3 mt-3 mb-2 border">
                  <span className="d-block mb-1 fs-6 fw-bold">Order ID</span>
                  <span className="fw-bold font-monospace fs-6 text-success" style={{ wordBreak: "break-all" }}>{orderId}</span>
                </div>
              )}
              <div className="alert alert-info d-flex gap-2 align-items-start fs-8 rounded-3">
                <p className="mb-0">💡 Your order is being processed. You will receive a confirmation email shortly.</p>
              </div>
              <div className="d-flex gap-3 justify-content-center">
                <button className="btn btn-success px-4 py-2 rounded-3" onClick={() => router.push("/Orders")}>📦 My Orders</button>
                <button className="btn btn-outline-secondary px-4 py-2 rounded-3" onClick={() => router.push("/Product")}>🛒 Shop More</button>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-8 col-lg-6 mx-auto">
            {reviewProduct && (
              <div className="card border-0 shadow p-4 fs-8 rounded-3">
                {reviewDone ? (
                  <div className="text-center py-3">
                    <div className="fs-2">🙏</div>
                    <h5 className="fw-bold text-success my-4">Thank you for your review!</h5>
                    <div className="alert alert-info text-center fs-7 rounded-3">
                      <p className="mb-0">💡 Your feedback helps others.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <img src={reviewProduct?.image_url || "https://placehold.co/56"}
                        style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                        alt={reviewProduct?.product_name} />
                      <div>
                        <h6 className="fw-bold mb-0 fs-5">⭐ Rate your purchase</h6>
                        <p className="fs-7 m-2">{reviewProduct?.product_name}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold fs-6">Your Rating *</label>
                      <div className="d-flex gap-1 fs-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star}
                            style={{
                              cursor: "pointer",
                              color: star <= (reviewHover || reviewRating) ? "#f59e0b" : "#d1d5db",
                              transition: "color 0.15s, transform 0.15s",
                              transform: star <= (reviewHover || reviewRating) ? "scale(1.15)" : "scale(1)",
                              display: "inline-block",
                            }}
                            onMouseEnter={() => setReviewHover(star)}
                            onMouseLeave={() => setReviewHover(0)}
                            onClick={() => setReviewRating(star)}>★</span>
                        ))}
                      </div>
                      <div className="text-muted mt-1 fs-5">
                        {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewHover || reviewRating]}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold fs-5">Your Comment *</label>
                      <textarea className="form-control rounded-3 fs-6" rows={3}
                        placeholder="Share your experience with this product..."
                        value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-success flex-grow-1 py-2 fw-bold fs-6 rounded-3"
                        onClick={submitReview} disabled={reviewSubmitting || !reviewComment.trim()}>
                        {reviewSubmitting ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</> : "✅ Submit Review"}
                      </button>
                      <button className="btn btn-outline-secondary px-4 py-2 fs-6 rounded-3" onClick={() => setReviewDone(true)}>Skip</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const backHref = isReorder ? "/Orders" : isBuyNow ? `/ProductDetails/${buyNowProductId}` : "/Cart";

  return (
    <div className="bg-light py-4 pt-2">
      <div className="container-fluid pb-3">
        <div className="bg-success border-bottom rounded-3 shadow-sm">
          <div className="container py-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0 fw-bold">🌾 Checkout</h5>
                {isBuyNow  && <span className="badge bg-warning text-dark rounded-3 fs-8 mx-1">⚡ Buy Now</span>}
                {isReorder && <span className="badge bg-info text-dark rounded-3 fs-8 mx-1">🔄 Reorder</span>}
              </div>
              <Link href={backHref} className="btn btn-sm btn-outline-warning rounded-3">
                ← {isReorder ? "Orders" : isBuyNow ? "Product" : "Cart"}
              </Link>
            </div>

            {/* STEPPER */}
            <div className="d-flex align-items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s.key} className="d-flex align-items-center gap-2">
                  <div className="d-flex align-items-center gap-1">
                    <div className="d-flex align-items-center justify-content-center fw-bold rounded-circle fs-6"
                      style={{
                        width: 28, height: 28,
                        background: stepIndex[step] >= i ? "#ffc107" : "#e9ecef",
                        color:      stepIndex[step] >= i ? "#fff"    : "#6c757d",
                        transition: "background 0.2s",
                      }}>
                      {stepIndex[step] > i ? "✓" : s.num}
                    </div>
                    <span className="d-none d-sm-inline fw-semibold"
                      style={{ fontSize: 13, color: stepIndex[step] >= i ? "#ffc107" : "#9ca3af" }}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 32, height: 2, background: stepIndex[step] > i ? "#198754" : "#e9ecef", borderRadius: 2 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row g-4">

          {/* ── LEFT: FORM ── */}
          <div className="col-lg-7">

            {/* ── NEW: Reorder info banner ── */}
            {isReorder && (
              <div className="alert alert-info d-flex align-items-start gap-2 rounded-3 mb-3">
                <span>🔄</span>
                <div>
                  <strong>Reordering previous order</strong>
                  <div className="fs-7 mt-1">Your delivery address is pre-filled. Just choose your payment method and confirm!</div>
                </div>
              </div>
            )}

            {/* STEP 1: ADDRESS — hidden for reorder (already filled), but still editable if user navigates back */}
            {step === "address" && (
              <div className="card border-0 shadow-sm p-4 fs-7">
                <h5 className="fw-bold mb-4">📍 Delivery Address</h5>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold fs-6">Full Name *</label>
                    <input className={`form-control rounded-2 ${errors.name ? "is-invalid" : ""}`}
                      value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })}
                      placeholder="Your full name" />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold fs-6">Mobile Number *</label>
                    <input className={`form-control rounded-2 ${errors.phone ? "is-invalid" : ""}`}
                      value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, "") })}
                      placeholder="10-digit mobile number" maxLength={10} />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold fs-6">Street Address *</label>
                    <textarea className={`form-control rounded-2 ${errors.street ? "is-invalid" : ""}`} rows={2}
                      value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      placeholder="House no, street, colony, landmark..." />
                    {errors.street && <div className="invalid-feedback">{errors.street}</div>}
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label fw-semibold fs-6">Pincode *</label>
                    <input className={`form-control rounded-2 ${errors.pincode ? "is-invalid" : ""}`}
                      value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })}
                      placeholder="6-digit pincode" maxLength={6} />
                    {errors.pincode && <div className="invalid-feedback">{errors.pincode}</div>}
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label fw-semibold fs-6">City *</label>
                    <input className={`form-control rounded-2 ${errors.city ? "is-invalid" : ""}`}
                      value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="City" />
                    {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label fw-semibold fs-6">State *</label>
                    <select className={`form-select rounded-2 ${errors.state ? "is-invalid" : ""}`}
                      value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}>
                      <option value="">Select State</option>
                      {["Andhra Pradesh","Bihar","Chhattisgarh","Gujarat","Haryana","Himachal Pradesh",
                        "Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Odisha",
                        "Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","Uttarakhand",
                        "West Bengal","Delhi","Other"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                  </div>
                </div>
                <button className="btn btn-success w-100 mt-4 py-2 fw-bold fs-6 rounded-3"
                  onClick={() => { if (validateAddress()) setStep("payment"); }}>
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* STEP 2: PAYMENT */}
            {step === "payment" && (
              <div className="card border-0 shadow-sm p-4 fs-7">
                <div className="d-flex align-items-center gap-3 mb-4">
                  {/* For reorder: back goes to Orders; else back to address */}
                  <button className="btn btn-sm btn-outline-secondary rounded-3"
                    onClick={() => isReorder ? router.push("/Orders") : setStep("address")}>←</button>
                  <h5 className="fw-bold mb-0">💳 Payment Method</h5>
                </div>

                {/* ── Show saved address summary for reorder ── */}
                {isReorder && (
                  <div className="bg-light rounded-3 p-3 mb-4 border">
                    <div className="fw-semibold text-success mb-1 fs-7">📍 Delivering to</div>
                    <div className="fs-7">{address.name} · {address.phone}</div>
                    <div className="text-muted fs-7">{address.street}, {address.city}, {address.state} — {address.pincode}</div>
                    <button className="btn btn-link p-0 text-primary fs-7 mt-1"
                      onClick={() => setStep("address")}>✏️ Change address</button>
                  </div>
                )}

                <div className="d-flex flex-column gap-3">
                  {[
                    { id: "COD",        icon: "💵", label: "Cash on Delivery",    sub: "Pay when your order arrives" },
                    { id: "UPI",        icon: "📲", label: "UPI Payment",         sub: "PhonePe, Google Pay, Paytm & more" },
                    { id: "Card",       icon: "💳", label: "Debit / Credit Card", sub: "Visa, Mastercard, RuPay" },
                    { id: "NetBanking", icon: "🏦", label: "Net Banking",         sub: "All major banks supported" },
                  ].map((m) => (
                    <label key={m.id} className="d-flex align-items-center gap-3 p-3"
                      style={{
                        cursor: "pointer", borderRadius: 12,
                        border:     payMethod === m.id ? "2px solid #198754" : "1.5px solid #dee2e6",
                        background: payMethod === m.id ? "#f0fdf4" : "#fff",
                        transition: "all 0.15s",
                      }}>
                      <input type="radio" className="form-check-input mt-0 flex-shrink-0"
                        style={{ width: 18, height: 18 }} checked={payMethod === (m.id as any)}
                        onChange={() => { setPayMethod(m.id as any); setErrors({}); }} />
                      <span style={{ fontSize: 24 }}>{m.icon}</span>
                      <div className="flex-grow-1">
                        <div className="fw-semibold fs-6">{m.label}</div>
                        <div className="text-muted fs-6">{m.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {payMethod === "UPI" && (
                  <div className="mt-3">
                    <label className="form-label fw-semibold fs-5">UPI ID *</label>
                    <input className={`form-control rounded-2 ${errors.upiId ? "is-invalid" : ""}`}
                      value={upiId} onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi" />
                    {errors.upiId && <div className="invalid-feedback">{errors.upiId}</div>}
                  </div>
                )}
                {payMethod === "Card" && (
                  <div className="alert alert-info mt-3 mb-0 d-flex gap-2 align-items-start fs-6 rounded-3">
                    <span>💡</span>
                    <span>Card payment gateway coming soon. Please use COD or UPI for now.</span>
                  </div>
                )}

                <button className="btn btn-success w-100 mt-4 py-2 fw-bold fs-6 rounded-3"
                  onClick={() => { if (validatePayment()) setStep("confirm"); }}>
                  Review Order →
                </button>
              </div>
            )}

            {/* STEP 3: CONFIRM */}
            {step === "confirm" && (
              <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 16 }}>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setStep("payment")}>←</button>
                  <h5 className="fw-bold mb-0">✅ Review & Place Order</h5>
                </div>

                {/* Address summary */}
                <div className="bg-light rounded-3 p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold mb-1" style={{ fontSize: 13 }}>📍 Delivery Address</div>
                      <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6 }}>
                        <strong>{address.name}</strong> · {address.phone}<br />
                        {address.street}<br />
                        {address.city}, {address.state} — {address.pincode}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setStep("address")}>Edit</button>
                  </div>
                </div>

                {/* Payment summary */}
                <div className="bg-light rounded-3 p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold mb-1" style={{ fontSize: 13 }}>💳 Payment</div>
                      <div style={{ fontSize: 13, color: "#4b5563" }}>
                        {payMethod}{payMethod === "UPI" ? ` — ${upiId}` : ""}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setStep("payment")}>Edit</button>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <div className="fw-semibold mb-3" style={{ fontSize: 13 }}>🛒 Items ({cart.length})</div>
                  {cart.map((item) => (
                    <div key={item._id} className="d-flex align-items-center gap-3 py-2 border-bottom">
                      <img src={item.product?.image_url || "https://placehold.co/48"}
                        style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
                        alt={item.product?.product_name} />
                      <div className="flex-grow-1">
                        <div className="fw-semibold" style={{ fontSize: 14 }}>{item.product?.product_name}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {item.quantity} {item.product?.unit} × ₹{item.product?.price}
                        </div>
                      </div>
                      <div className="fw-bold text-success">₹{(item.product?.price * item.quantity).toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                <button className="btn btn-success w-100 py-3 fw-bold" style={{ borderRadius: 12, fontSize: 16 }}
                  onClick={placeOrder} disabled={placing}>
                  {placing
                    ? <><span className="spinner-border spinner-border-sm me-2" />Placing Order...</>
                    : `⚡ Place Order — ₹${total.toLocaleString()}`}
                </button>
                <p className="text-center text-muted mt-2 mb-0" style={{ fontSize: 12 }}>🔒 Secure & encrypted checkout</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: ORDER SUMMARY ── */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16, position: "sticky", top: 80 }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">
                  Order Summary
                  {isBuyNow  && <span className="badge bg-warning text-dark ms-2 rounded fs-8">⚡ Buy Now</span>}
                  {isReorder && <span className="badge bg-info text-dark ms-2 rounded fs-8">🔄 Reorder</span>}
                </h5>

                <div className="d-flex flex-column gap-2 mb-3" style={{ maxHeight: 280, overflowY: "auto" }}>
                  {cart.map((item) => (
                    <div key={item._id} className="d-flex align-items-center gap-3 p-2 border rounded-3">
                      <img src={item.product?.image_url || "https://placehold.co/50"}
                        style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
                        alt={item.product?.product_name} />
                      <div className="flex-grow-1">
                        <div className="text-truncate fw-semibold fs-6">{item.product?.product_name}</div>
                        <div className="text-muted fs-6">{item.quantity} {item.product?.unit} × ₹{item.product?.price}</div>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                        <span className="fw-bold text-success fs-6">₹{(item.product?.price * item.quantity).toLocaleString()}</span>
                        <button onClick={() => removeItem(item)}
                          className="btn btn-outline-danger btn-sm p-0 fs-5"
                          style={{ width: 24, height: 24, borderRadius: 6, lineHeight: 1 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <hr className="my-3" />
                <div className="d-flex justify-content-between mb-2 fs-6">
                  <span className="text-muted">Subtotal</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2 fs-6">
                  <span className="text-muted">Delivery</span>
                  <span className="text-success fw-semibold">Free</span>
                </div>
                <div className="d-flex justify-content-between mb-2 fs-6">
                  <span className="text-muted">Discount</span>
                  <span className="text-danger">- ₹0</span>
                </div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between fw-bold fs-6">
                  <span>Total</span>
                  <span className="text-success">₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}