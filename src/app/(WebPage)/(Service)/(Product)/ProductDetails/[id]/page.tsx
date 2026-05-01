"use client";
import {use, useEffect, useState, useMemo} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const API = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function ProductDetail({params}: {params: Promise<{id: string}>}) {
    const {id} = use(params);
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [similar, setSimilar] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [activeImg, setActiveImg] = useState("");
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const [toast, setToast] = useState<{msg: string; type: "success" | "error"} | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [hoverRating, setHoverRating] = useState(0);
    const [submittingReview, setSubmittingReview] = useState(false);
    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({msg, type});
        setTimeout(() => setToast(null), 300);
    };
    const isWishlisted = wishlist.includes(id.toString());
    const fetchWishlist = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`${API}/wishlist`, {
                headers: {Authorization: `Bearer ${token}`},
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                const ids = data.map((item: any) => (item.product_id?._id || item.product_id || "").toString());
                setWishlist(ids);
                localStorage.setItem("wishlist", JSON.stringify(ids));
            }
        } catch {
            const cached = localStorage.getItem("wishlist");
            setWishlist(cached ? JSON.parse(cached) : []);
        }
    };
    const fetchReviews = async () => {
        try {
            const res = await fetch(`${API}/review/product/${id}`);
            const data = await res.json();
            setReviews(Array.isArray(data) ? data : []);
        } catch {
            setReviews([]);
        }
    };

    useEffect(() => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "null");
            setUser(storedUser);
        } catch {
            setUser(null);
        }
        fetchWishlist();
    }, []);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true);
            try {
                const [p] = await Promise.all([fetch(`${API}/products/${id}`).then((res) => res.json())]);
                setProduct(p);
                setActiveImg(p.image_url || "");
                await fetchReviews();
            } catch {
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    useEffect(() => {
        if (!product?.category) return;
        fetch(`${API}/products?category=${product.category}`)
        .then((res) => res.json())
        .then((data) => setSimilar(Array.isArray(data) ? data.filter((p: any) => p._id !== id).slice(0, 4) : []))
        .catch(() => setSimilar([]));
    }, [product?.category, id]);

    const avgRating = useMemo(() => {
        if (!reviews.length) return "0.0";
        return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    }, [reviews]);

    const toggleWishlist = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            if (confirm("Login required. Do you want to login?")) router.push("/Login");
            return;
        }
        setWishlistLoading(true);
        try {
            const res = await fetch(`${API}/wishlist`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({product_id: id}),
            });
            const data = await res.json();
            if (data.action === "added") {
                setWishlist((prev) => [...prev, id.toString()]);
                showToast("❤️ Wishlist mein add ho gaya!");
            } else {
                setWishlist((prev) => prev.filter((wid) => wid !== id.toString()));
                showToast("💔 Wishlist se remove ho gaya");
            }
        } catch {
            showToast("Wishlist update failed", "error");
        } finally {
            setWishlistLoading(false);
        }
    };
    const addToCart = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            if (confirm("Login required. Do you want to login?")) router.push("/Login");
            return;
        }
        setAddingToCart(true);
        try {
            const res = await fetch(`${API}/cart`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({product_id: id, quantity: qty}),
            });
            const data = await res.json();
            if (res.ok) {
                showToast("Cart mein add ho gaya! 🛒");
                setTimeout(() => router.push("/Cart"), 500);
            } else {
                showToast(data.message || data.error || "Cart mein add nahi hua", "error");
            }
        } catch {
            showToast("Network error. Please try again.", "error");
        } finally {
            setAddingToCart(false);
        }
    };
    const buyNow = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            if (confirm("Login required. Do you want to login?")) router.push("/Login");
            return;
        }
        router.push(`/Checkout?product=${id}&qty=${qty}&mode=buynow`);
    };
    const submitReview = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            if (confirm("Login required to submit review. Go to Login?")) router.push("/Login");
            return;
        }
        if (!reviewComment.trim()) {
            showToast("Review likhna zaroori hai!", "error");
            return;
        }
        setSubmittingReview(true);
        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "null");
            const userId = storedUser?.id || storedUser?._id;
            const res = await fetch(`${API}/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    product_id: id,
                    buyer_id: userId,
                    user_id: userId,
                    rating: reviewRating,
                    comment: reviewComment.trim(),
                    review: reviewComment.trim(),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast("✅ Review submit ho gaya!");
                setReviewComment("");
                setReviewRating(5);
                await fetchReviews(); // ✅ Refresh reviews instantly
            } else {
                showToast(data.error || "Review submit nahi hua", "error");
            }
        } catch {
            showToast("Network error. Try again.", "error");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading)
        return (
            <div className="d-flex justify-content-center align-items-center" style={{minHeight: "80vh"}}>
                <div className="spinner-border text-success" role="status" style={{width: "3rem", height: "3rem"}} />
            </div>
        );

    if (!product)
        return (
            <div className="d-flex flex-column justify-content-center align-items-center" style={{minHeight: "80vh"}}>
                <div style={{fontSize: 64}}>🌾</div>
                <h4 className="mt-3 text-muted">Product not found</h4>
                <Link href="/Product" className="btn btn-success mt-3 px-4 rounded-3">
                    Browse Products
                </Link>
            </div>
        );

    const role = user?.role;
    const userId = (user?.id || user?._id || "").toString();
    const ownProduct = String(product.farmer_id?._id || product.farmer_id || "") === userId;
    const isBuyer = role === "buyer";
    const isFarmer = role === "farmer";
    const canOrder = isBuyer || (isFarmer && !ownProduct);
    const isOutOfStock = !product.stock || product.stock === 0;
    const avgNum = Number(avgRating);
    const allImages = [product.image_url, ...(product.images || [])].filter(Boolean);
    const displayRating = avgNum && avgNum > 0 ? Math.round(avgNum) : 2;
    const canReview = !!user && (isBuyer || (isFarmer && !ownProduct));
    const getSlidesToShow = (count: number) => {
  if (count === 2) return 2;
  if (count === 3) return 2;
  return 4;
    };

  const sliderSettings = {
  dots: false,
  infinite: true,
  speed: 500,
  slidesToShow: getSlidesToShow(similar.length),
  slidesToScroll: 1,
  autoplay: true, 
  autoplaySpeed: 1000,
  responsive: [
    {
      breakpoint: 1024,
      settings: { slidesToShow: Math.min(similar.length, 3), infinite: true, autoplay: true },
    },
    {
      breakpoint: 768,
      settings: { slidesToShow: Math.min(similar.length, 2), infinite: true, autoplay: true },
    },
    {
      breakpoint: 480,
      settings: { slidesToShow: 1, infinite: true, autoplay: true },
    },
  ],
    };

    return (
          <div className="bg-light py-4 pt-2 ">
                 <div className="container-fluid">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-success text-white rounded-3 shadow-sm">
                    <div className=""> <h5 className="mb-0 fw-bold text-white">🌾 Product Details</h5>
                        <small className="opacity-75">Full product information</small>
                    </div>
                    <nav className="d-flex align-items-center gap-1 fs-6">
                     <Link href="/Product" className="text-warning fw-bold text-decoration-underline"> Products </Link>
                        {product.category && <span className="text-white-50">/ {product.category}</span>}
                        <span className="text-white fw-semibold text-truncate">
                         / {product.product_name}
                        </span>
                    </nav>
                </div>
              
          <div className="container">
            {toast && ( <div className={`position-fixed top-0 end-0 m-3 alert alert-${  toast.type === "success" ? "success" : "danger"
            } shadow d-flex align-items-center gap-2`}
              style={{zIndex: 9999, minWidth: 280, borderRadius: 12,}}>
                <span>{toast.msg}</span>
                 <button className="btn-close ms-auto" style={{fontSize: 10}} onClick={() => setToast(null)} />
             </div>
            )}
       

                <div className="row g-4">
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm p-3" style={{borderRadius: 16}}>
                            <div
                                className="position-relative overflow-hidden mb-3"
                                style={{borderRadius: 12, background: "#f8f9fa", minHeight: 280}}
                            >
                                <img
                                    src={activeImg || "https://placehold.co/500x400"}
                                    alt={product.product_name}
                                    className="w-75 mx-auto d-block my-3"
                                    style={{
                                        objectFit: "cover",
                                        borderRadius: 12,
                                        transition: "transform 0.3s",
                                        cursor: "zoom-in",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                />

                                <button
                                    onClick={toggleWishlist}
                                    disabled={wishlistLoading}
                                    className="position-absolute btn btn-light shadow-sm d-flex align-items-center justify-content-center"
                                    style={{
                                        top: 12,
                                        right: 12,
                                        borderRadius: "50%",
                                        width: 40,
                                        height: 40,
                                        padding: 0,
                                        fontSize: 18,
                                    }}
                                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                    {wishlistLoading ? (
                                        <span className="spinner-border spinner-border-sm" style={{color: "#198754"}} />
                                    ) : isWishlisted ? (
                                        "❤️"
                                    ) : (
                                        "🤍"
                                    )}
                                </button>

                                {isOutOfStock && (
                                    <span
                                        className="position-absolute badge bg-danger"
                                        style={{top: 12, left: 12, fontSize: 12, borderRadius: 8}}
                                    >
                                        Out of Stock
                                    </span>
                                )}
                            </div>
                            {allImages.length > 1 && (
                                <div className="d-flex gap-2 flex-wrap mt-1">
                                    {allImages.map((img: string, i: number) => (
                                        <img
                                            key={i}
                                            src={img}
                                            onClick={() => setActiveImg(img)}
                                            alt={`thumb-${i}`}
                                            style={{
                                                width: 64,
                                                height: 64,
                                                objectFit: "cover",
                                                borderRadius: 10,
                                                cursor: "pointer",
                                                border: activeImg === img ? "2.5px solid #198754" : "2px solid #e9ecef",
                                                transition: "border-color 0.2s",
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

                         {/* ── GREEN HEADER (like your HTML) ── */}
                     <div className="bg-success text-white py-3 px-4">
                                <span className="badge fs-7 bg-white text-success px-4 py-2 mb-2 rounded-pill fw-semibold"> 🌿 {product.category || "Category"} </span>
                                <h3 className="fw-bold mb-2 text-white"> {product.product_name} </h3>
                                <div className="d-flex gap-3 flex-wrap fs-6">
                                    {product.farmer_id?.name && <span>👨‍🌾 {product.farmer_id.name}</span>}
                                    {product.location && <span>📍 {product.location}</span>}
                                </div>
                    </div>
                            {/* ── BODY ── */}
                    <div className="px-4 py-2">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <div className="fs-4">
                                    {[1, 2, 3, 4, 5].map((i) => ( <span key={i} style={{color: i <= displayRating ? "#f59e0b" : "#e5e7eb"}}> ★</span> ))}
                                    </div>
                                    <span className="fw-bold">{avgRating}</span>
                                    <span className="text-muted">({reviews.length} reviews)</span>
                                </div>

                                <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap">
                                    <div className="fw-bold">
                                     <span className="fw-bold text-success fs-2"> ₹{product.price} </span>
                                    {product.unit && <span className="text-muted ms-1 fs-2">/ {product.unit}</span>}
                                    </div>
                                    <span className={`badge fs-7 ${ isOutOfStock ? "bg-danger" : "bg-success text-white" } px-4 py-2`} >
                                     {isOutOfStock  ? "Out of Stock" : `✅ ${product.stock} ${product.unit || "units"} left`}
                                    </span>
                                </div>

                                {/* 📄 Description */}
                                {product.description && (<p className="mb-2 fs-6" style={{lineHeight: 1.7}}> {product.description}</p> )}
                                <hr />
                                {/* 🔢 Quantity */}
                                {canOrder && !isOutOfStock && (
                                    <>
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <span className="fw-semibold fs-6">Quantity :</span>
                                            <div className="d-flex border rounded overflow-hidden w-25">
                                                <button className="btn btn-sm btn-light w-100" onClick={() => setQty((q) => Math.max(1, q - 1))}> -</button>
                                                <span className="btn btn-sm btn-white fw-bold w-100 border">{qty}</span>
                                                <button className="btn btn-sm btn-success text-white w-100" onClick={() => setQty((q) => Math.min(product.stock, q + 1))}> + </button>
                                            </div>
                                        </div>

                                        {/* 💵 Total */}
                                        <div className="mb-4">
                                            <span className="fw-semibold">Total: </span>
                                            <span className="fw-bold text-success fs-4"> ₹{(product.price * qty).toLocaleString()} </span>
                                            {qty > 1 && (<span className="fs-6"> ({qty} × ₹{product.price}) </span>)}
                                        </div>

                                        {/* 🛒 Buttons */}
                                        <div className="d-flex gap-2 mb-3">
                                            <button className="btn btn-success w-100 fw-bold" onClick={addToCart} disabled={addingToCart}> {addingToCart ? "Adding..." : "🛒 Add to Cart"}</button>
                                            <button className="btn btn-warning w-100 fw-bold" onClick={buyNow}>⚡ Buy Now</button>
                                        </div>
                                    </>
                                )}
                                 {role === "farmer" && ownProduct && (
                                  <>
                                   <div className="row py-4 g-2">
                                   <button className="btn btn-outline-primary btn-sm flex-grow-1 w-50 px-2" onClick={() => router.push(`/ProductUpdate/${product._id}`)}>✏️ Edit</button>
                                   <div className="px-1"></div>
                                   <Link href={`/Rates`} className="btn btn-secondary btn-sm flex-grow-1 w-50"> Cancel</Link>
                                  </div>
                                </>
                                 )}
                                {/* ⚠️ Out of stock */}
                                {isOutOfStock && ( <div className="alert alert-warning">⚠️ Product currently unavailable</div> )}
                                {/* 🔐 Login */}
                                {!user && ( <Link href="/Login" className="btn btn-outline-secondary w-100"> 🔐 Login to Order </Link>)}
                            </div>
                        </div>
                    </div>
                </div>

{/* ⭐ Reviews Section */}
<div className="card border-0 shadow-sm mt-4" style={{ borderRadius: 16 }}>
  
  {/* Header */}
  <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
    <div className="">
      <h4 className="fw-bold mb-0">⭐ Customer Reviews</h4>
      <small className="text-muted">Real feedback from buyers</small>
    </div>

    <div className="text-end">
      <div className="fw-bold text-warning fs-4">
        {[1, 2, 3, 4, 5].map((i) => ( <span key={i} style={{color: i <= displayRating ? "#f59e0b" : "#e5e7eb"}}>★ </span>))}
        {avgRating}</div>
      <small className="fw-bold fs-6">out of 5</small>
    </div>
  </div>

  <div className="px-4 py-3">
  <div className="row">
  <div className="col-6">
    {/* ✍️ Review Form */}
    {canReview && (
      <div className="mb-4 p-3 rounded-3 bg-white border">
        <h5 className="fw-bold text-success mb-3">✍️ Write your review</h5>

        {/* Stars */}
        <div className="d-flex align-items-center gap-2 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <span className="fs-3" key={star}onClick={() => setReviewRating(star)}
              onMouseEnter={() => setHoverRating(star)}onMouseLeave={() => setHoverRating(0)}
              style={{ cursor: "pointer", color: star <= (hoverRating || reviewRating) ? "#f59e0b" : "#e5e7eb", transition: "0.2s",}}>
              ★
            </span>
          ))}
        </div>

        {/* Input */}
        <textarea className="form-control mb-3 fs-6 border-0 shadow-sm rounded" rows={4} placeholder="Share your experience..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">{reviewComment.length}/500</small>
          <button className="btn btn-success px-3 rounded-3" onClick={submitReview} disabled={submittingReview || reviewComment.trim().length < 5} >
          {submittingReview ? "Posting..." : "Post Review"}
          </button>
        </div>
      </div>
    )}

    {/* 🔐 Login message */}
    {!user && (
      <div className="alert alert-light border d-flex align-items-center gap-2">
        <span>💬</span>
        <span>  Please <Link href="/Login" className="fw-bold">login</Link> to write a review</span>
      </div>
    )}
  </div>
  <div className="col-6">
    {/* 📦 Reviews List with Scroll */}
    {reviews.length === 0 ? (
      <div className="text-center py-4 text-muted"> No reviews yet </div>
    ) : (
      <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
        <div className="d-flex flex-column gap-3">
          {reviews.map((r) => {
            const name = r.user_id?.name || r.buyer_id?.name || r.reviewer_name || "User";
            return ( 
                <div key={r._id}className="p-3 rounded-3 border bg-white" >
                <div className="d-flex align-items-center gap-3 mb-2">

                  {/* Avatar */}
                  <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-6"
                    style={{ width: 36, height: 36, background: "#198754" }} >
                    {name[0]?.toUpperCase()}
                  </div>

                  {/* Name + Rating */}
                  <div className="flex-grow-1">
                    <div className="fw-semibold fs-6"> {name} </div>
                    <div className="fs-6">
                     {[1, 2, 3, 4, 5].map((i) => ( <span key={i} style={{ color: i <= r.rating ? "#f59e0b" : "#e5e7eb" }}> ★ </span> ))}
                    </div>
                  </div>
                  {r.createdAt && (
                    <small className="text-muted fs-7">
                      {new Date(r.createdAt).toLocaleDateString("en-IN")} <br/>
                      {new Date(r.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </small>
                  )}
                </div>
                <div className="text-muted fs-6"> {r.comment || "No comment"} </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
  </div>

  </div>
</div>

{/* 🌾 Similar Products */}
<div className="card border-0 shadow-sm mt-4 rounded-3">
  <div className="p-4 pb-2 border-bottom">
    <h5 className="fw-bold mb-0">🌾 Similar Products</h5>
    <small className="text-muted">You may also like these items</small>
  </div>

  <div className="px-4 py-3">
{similar.length === 0 ? (
   <div className="text-center text-muted py-4"> No similar products found </div>
  ) : similar.length === 1 ? (

  <div className="col-12 col-md-6 mx-auto">
    <div className="card border-0 shadow-sm overflow-hidden rounded" style={{ cursor: "pointer", transition: "0.3s" }}
      onClick={() => router.push(`/ProductDetails/${similar[0]._id}`)}>
      <div className="bg-light d-flex align-items-center justify-content-center">
      <img src={similar[0].image_url || "https://placehold.co/200"} alt={similar[0].product_name} style={{ height: "25vh", objectFit: "contain" }}/>
      </div>
      <div className="p-3">
        <h6 className="fw-semibold text-truncate mb-1 fs-5"> {similar[0].product_name}</h6>
        <div className="fw-bold text-success fs-6"> ₹{similar[0].price}</div>
      </div>
    </div>
  </div>
) : (
  
  <Slider {...sliderSettings}>
    {similar.map((s) => (
      <div key={s._id} className="px-2">
        <div className="card border-0 shadow-sm h-100 overflow-hidden rounded"
          style={{ borderRadius: 14, cursor: "pointer", transition: "0.3s" }} onClick={() => router.push(`/ProductDetails/${s._id}`)}>
          <div className="bg-light d-flex align-items-center justify-content-center">
            <img src={s.image_url || "https://placehold.co/200"} alt={s.product_name} style={{ height: "25vh", objectFit: "contain" }}/>
          </div>
 
           <div className="p-3 flex-grow-1">
          <div className="fw-bold text-truncate d-flex m-auto pb-1 fs-6">{s.product_name}
          <div className="fw-bold text-success ms-auto fs-5">
            ₹{s.price} <span className="text-muted fw-normal">/{s.unit}</span>
          </div>
           </div>
      
          {s.farmer_name && (
            <div className="d-flex gap-2 flex-wrap mt-1 fs-7 d-flex m-auto" style={{ fontSize: 12, color: "#6b7280" }}>
             👨‍🌾 {s.farmer_name}
             <span className="ms-auto">
              📦 {s.stock} {s.unit}
            </span>
            </div>
          )}
          <div className="d-flex gap-2 flex-wrap mt-1 fs-7 d-flex m-auto" >
          <span className="fw-semibold text-muted">
          📍 {s.location || "—"}
           </span>
            
          </div>
        </div>
        <div className="card-footer bg-white border-0">
    <div className="card-footer bg-white border-0">
  {/* Guest / no login */}
  {!user && (
    <Link href="/Login"
      onClick={(e) => { if (!confirm("Login required. Do you want to login?")) e.preventDefault(); }}
      className="btn btn-outline-secondary btn-sm w-100">
      Order Now
    </Link>
  )}

  {/* Buyer: always Order Now */}
  {isBuyer && (
    <button className="btn btn-success btn-sm w-100"
      disabled={s.unavailable}
      onClick={() => router.push(`/ProductDetails/${s._id}`)}>
      🛒 Order Now
    </button>
  )}

  {/* Farmer: Edit if own product, Order Now if others */}
  {isFarmer && String(s.farmer_id?._id || s.farmer_id || "") === userId && (
    <Link href={`/ProductUpdate/${s._id}`}
      className="btn btn-outline-primary btn-sm w-100">
      ✏️ Edit
    </Link>
  )}
  {isFarmer && String(s.farmer_id?._id || s.farmer_id || "") !== userId && (
    <button className="btn btn-outline-secondary btn-sm w-100"
      onClick={() => router.push(`/ProductDetails/${s._id}`)}>
      Order Now
    </button>
  )}
</div>
        </div>
        </div>
      </div>
    ))}
  </Slider>
)}
  </div>
</div>
            </div>
            </div>
        </div>
    );
}
