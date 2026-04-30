"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const API = `${process.env.NEXT_PUBLIC_API_URL}`  ;
const getUserId = (u: any) => (u?.id || u?._id || "").toString();
const toId = (v: any) => (typeof v === "object" ? v?._id || v?.$oid || "" : v);
const isOwner = (docId: any, userId: string) => String(toId(docId)) === String(userId);

export default function MarketPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [locFilter, setLocFilter] = useState("");
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"mandi" | "agent" | "farmer">("mandi");
  const [products, setProducts] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const userId = useMemo(() => getUserId(user), [user]);
  const role: string = user?.role || "guest";

  useEffect(() => { const u = JSON.parse(localStorage.getItem("user") || "null");
    setUser(u);
    if (u?.role === "agent") setTab("agent");
    else if (u?.role === "farmer") setTab("farmer");
  }, []);
  useEffect(() => {
    let timer: any;
    if (loading) { setProgress(0);
      timer = setInterval(() => {setProgress((p) => (p < 90 ? p + 5 : p)); }, 200);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const [p, r] = await Promise.all([
        fetch(`${API}/products`).then((res) => res.json()),
        fetch(`${API}/agent-rates`).then((res) => res.json()),
      ]);
      setProducts(p || []);
      setRates(r || []);
    } catch {
      setProducts([]);
      setRates([]);
    } finally {
      setProgress(100);
      setTimeout(() => setLoading(false), 400);
    }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const mandiList = useMemo(() => [
    ...products.map((p) => ({ ...p, type: "farmer" })),
    ...rates.map((r) => ({ ...r, type: "agent" })),
  ], [products, rates]);

  const roleBaseList = useMemo(() => {
    if (role === "farmer") { return products .filter((p) => isOwner(p.farmer_id, userId)) .map((p) => ({ ...p, type: "farmer" }));}
    if (role === "agent") {return rates .filter((r) => isOwner(r.agent_id, userId))  .map((r) => ({ ...r, type: "agent" }));}
    return mandiList;
  }, [role, userId, products, rates, mandiList]);

  const filteredList = useMemo(() => {
    return roleBaseList.filter((item) => {
      const name = (item.name || item.product_name || "").toLowerCase();
      const loc = (item.location || "").toLowerCase();
      return (
        name.includes(search.toLowerCase()) &&
        (category === "All" || item.category === category) &&
        (!locFilter || loc.includes(locFilter.toLowerCase()))
      );
    });
  }, [roleBaseList, search, category, locFilter]);

  const categories = useMemo(() => ["All", ...new Set(products.map((p) => p.category).filter(Boolean))],[products]);
  const allLocations = useMemo(() => ["All", ...new Set(mandiList.map((m) => m.location).filter(Boolean))],[mandiList]);
  const finalList = useMemo(() => {
    if (role === "farmer" || role === "agent") return filteredList;
    if (tab === "mandi") return filteredList;
    if (tab === "agent") return filteredList.filter((item) => item.type === "agent");
    if (tab === "farmer") return filteredList.filter((item) => item.type === "farmer");
    return [];
  }, [filteredList, tab, role]);

  const [mandiVisible, setMandiVisible] = useState(8);
  const [agentVisible, setAgentVisible] = useState(8);
  const [farmerVisible, setFarmerVisible] = useState(8);
  const visibleCount = tab === "mandi" ? mandiVisible : tab === "agent" ? agentVisible : farmerVisible;

  useEffect(() => {
    setMandiVisible(8);
    setAgentVisible(8);
    setFarmerVisible(8);
  }, [tab]);

  const Card = ({ item }: any) => { const own = item.type === "farmer" ? 
  isOwner(item.farmer_id, userId) : isOwner(item.agent_id, userId);

  return (
      <div className="card shadow-sm h-100">
        <img src={item.image_url || "https://placehold.co/300"} className="card-img-top" style={{ height: 150, objectFit: "cover" }} />
        <div className="card-body">
          <h6 className="fw-bold">{item.name || item.product_name}</h6>
          <div className="text-success fw-bold">₹{item.price}/{item.unit}</div>
          <small className="text-muted d-block">📍 {item.location}</small>
          {item.type === "farmer" && (  <small className="text-muted">📦 Stock: {item.stock}</small> )}
          {own && ( <span className="badge bg-success mt-2 d-block"> Your {item.type === "farmer" ? "Product" : "Rate"}  </span> )}
        </div>

        <div className="card-footer bg-white d-flex gap-2">

          {role === "buyer" && (
            <button className="btn btn-success w-100 btn-sm fw-semibold" 
            onClick={() => router.push(`/ProductDetails/${item._id}`)}> 🛒 Product Details</button>
          )}
          {role === "farmer" && (
            <>
              <button className="btn btn-outline-primary btn-sm flex-grow-1" onClick={() => router.push(`/ProductUpdate/${item._id}`)}> ✏️Edit</button>
              <button className="btn btn-outline-secondary btn-sm flex-grow-1" onClick={() => router.push(`/ProductDetails/${item._id}`)}> 👁️ View</button>
            </>
          )}
          {role === "agent" && (
            <>
              <button className="btn btn-outline-primary btn-sm flex-grow-1" onClick={() => router.push(`/AgentRateEdit/${item._id}`)}> ✏️Edit</button>
              <button className="btn btn-outline-secondary btn-sm flex-grow-1" onClick={() => router.push(`/ProductDetails/${item._id}`)}>👁️View</button>
            </>
          )}
          {(role === "guest" || role === "admin") && (
            <button className="btn btn-outline-secondary w-100 btn-sm" onClick={() => router.push(`/ProductDetails/${item._id}`)}>🛒 Product Details</button>
          )}
        </div>
      </div>
    );
  };
  const emptyMsg = role === "farmer" ? "Aapne abhi koi product add nahi kiya." : role === "agent"  ? "Aapne abhi koi rate add nahi kiya." : "Koi data nahi mila.";

  return ( 
        <div className="bg-light py-4 pt-2">
      <div className="container-fluid">

        {/* ── HEADER ── */}
        <div className="bg-success rounded border-bottom shadow-sm text-light">
        <div className="container text-light py-3 d-flex justify-content-between align-items-center">
        
          <div className="d-flex flex-column">
            <h4 className="mb-0">🌾 Demo Market</h4>
            <small className="opacity-75">
              {role === "farmer" ? "Aapke listed products 🌾" : role === "agent"  ? "Aapke listed rates 🏪" : "Fresh Mandi & Rates Available Here 🌾🌾"}
            </small>
          </div>

          {(role === "farmer" || role === "agent") && ( 
           <Link href="/ProductAdd" className="btn btn-light px-3 py-1 btn-sm fw-semibold"> ➕ {role === "agent" ? "Rate Add Karo" : "Product Add Karo"} </Link>
           )}
        </div>
       </div>
       </div>
      <div className="container">
        
          <div className="bg-white p-3 mb-2 shadow-sm rounded">
          <input type="text" className="form-control" placeholder="🔍 Search product..." value={search} onChange={(e) =>setSearch(e.target.value)}/>
        </div>
        
        {(role === "guest" || role === "admin") && (
          <div className="bg-white p-3 mb-3 shadow-sm rounded">
            <div className="row g-0">
              <div className="col">
                <div className="d-flex flex-wrap gap-2">
                {categories.map((c) => (<button key={c} onClick={() => setCategory(c)} className={`btn btn-sm ${category === c ? "btn-success" : "btn-outline-secondary"}`}>{c}</button> ))}
                </div>
              </div>
              {(role === "admin") && (
              <div className="col my-1">
                <div className="btn-group">
                  <button onClick={() => setTab("mandi")} className={`btn btn-sm me-1 ${tab === "mandi" ? "btn-success" : "btn-outline-success"}`}>🌾Mandi</button>
                  <button onClick={() => setTab("agent")} className={`btn btn-sm me-1 ${tab === "agent" ? "btn-warning" : "btn-outline-warning"}`}> 🏪Agent</button>
                  <button onClick={() => setTab("farmer")} className={`btn btn-sm ${tab === "farmer" ? "btn-primary" : "btn-outline-primary"}`}> 👨‍🌾Farmer</button>
                </div>
              </div>)}
              <div className="col">
                <select className="form-select" value={locFilter}
                  onChange={(e) => setLocFilter(e.target.value)}>{allLocations.map((l) => (  <option key={l} value={l === "All" ? "" : l}>📍 {l}</option>))}
                </select>
                {locFilter && (<button className="btn btn-sm btn-outline-secondary mt-2 w-100" onClick={() => setLocFilter("")}> ✕ Clear Location</button>)}
              </div>
            </div>
          </div>
        )}
        {role === "buyer" && (
          <div className="bg-white p-3 mb-3 shadow-sm rounded">
            <div className="row g-2">
              <div className="col-md-8">
                <div className="d-flex flex-wrap gap-2">
                 {categories.map((c) => (<button key={c} onClick={() => setCategory(c)}className={`btn btn-sm ${category === c ? "btn-success" : "btn-outline-secondary"}`}>    {c}  </button>))}
                </div>
              </div>
              <div className="col-md-4">
                <select className="form-select form-select-sm" value={locFilter}
                  onChange={(e) => setLocFilter(e.target.value)}>
                  {allLocations.map((l) => (  <option key={l} value={l === "All" ? "" : l}>📍 {l}</option>))}
                </select>
                {locFilter && ( <button className="btn btn-sm btn-outline-secondary mt-1 w-100" onClick={() =>setLocFilter("")}>✕ Clear </button>)}
              </div>
            </div>
          </div>
        )}
        {(role === "farmer" || role === "agent") && (
          <div className="bg-white p-3 mb-3 shadow-sm rounded">
            <div className="d-flex flex-wrap gap-2">
              {categories.map((c) => (
               <button key={c} onClick={() => setCategory(c)}  className={`btn btn-sm ${category === c ? "btn-success" : "btn-outline-secondary"}`}>  {c}</button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center mt-5">
            <div className="spinner-border text-success mb-3" />
            <div className="progress w-50 mx-auto" style={{ height: "8px" }}>
              <div className="progress-bar bg-success" style={{ width: `${progress}%` }} />
            </div>
            <small className="text-muted d-block mt-2">Loading... {progress}%</small>
          </div>
        ) : (
          <>
            {/* Count */}
            <div className="mb-2">
              <small className="text-muted fw-semibold">
                {role === "farmer" && `📦 Aapke Products: ${finalList.length}`}
                {role === "agent"  && `🏪 Aapke Rates: ${finalList.length}`}
                {role === "buyer"  && `🛒 Available Products: ${finalList.length}`}
              </small>
            </div>

            {/* ── LIST ── */}
            <div className="row g-3">
              {finalList.slice(0, visibleCount).map((item) => (
                <div key={item._id} className="col-6 col-md-4 col-lg-3">
                 <Card item={item} />
                </div>
              ))}

              {/* VIEW MORE / LESS */}
              {finalList.length > 8 && (
                <div className="col-12 col-md-4 col-lg-3 mx-auto mt-3">
                  {visibleCount < finalList.length ? (
                    <button className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => {
                        if (tab === "mandi")  setMandiVisible((v) => v + 12);
                        if (tab === "agent")  setAgentVisible((v) => v + 12);
                        if (tab === "farmer") setFarmerVisible((v) => v + 12);
                      }}>
                      View More
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-outline-danger w-100"
                      onClick={() => {
                        if (tab === "mandi")  setMandiVisible(8);
                        if (tab === "agent")  setAgentVisible(8);
                        if (tab === "farmer") setFarmerVisible(8);
                      }}>
                      Show Less
                    </button>
                  )}
                </div>
              )}
            </div>

            {finalList.length === 0 && (
              <div className="text-center text-muted mt-4"> ❌ {emptyMsg}
                {(role === "farmer" || role === "agent") && (
                  <div className="mt-2">
                    <Link href="/ProductAdd" className="btn btn-success btn-sm">
                      ➕ Abhi Add Karo
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}