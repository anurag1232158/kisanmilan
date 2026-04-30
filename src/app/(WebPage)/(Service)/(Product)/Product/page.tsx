"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productName } from "../Constants/productName";
const API = `${process.env.NEXT_PUBLIC_API_URL}`;

const getUserId = (u: any) => (u?.id || u?._id || "").toString();
const toId = (v: any) =>typeof v === "object" ? v?._id || v?.$oid || "" : v;
const isOwner = (docId: any, userId: string) => String(toId(docId)) === String(userId);
export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [locFilter, setLocFilter] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    setUser(u);
  }, []);

  const userId = useMemo(() => getUserId(user), [user]);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        fetch(`${API}/products`).then(res => res.json()),
        fetch(`${API}/agent-rates`).then(res => res.json()),
      ]);
      setProducts(p || []);
      setRates(r || []);
    } catch {
      setProducts([]);
      setRates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const role = user?.role;
  const isBuyer = role === "buyer";
  const isFarmer = role === "farmer";
  const isAgent = role === "agent";
  const isDeliveryPartner = role === "dpartner";

  const allLocations = useMemo(() => {
    const locs = [
      ...products.map(p => p.location),
      ...rates.map(r => r.location),
    ].filter(Boolean);

    return ["All", ...Array.from(new Set(locs))];
  }, [products, rates]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search || p.name?.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        category === "All" || p.category === category;
      const matchLocation =
        !locFilter ||
        p.location?.toLowerCase().includes(locFilter.toLowerCase());
      return matchSearch && matchCat && matchLocation;
    });
  }, [products, search, category, locFilter]);

  const outStock = Number(filteredProducts.find((p) => p.stock === 0)) === 0;
  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      const matchSearch =
        !search ||
        r.product_name?.toLowerCase().includes(search.toLowerCase());

      const matchLocation =
        !locFilter ||
        r.location?.toLowerCase().includes(locFilter.toLowerCase());

      return matchSearch && matchLocation;
    });
  }, [rates, search, locFilter]);

  const ChangeBadge = ({ change }: { change?: string }) => {
    if (!change || change === "0%" || change === "0") return null;
    const isDown = change.startsWith("-");
    return (
      <span
        className={`badge position-absolute ${isDown ? "bg-danger" : "bg-warning text-dark"}`}
        style={{ top: 8, right: 8, fontSize: 11 }}
      >
        {isDown ? "📉" : "📈"} {change}
      </span>
    );
  };

  const [visibleProducts, setVisibleProducts] = useState(8);
  const [visibleRates, setVisibleRates] = useState(8);
  useEffect(() => {
  setVisibleProducts(8);
  }, [search, category, locFilter]);

  useEffect(() => {
  setVisibleRates(8);
  }, [search, locFilter]);

  const ProductCard = ({ p }: any) => {
    const own = isOwner(p.farmer_id || p.agent_id, userId);
    return (
      <>
      <div className="card shadow-sm h-100 border-0">
      <Link href={`#`} className="text-decoration-none">
          <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
            <img  src={p.image_url || "https://placehold.co/300"}
              alt={p.name || "Product"}  style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => {  (e.target as HTMLImageElement).src =  `https://placehold.co/300}`; }}
            />
          </div>
      </Link>

      <div className="">
         <span className="position-absolute top-0 start-0 bg-primary text-white px-2 py-1 fs-8">
              {p.category}
            </span>
             <ChangeBadge change={p.change} />
            {outStock && (
              <div className="position-absolute bottom-0 start-0 w-100 bg-danger text-white text-center py-1 fs-8">
                <strong>Out of Stock</strong>
              </div>
            )}
            {!outStock && p.unavailable && (
              <div className="position-absolute bottom-0 start-0 w-100 bg-warning text-dark text-center py-1 fs-8">
                <strong>Unavailable</strong>
              </div>
            )}

      </div>

        {/* Info */}
        <div className="p-3 flex-grow-1">
          <div className="fw-bold text-truncate d-flex m-auto pb-1 fs-6">{p.name}
          <div className="fw-bold text-success ms-auto fs-5">
            ₹{p.price} <span className="text-muted fw-normal">/{p.unit}</span>
          </div>
           </div>
      
          {p.farmer_name && (
            <div className="d-flex gap-2 flex-wrap mt-1 fs-7 d-flex m-auto" style={{ fontSize: 12, color: "#6b7280" }}>
             👨‍🌾 {p.farmer_name}
             <span style={{ color: outStock ? "#ef4444" : p.stock < 10 ? "#f59e0b" : "#94a3b8" }} className="ms-auto">
              📦 {p.stock} {p.unit}
            </span>
            </div>
          )}
          <div className="d-flex gap-2 flex-wrap mt-1 fs-7 d-flex m-auto" >
          <span className="fw-semibold text-muted">
          📍 {p.location || "—"}
           </span>
            
          </div>
        </div>
        <div className="card-footer bg-white border-0">
           {!isBuyer && !isFarmer && !isDeliveryPartner && (
            <Link  href="/Login" onClick={(e) => {
              const confirmLogin = confirm("Login required. Do you want to login?");
              if (!confirmLogin) {e.preventDefault(); } }}
              href={`/Login`}
              className="btn btn-outline-secondary btn-sm flex-grow-1 w-100">
               Order Now
            </Link>
          )}

          {(isBuyer || (isFarmer && !own)) && (
            <button className={`btn btn-sm w-100 ${isBuyer ? "btn-success" : "btn-outline-secondary"}`}
              disabled={!p.stock || outStock || p.unavailable}
              onClick={() => router.push(`/ProductDetails/${p._id}`)}
            >
            {outStock ? "❌ Out of Stock" : p.unavailable ? "⚠️ Unavailable" : "🛒 Order Now"}
            </button>
          )}
          {isFarmer && own && (
            <Link
              href={`/ProductUpdate/${p._id}`}
           className="btn btn-outline-primary btn-sm flex-grow-1 w-100">
              ✏️ Edit
            </Link>
          )}
          {isDeliveryPartner && (
            <Link
              href={`/ProductDetails/${p._id}`}
              className="btn btn-outline-primary btn-sm flex-grow-1 w-100">
              📦 View
            </Link>
          )}
        </div>
      </div>
      </>
    );
  };
  const RateCard = ({ r }: any) => {
    const own = isOwner(r.agent_id, userId);

    return (
      <div className="card shadow-sm h-100 border-0">
        <div className="card-body">
          <h6 className="fw-bold">{r.product_name}</h6>
          <div className="fw-bold text-primary mb-1">
            ₹{r.price}/{r.unit}
          </div>

          <small className="text-muted d-block">
            📍 {r.location || "No Location"}
          </small>

          {own && <div className="badge bg-success mt-2">Your Rate</div>}
        </div>
      </div>
    );
  };

  /* ───────── RENDER ───────── */
  return (
    <div className="bg-light py-4 pt-2">
       <div className="container-fluid">
      <div className="bg-success rounded-3 border-bottom shadow-sm text-light">
        <div className="container text-light py-3 d-flex justify-content-between align-items-center">
         <div className="d-flex flex-column">
          <h4 className="mb-0 fw-bold">🌾🌾Total Products ({filteredProducts.length})</h4>
          <small className="opacity-75">Fresh Products & Rates Available Here 🌾🌾</small>
        </div>
        <Link href="/ProductAdd" className="btn btn-light px-3 py-1 btn-sm fw-semibold">
          ➕ Add to Product
        </Link>
      </div>
      </div>
      </div>

     <div className="container">
      {/* HEADER */}
   
      {/* SEARCH */}
      <div className="shadow-sm border bg-white py-2 px-2 mb-2">
        <div className="row">
          <div className="col-md-12">
             <div className="input-group">
            <span className="input-group-text bg-white">🔍</span>
            <input type="text" className="form-control" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}/>
           </div>
          </div>
        </div>
      </div>

      {/* CATEGORY */}
      {!isAgent && (
       <>
     <div className="shadow-sm py-3 px-2 mb-3 border">
        <div className="row">
         <div className="col-sm-8 col-12 my-1">
          <div className="d-flex flex-wrap gap-2">
          {["All", ...new Set(productName.map(p => p.category))].map(c => (
           <button key={c} onClick={() => setCategory(c)} className={`btn btn-sm ${ category === c ? "btn-success" : "btn-outline-secondary" }`}>
              {c}
            </button>
          ))}
          </div>
      </div>
      <div className="col-sm-4 col-12 my-1">
        <button className="btn btn-sm btn-outline-success dropdown-toggle w-100" data-bs-toggle="dropdown"> 📍 {locFilter || "All Locations"}</button>
        <ul className="dropdown-menu">
        {allLocations.map((loc) => (
            <li key={loc}>
              <button className="dropdown-item" onClick={() => setLocFilter(loc === "All" ? "" : loc)} >
                📍 {loc}
              </button>
            </li>
          ))}
        </ul>
      {/* CLEAR */}
      {locFilter && (
      <button className="btn btn-sm btn-outline-secondary mb-3 w-100"  onClick={() => setLocFilter("")}> ✕ Clear Location </button>
      )}
      </div>
      </div>
    </div>
    </>
      )}

      {/* PRODUCTS */}
     {!isAgent && (
      <>
    <div className="row g-3">
      {filteredProducts
        .slice(0, visibleProducts)
        .map(p => (<div key={p._id} className="col-6 col-md-4 col-lg-3"> <ProductCard p={p} /> </div>
        ))}
    </div>

    {/* VIEW MORE PRODUCTS */}
    <div className="text-center mt-3">
    {visibleProducts < filteredProducts.length ? (
    <button  className="btn btn-outline-success" onClick={() => setVisibleProducts(v => v + 8)} > View More ({filteredProducts.length - visibleProducts} left)</button>
    ) : (
    <button className="btn btn-outline-danger" onClick={() => setVisibleProducts(8)} >Show Less</button>
    )}

   </div>
    </>
     )}

    {/* RATES */}
     {(isAgent || isFarmer) && (
    <>
    <h5 className="mt-4 mb-3"> 🏪 Your Rates ({filteredRates.length}) </h5>
    <div className="row g-3">
      {filteredRates.slice(0, visibleRates)
       .map(r => ( <div key={r._id} className="col-6 col-md-4 col-lg-3"> <RateCard r={r} /> </div>
       ))}
    </div>

    {/* VIEW MORE RATES */}
    <div className="text-center mt-3">
      {visibleRates < filteredRates.length ? (
      <button className="btn btn-outline-primary" onClick={() => setVisibleRates(v => v + 8)}>
        View More ({filteredRates.length - visibleRates} left)
      </button>
     ) : (
     <button className="btn btn-outline-danger" onClick={() => setVisibleRates(8)}> Show Less</button>
     )}
    </div>
    </>
     )} 

    {/* DelaverPatner  */}
    {isDeliveryPartner && (
      <>
    <h5 className="mt-4 mb-3">🏪 Prodcut Rates ({filteredRates.length}) </h5>
    <div className="row g-3">
          {filteredRates .slice(0, visibleRates).map(r => ( <div key={r._id} className="col-6 col-md-4 col-lg-3"><RateCard r={r} /></div> ))}
    </div>

    {/* VIEW MORE RATES */}
     <div className="text-center mt-3">
       {visibleRates < filteredRates.length ? (
       <button className="btn btn-outline-primary" onClick={() => setVisibleRates(v => v + 8)}>View More ({filteredRates.length - visibleRates} left)</button>
        ) : (
       <button className="btn btn-outline-danger" onClick={() => setVisibleRates(8)}> Show Less</button>
       )}
    </div>
    </>
    )}

    {/* LOADING */}
    {loading && (
      <div className="text-center mt-4">
       <div className="spinner-border text-success" />
      </div>
    )}

    </div>
    </div>
  );
}