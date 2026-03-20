"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";


const BANKS = ["SBI", "HDFC", "ICICI", "Axis", "PNB", "Bank of Baroda", "Kotak", "Canara Bank"];

export default function NewOrderPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const productId    = searchParams.get("product");

  const [product,     setProduct]     = useState<any>(null);
  const [quantity,    setQuantity]    = useState(1);
  const [address,     setAddress]     = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [user,        setUser]        = useState<any>(null);

  const [method,      setMethod]      = useState("UPI");
  const [upiId,       setUpiId]       = useState("");
  const [cardNo,      setCardNo]      = useState("");
  const [cardName,    setCardName]    = useState("");
  const [cardExpiry,  setCardExpiry]  = useState("");
  const [cardCvv,     setCardCvv]     = useState("");
  const [bank,        setBank]        = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/Login"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setAddress(u.location || "");

    if (productId) {
      fetch(`http://localhost:5000/products/${productId}`)
        .then(res => res.json())
        .then(data => setProduct(data));
    }
  }, [productId]);

  const totalPrice = product ? product.price * quantity : 0;

  const generateTxnId = () => "TXN" + Date.now() + Math.floor(Math.random() * 1000);

  const validatePayment = () => {
    if (method === "UPI" && !upiId.includes("@"))
      return "Valid UPI ID enter karo (e.g. name@upi)";
    if (method === "Card") {
      if (cardNo.length < 16) return "16 digit card number enter karo";
      if (!cardName)          return "Card pe naam enter karo";
      if (!cardExpiry)        return "Expiry date enter karo";
      if (cardCvv.length < 3) return "CVV enter karo";
    }
    if (method === "NetBanking" && !bank) return "Bank select karo";
    return null;
  };

  const handleSubmit = async () => {
    if (!address) { setError("Delivery address bharo!"); return; }
    const payErr = validatePayment();
    if (payErr) { setError(payErr); return; }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Step 1 — Order create
      const orderRes = await fetch("http://localhost:5000/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          buyer_id:         user.id,
          seller_id:        product.farmer_id,
          product_id:       product._id,
          product_name:     product.name,
          quantity,
          unit:             product.unit,
          total_price:      totalPrice,
          delivery_address: address,
          status:           "pending",
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);
      const orderId = orderData.data._id;

      // Step 2 — Demo processing
      await new Promise(r => setTimeout(r, 2000));

      // Step 3 — Payment record
      const txnId  = generateTxnId();
      const payRes = await fetch("http://localhost:5000/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id:       orderId,
          buyer_id:       user.id,
          seller_id:      product.farmer_id,
          amount:         totalPrice,
          payment_method: method,
          upi_id:         method === "UPI" ? upiId : "",
          transaction_id: txnId,
          status:         method === "COD" ? "pending" : "completed",
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error);

      // Step 4 — Order status update
      await fetch(`http://localhost:5000/order/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: method === "COD" ? "pending" : "confirmed",
        }),
      });

      // Step 5 — Success
      router.push(`/Payment/Success?txn=${txnId}&amount=${totalPrice}&method=${method}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="spinner-border text-success" />
    </div>
  );

  return (
    <>
 
      <div className="min-vh-100 bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-7">

              {/* Product Info Card */}
              <div className="card border-0 shadow-sm rounded-4 mb-3">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-success mb-3">🛒 Order Summary</h5>

                  <div className="d-flex gap-3 align-items-center mb-4 p-3 bg-light rounded-3">
                    <img
                      src={product.image_url || "https://placehold.co/80x80/e8f5e9/198754?text=🌾"}
                      alt={product.name} className="rounded-3"
                      style={{ width: 80, height: 80, objectFit: "cover" }}
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/80x80/e8f5e9/198754?text=🌾";
                      }}
                    />
                    <div>
                      <h6 className="fw-bold mb-1">{product.name}</h6>
                      <p className="text-success fw-bold mb-0">₹{product.price}/{product.unit}</p>
                      <small className="text-muted">📍 {product.location}</small>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Quantity ({product.unit}) — Stock: {product.stock}
                    </label>
                    <div className="d-flex align-items-center gap-3">
                      <button className="btn btn-outline-success btn-sm"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                      <span className="fs-5 fw-bold px-2">{quantity}</span>
                      <button className="btn btn-outline-success btn-sm"
                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">📍 Delivery Address</label>
                    <textarea className="form-control rounded-3" rows={2}
                      placeholder="Poora address likho..."
                      value={address} onChange={e => setAddress(e.target.value)} />
                  </div>

                  {/* Total */}
                  <div className="d-flex justify-content-between align-items-center
                    p-3 bg-success bg-opacity-10 rounded-3">
                    <div>
                      <small className="text-muted">
                        ₹{product.price} × {quantity} {product.unit}
                      </small>
                      <div className="fw-semibold">Total Amount</div>
                    </div>
                    <span className="fs-4 fw-bold text-success">₹{totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Payment Card */}
              <div className="card border-0 shadow rounded-4">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-success mb-4">💳 Payment</h5>

                  {error && (
                    <div className="alert alert-danger py-2 small rounded-3">{error}</div>
                  )}

                  {/* Method Tabs */}
                  <div className="d-flex gap-2 mb-4 flex-wrap">
                    {[
                      { key: "UPI",        icon: "📱" },
                      { key: "Card",       icon: "💳" },
                      { key: "NetBanking", icon: "🏦" },
                      { key: "COD",        icon: "💵" },
                    ].map(({ key, icon }) => (
                      <button key={key}
                        onClick={() => { setMethod(key); setError(""); }}
                        className={`btn btn-sm rounded-pill px-3 ${
                          method === key ? "btn-success" : "btn-outline-secondary"
                        }`}>
                        {icon} {key}
                      </button>
                    ))}
                  </div>

                  {/* UPI */}
                  {method === "UPI" && (
                    <div>
                      <label className="form-label fw-semibold">UPI ID</label>
                      <input className="form-control rounded-3 mb-2"
                        placeholder="yourname@upi"
                        value={upiId} onChange={e => setUpiId(e.target.value)} />
                      <div className="d-flex gap-2 flex-wrap mt-1">
                        {["GPay", "PhonePe", "Paytm", "BHIM"].map(app => (
                          <span key={app}
                            className="badge bg-light text-dark border px-3 py-2"
                            style={{ cursor: "pointer", fontSize: 13 }}>
                            {app}
                          </span>
                        ))}
                      </div>
                      <small className="text-muted d-block mt-2">
                        💡 Demo mode — koi real payment nahi hogi
                      </small>
                    </div>
                  )}

                  {/* Card */}
                  {method === "Card" && (
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Card Number</label>
                        <input className="form-control rounded-3"
                          placeholder="1234 5678 9012 3456"
                          maxLength={16} value={cardNo}
                          onChange={e => setCardNo(e.target.value.replace(/\D/g, ""))} />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Name on Card</label>
                        <input className="form-control rounded-3"
                          placeholder="Anurag Kumar"
                          value={cardName} onChange={e => setCardName(e.target.value)} />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold">Expiry</label>
                        <input className="form-control rounded-3" placeholder="MM/YY"
                          maxLength={5} value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)} />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold">CVV</label>
                        <input className="form-control rounded-3" placeholder="***"
                          type="password" maxLength={3} value={cardCvv}
                          onChange={e => setCardCvv(e.target.value)} />
                      </div>
                      <div className="col-12">
                        <small className="text-muted">
                          💡 Demo mode — koi real payment nahi hogi
                        </small>
                      </div>
                    </div>
                  )}

                  {/* NetBanking */}
                  {method === "NetBanking" && (
                    <div>
                      <label className="form-label fw-semibold">Bank Select karo</label>
                      <select className="form-select rounded-3"
                        value={bank} onChange={e => setBank(e.target.value)}>
                        <option value="">-- Bank chuniye --</option>
                        {BANKS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <small className="text-muted d-block mt-2">
                        💡 Demo mode — koi real payment nahi hogi
                      </small>
                    </div>
                  )}

                  {/* COD */}
                  {method === "COD" && (
                    <div className="alert alert-warning rounded-3 mb-0">
                      <h6 className="fw-bold">💵 Cash on Delivery</h6>
                      <p className="mb-0 small">
                        Delivery ke time ₹{totalPrice} cash mein pay karna hoga.
                      </p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="d-flex gap-2 mt-4">
                    <button className="btn btn-outline-secondary flex-fill rounded-3"
                      onClick={() => router.back()} disabled={loading}>
                      ← Back
                    </button>
                    <button className="btn btn-success flex-fill fw-semibold rounded-3"
                      onClick={handleSubmit} disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Processing...
                        </>
                      ) : `✅ Pay ₹${totalPrice}`}
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}