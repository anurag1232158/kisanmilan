"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function PaymentPage({ params }: { params: Promise<{ OrderID: string }> }) {
  const router = useRouter();
  const { OrderID } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [method, setMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [cardNo, setCardNo] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [bank, setBank] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/Login"); return; }
    setUser(JSON.parse(stored));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/${OrderID}`)
      .then(res => res.json())
      .then(data => setOrder(data));
  }, [OrderID]);

  const generateTxnId = () => "TXN" + Date.now() + Math.floor(Math.random() * 1000);

  const validate = () => {
    if (method === "UPI" && !upiId.includes("@"))
      return "Valid UPI ID enter karo (e.g. name@upi)";
    if (method === "Card") {
      if (cardNo.length < 16) return "16 digit card number enter karo";
      if (!cardName) return "Card pe naam enter karo";
      if (!cardExpiry) return "Expiry date enter karo";
      if (cardCvv.length < 3) return "CVV enter karo";
    }
    if (method === "NetBanking" && !bank) return "Bank select karo";
    return null;
  };

  const handlePayment = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError("");

    // Demo: 2 second processing simulate karo
    await new Promise(r => setTimeout(r, 2000));

    try {
      const token = localStorage.getItem("token");

      // 1. Payment record banao
      const payRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: OrderID,
          buyer_id: user.id,
          seller_id: order.seller_id,
          amount: order.total_price,
          payment_method: method,
          upi_id: method === "UPI" ? upiId : "",
          transaction_id: generateTxnId(),
          status: "completed",
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error);

      // 2. Order status "confirmed" karo
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/${OrderID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "confirmed" }),
      });

      // 3. Success page pe jao
      router.push(`/Payment/Success?txn=${payData.data.transaction_id}&amount=${order.total_price}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!order) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-success" />
    </div>
  );

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6">

            {/* Order Summary */}
            <div className="card border-0 shadow-sm rounded-4 mb-3">
              <div className="card-body p-4">
                <h6 className="text-muted mb-3">ORDER SUMMARY</h6>
                <div className="d-flex justify-content-between">
                  <span>{order.product_name}</span>
                  <span className="fw-semibold">{order.quantity} {order.unit}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <span className="fw-bold">Total</span>
                  <span className="fw-bold text-success fs-5">₹{order.total_price}</span>
                </div>
              </div>
            </div>

            {/* Payment Card */}
            <div className="card border-0 shadow rounded-4">
              <div className="card-body p-4">
                <h5 className="fw-bold text-success mb-4">💳 Payment</h5>

                {error && <div className="alert alert-danger py-2">{error}</div>}

                {/* Payment Method Tabs */}
                <div className="d-flex gap-2 mb-4 flex-wrap">
                  {["UPI", "Card", "NetBanking", "COD"].map(m => (
                    <button key={m}
                      onClick={() => { setMethod(m); setError(""); }}
                      className={`btn btn-sm ${method === m ? "btn-success" : "btn-outline-secondary"}`}>
                      {m === "UPI" && "📱 "}
                      {m === "Card" && "💳 "}
                      {m === "NetBanking" && "🏦 "}
                      {m === "COD" && "💵 "}
                      {m}
                    </button>
                  ))}
                </div>

                {/* UPI Form */}
                {method === "UPI" && (
                  <div>
                    <label className="form-label fw-semibold">UPI ID</label>
                    <input className="form-control mb-2" placeholder="yourname@upi"
                      value={upiId} onChange={e => setUpiId(e.target.value)} />
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      {["GPay", "PhonePe", "Paytm", "BHIM"].map(app => (
                        <span key={app}
                          className="badge bg-light text-dark border px-3 py-2"
                          style={{ cursor: "pointer" }}>
                          {app}
                        </span>
                      ))}
                    </div>
                    <small className="text-muted d-block mt-2">
                      💡 Demo mode — koi real payment nahi hogi
                    </small>
                  </div>
                )}

                {/* Card Form */}
                {method === "Card" && (
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Card Number</label>
                      <input className="form-control" placeholder="1234 5678 9012 3456"
                        maxLength={16} value={cardNo}
                        onChange={e => setCardNo(e.target.value.replace(/\D/g, ""))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Name on Card</label>
                      <input className="form-control" placeholder="Anurag Kumar"
                        value={cardName} onChange={e => setCardName(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Expiry</label>
                      <input className="form-control" placeholder="MM/YY"
                        maxLength={5} value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">CVV</label>
                      <input className="form-control" placeholder="***"
                        type="password" maxLength={3} value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <small className="text-muted">💡 Demo mode — koi real payment nahi hogi</small>
                    </div>
                  </div>
                )}

                {/* NetBanking Form */}
                {method === "NetBanking" && (
                  <div>
                    <label className="form-label fw-semibold">Bank Select karo</label>
                    <select className="form-select mb-2"
                      value={bank} onChange={e => setBank(e.target.value)}>
                      <option value="">-- Bank chuniye --</option>
                      {["SBI", "HDFC", "ICICI", "Axis", "PNB", "Bank of Baroda",
                        "Kotak", "Canara Bank", "Union Bank"].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <small className="text-muted">💡 Demo mode — koi real payment nahi hogi</small>
                  </div>
                )}

                {/* COD */}
                {method === "COD" && (
                  <div className="alert alert-warning rounded-3">
                    <h6 className="fw-bold">💵 Cash on Delivery</h6>
                    <p className="mb-0 small">
                      Delivery ke time ₹{order.total_price} cash mein pay karna hoga.
                    </p>
                  </div>
                )}

                {/* Pay Button */}
                <button
                  className="btn btn-success w-100 mt-4 py-2 fw-semibold"
                  onClick={handlePayment}
                  disabled={loading}>
                  {loading ? (
                    <>
                    </>
                  ) : (
                    `✅ Pay ₹${order?.total_price}`
                  )}
                </button>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}