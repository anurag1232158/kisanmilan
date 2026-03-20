"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    if (!id) return;

    // Product fetch
    fetch(`http://localhost:5000/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Reviews fetch
    fetch(`http://localhost:5000/review/product/${id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setReviews(data);
      })
      .catch(() => {});
  }, [id]);

  const handleOrder = () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/Login"); return; }
    router.push(`/Orders/New?product=${id}`);
  };

  // Loading Skeleton
  if (loading) return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="bg-secondary bg-opacity-10"
                style={{ height: 300 }} />
              <div className="card-body p-4">
                {[80, 60, 40, 40, 100].map((w, i) => (
                  <div key={i}
                    className="bg-secondary bg-opacity-10 rounded mb-3"
                    style={{ height: 20, width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!product || product.error) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div style={{ fontSize: 64 }}>😔</div>
        <h5 className="text-muted mt-3">Product not found</h5>
        <button className="btn btn-success mt-3"
          onClick={() => router.push("/Product")}>
          ← Products pe Wapas Jao
        </button>
      </div>
    </div>
  );

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const isOutOfStock = product.stock === 0;
  const isFarmerOwner = user?.id?.toString() === product?.farmer_id?.toString();

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">

        {/* Breadcrumb */}
        <nav className="mb-3">
          <ol className="breadcrumb small">
            <li className="breadcrumb-item">
              <Link href="/" className="text-success text-decoration-none">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/Product" className="text-success text-decoration-none">Products</Link>
            </li>
            <li className="breadcrumb-item active text-muted">{product.name}</li>
          </ol>
        </nav>

        <div className="row g-4">

          {/* Left — Image */}
          <div className="col-md-5">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden sticky-top"
              style={{ top: 80 }}>
              <div style={{ position: "relative" }}>
                <img
                  src={product.image_url || "/placeholder.png"}
                  alt={product.name}
                  className="w-100"
                  style={{ height: 320, objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.png";
                  }}
                />
                {/* Category badge */}
                <span className="badge bg-success position-absolute"
                  style={{ top: 12, left: 12, fontSize: 13 }}>
                  {product.category}
                </span>

                {/* Out of stock overlay */}
                {isOutOfStock && (
                  <div className="position-absolute top-0 start-0 w-100 h-100
                    d-flex align-items-center justify-content-center"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <span className="badge bg-danger fs-5 px-4 py-3">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Rating */}
              {avgRating && (
                <div className="card-footer bg-white border-0 p-3 text-center">
                  <span className="text-warning fs-5">
                    {"⭐".repeat(Math.round(Number(avgRating)))}
                  </span>
                  <span className="ms-2 fw-bold">{avgRating}</span>
                  <span className="text-muted small ms-1">
                    ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right — Details */}
          <div className="col-md-7">
            <div className="card border-0 shadow-sm rounded-4 mb-3">
              <div className="card-body p-4">

                <h3 className="fw-bold text-dark mb-2">{product.name}</h3>

                {/* Price */}
                <div className="d-flex align-items-baseline gap-2 mb-3">
                  <h2 className="fw-bold text-success mb-0">₹{product.price}</h2>
                  <span className="text-muted">/ {product.unit}</span>
                </div>

                {/* Details List */}
                <div className="list-group list-group-flush mb-3">
                  {[
                    ["📍 Location",  product.location   || "N/A"],
                    ["👨‍🌾 Farmer",   product.farmer_name || "N/A"],
                    ["📦 Stock",     `${product.stock} ${product.unit}`],
                  ].map(([label, value]) => (
                    <div key={label}
                      className="list-group-item px-0 d-flex justify-content-between border-0 py-2">
                      <span className="text-muted">{label}</span>
                      <span className="fw-semibold">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Stock Progress */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">Stock Available</small>
                    <small className={`fw-semibold ${
                      product.stock > 50 ? "text-success" :
                      product.stock > 10 ? "text-warning" : "text-danger"
                    }`}>
                      {product.stock} {product.unit}
                    </small>
                  </div>
                  <div className="progress" style={{ height: 6 }}>
                    <div
                      className={`progress-bar ${
                        product.stock > 50 ? "bg-success" :
                        product.stock > 10 ? "bg-warning" : "bg-danger"
                      }`}
                      style={{ width: `${Math.min(product.stock, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-4">
                    <h6 className="fw-bold text-success">Description</h6>
                    <p className="text-muted mb-0">{product.description}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => router.back()}>
                    ← Back
                  </button>

                  {isFarmerOwner ? (
                    // Farmer ke liye edit button
                    <button className="btn btn-warning flex-fill fw-semibold"
                      onClick={() => router.push(`/EditProduct/${id}`)}>
                      ✏️ Edit Product
                    </button>
                  ) : (
                    // Buyer ke liye order button
                    <button
                      className="btn btn-success flex-fill fw-semibold py-2"
                      onClick={handleOrder}
                      disabled={isOutOfStock}>
                      {isOutOfStock ? "❌ Out of Stock" : "🛒 Order Now"}
                    </button>
                  )}
                </div>

                {/* Login prompt */}
                {!user && (
                  <p className="text-center text-muted small mt-3">
                    Order karne ke liye{" "}
                    <Link href="/Login" className="text-success fw-semibold">
                      Login karo
                    </Link>
                  </p>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <h6 className="fw-bold text-success mb-3">
                    ⭐ Reviews ({reviews.length})
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    {reviews.slice(0, 3).map((review: any) => (
                      <div key={review._id}
                        className="p-3 bg-light rounded-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="fw-semibold">{review.buyer_name}</span>
                          <span className="text-warning">
                            {"⭐".repeat(review.rating)}
                          </span>
                        </div>
                        <p className="text-muted small mb-0">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}