"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
const API = `${process.env.NEXT_PUBLIC_API_URL}`  ;

const FEATURES = [
  { icon: "🚚", title: "Free Pickup",        desc: "Khet se seedha mandi tak free delivery — koi jhanjhat, koi charge nahi" },
  { icon: "💰", title: "Seedha Payment",     desc: "Delivery ke 24 ghante mein seedha aapke bank account mein paisa" },
  { icon: "📱", title: "Live Tracking",      desc: "Apne phone par dekhein — aapka maal abhi kahan hai, real-time" },
  { icon: "📊", title: "Live Mandi Bhav",    desc: "Har 15 minute mein update — sahi waqt par sahi daam ka faisla karein" },
  { icon: "🤝", title: "Koi Beechiya Nahi", desc: "Seedha mandi se connect — 100% profit seedha aapki jeb mein" },
  { icon: "🌽", title: "24/7 Hindi Support", desc: "Hindi mein baat karein — hamare experts hamesha aapke saath" },
];
const STEPS = [
  { n: 1, title: "Register Karein",  desc: "Free mein account banaayen — sirf 2 minute lagte hain" },
  { n: 2, title: "Maal List Karein", desc: "Apni fasal ki jaankari daalen — tasveer ke saath" },
  { n: 3, title: "Pickup Schedule",  desc: "Apni suvidha ke hisaab se pickup time chunein" },
  { n: 4, title: "Paisa Paao! 🎉",   desc: "Delivery hone ke baad seedha account mein credit" },
];
const CAT_ICON: Record<string, string> = {
  Vegetables: "🥦", Fruits: "🍎", Grains: "🌾", Dairy: "🥛", Other: "📦",
}; 
const getIcon = (cat?: string) => CAT_ICON[cat || ""] || "🌿";
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let v = 0;
      const tick = () => {
        v += Math.max(1, Math.ceil((to - v) / 28));
        if (v >= to) { setVal(to); return; }
        setVal(v); requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString("en-IN")}{suffix}</span>;
}
function ChgBadge({ change }: { change?: string }) {
  if (!change || change === "0%" || change === "0") return null;
  const dn = change.startsWith("-");
  return (
    <span className={`km-chg-badge ${dn ? "km-chg-dn" : "km-chg-up"}`}>
      {dn ? "▼" : "▲"} {change}
    </span>
  );
}
function SkelRow() {
  return (
    <div className="km-rate-row d-flex gap-2">
      <div className="km-skel" style={{ width: "55%", height: 13 }} />
      <div className="km-skel" style={{ width: "22%", height: 13 }} />
      <div className="km-skel" style={{ width: "15%", height: 13 }} />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [user,        setUser]        = useState<any>(null);
  const [agentRates,  setAgentRates]  = useState<any[]>([]);
  const [farmerRates, setFarmerRates] = useState<any[]>([]);
  const [products,    setProducts]    = useState<any[]>([]);
  const [mandiRates,  setMandiRates]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [userStats,   setUserStats]   = useState({ farmers: 0, users: 0, orders: 0 });

  const fetchAll = useCallback(async (currentUser?: any) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [ar, fr, pr, or_, ur] = await Promise.allSettled([
        fetch(`${API}/agent-rates`,  { headers }).then(r => r.json()),
        fetch(`${API}/farmer-rates`, { headers }).then(r => r.json()),
        fetch(`${API}/products`,     { headers }).then(r => r.json()),
        fetch(`${API}/orders`,       { headers }).then(r => r.json()),
        fetch(`${API}/users`,        { headers }).then(r => r.json()),
      ]);

      const agentList  = ar.status  === "fulfilled" && Array.isArray(ar.value)  ? ar.value  : [];
      const farmerList = fr.status  === "fulfilled" && Array.isArray(fr.value)  ? fr.value  : [];
      const prodList   = pr.status  === "fulfilled" && Array.isArray(pr.value)  ? pr.value  : [];
      const orderList  = or_.status === "fulfilled" && Array.isArray(or_.value) ? or_.value : [];
      const userList   = ur.status  === "fulfilled" && Array.isArray(ur.value)  ? ur.value  : [];

      // mandi = agent + farmer mixed with 1.2x markup (same as Rates page)
      const mixed = [...agentList, ...farmerList].map((r: any) => ({
        ...r,
        name:  r.product_name || r.name,
        price: Math.round(r.price * 1.2),
        _src:  agentList.includes(r) ? "agent" : "farmer",
      }));

      setAgentRates(agentList);
      setFarmerRates(farmerList);
      setProducts(prodList);
      setMandiRates(mixed);
      setUserStats({
        farmers: userList.filter((u: any) => u.role === "farmer").length || farmerList.length,
        users:   userList.length,
        orders:  orderList.length,
      });
    } catch (e) {
      console.error("FETCH ERROR:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { fetchAll({ role: "guest" }); return; }
    try {
      const u = JSON.parse(stored);
      setUser(u);
      fetchAll(u);
    } catch { fetchAll({ role: "guest" }); }
  }, [fetchAll]);

  const tickerItems = (() => {
    const seen = new Set<string>();
    return [...agentRates, ...farmerRates].filter((r: any) => {
      const k = (r.product_name || r.name || "").toLowerCase().trim();
      if (!k || !r.price || seen.has(k)) return false;
      seen.add(k); return true;
    }).map((r: any) => ({
      name: r.product_name || r.name,
      price: r.price,
      change: r.change || "",
    }));
  })();
  const heroRates = (agentRates.length ? agentRates : farmerRates).slice(0, 5);
  const mandiSection = (() => {
    const seen = new Set<string>();
    return mandiRates.filter((r: any) => {
      const k = (r.name || r.product_name || "").toLowerCase().trim();
      if (!k || seen.has(k)) return false;
      seen.add(k); return true;
    }).slice(0, 8);
  })();
  const featuredProds = products .filter((p: any) => p.is_available !== false && Number(p.stock) > 0) .slice(0, 4);
  const counterStats = [
    { to: Math.max(userStats.farmers, 2847), suffix: "+", lbl: "Registered Kisan" },
    { to: Math.max(products.length, 120),    suffix: "+", lbl: "Live Products" },
    { to: Math.max(userStats.orders, 1500),  suffix: "+", lbl: "Total Orders" },
    { to: 98,                                suffix: "%", lbl: "Kisan Khush" },
  ];
  const TODAY = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      {/* ══════ HERO ══════ */}
      <section className="km-hero py-5">
        <div className="container py-3">
          <div className="row align-items-center g-4">

            {/* Left col */}
            <div className="col-lg-8">
              <div className="km-hero-badge mb-3">
                <span className="km-dot" />
                {loading ? "Rates load ho rahe hain..." : `${Math.max(userStats.farmers, 2847).toLocaleString("en-IN")}+ Kisan Jud Chuke Hain`}
              </div>

              <h1 className="km-hero-title text-white mb-3">
                Apni Fasal Ka<br />
                <span className="km-acc">Sahi Daam Paao</span>
              </h1>

              <p className="km-hero-sub fs-6 mb-4">
                Seedha Mandi Se Judo — Beechiya Nahi, Seedha Kisan Ko Faida.
                Free pickup, fast payment, live tracking — sab ek jagah pe.
              </p>

              <div className="km-hero-btns d-flex gap-3 flex-wrap mb-4">
                <Link href="/Register" className="btn btn-lg px-4 py-2 btn-km-gold">
                  Abhi Register Karein — Free!
                </Link>
                <Link href="/Rates" className="btn btn-lg px-4 py-2 btn-km-ghost">
                  Mandi Bhav Dekhen ▶
                </Link>
              </div>

              <div className="d-flex gap-4 flex-wrap">
                {counterStats.map(s => (
                  <div key={s.lbl}>
                    <div className="km-stat-num">
                      <Counter to={s.to} suffix={s.suffix} />
                    </div>
                    <div className="km-stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Live Rate Card */}
            <div className="col-lg-4">
              <div className="km-rate-card p-3 p-md-4">
                <div className="km-rate-card-title d-flex align-items-center gap-2 mb-3 fs-4 fw-bold">
                  <span className="km-live-dot text-danger fs-2 fw-bold" ></span>
                  Aaj Ke Live Rates
                </div>

                {loading ? [1,2,3,4,5].map(i => <SkelRow key={i} />): heroRates.length === 0
                    ? <p className="text-muted text-center py-3 small">⚠️ Server se data nahi aaya</p>
                    :
                     mandiSection.slice(0, 5).map((r: any, i: number) => {

                   const nm  = r.name || r.product_name || "—";
                   const rawChange = r.change || "0%";
                   const value = parseFloat(rawChange) || 0;
                   const type = value < 0 ? "down" : value === 0 ? "neutral" : "up";
                   const bar = Math.min(Math.abs(value) * 8 + 30, 100);
                   const src = r._src || "agent";
                   const dn = type === "down";
                   const chg = rawChange === "0%" ? null : rawChange;
                        return (
                    <div key={i} className="km-rate-row">
                    <span className="km-rate-name">{getIcon(r.category)} {nm}</span>
                    {r.type && ( <span className="km-best-type-badge"> 🏅 {r.type} </span> )}
                    <span className="km-rate-price fw-bold">₹{r.price}
                    <span className="m-0 p-0 fs-8"> per/{r.unit || "kg"}</span>
                    </span>
                    {chg && chg !== "0%" && (
                      <span className={`km-chg-badge ${dn ? "km-chg-dn" : "km-chg-up"}`}>
                      {dn ? "▼" : "▲"} {chg}
                      </span>
                    )}
                    </div>
                        );
                      })}
                <Link href="/Rates" className="btn btn-km-green w-100 mt-3 py-2 text-white">
                  Sab Rates Dekhen →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════ TICKER ══════ */}
      <div className="km-ticker">
        <div className="km-ticker-label">
          <span className="km-blink" /> LIVE RATES
        </div>
        <div className="km-ticker-track">
          {loading ? (
            <span className="px-3 small" style={{ color: "rgba(255,255,255,.6)" }}>Loading...</span>
          ) : tickerItems.length === 0 ? (
            <span className="px-3 small" style={{ color: "rgba(255,255,255,.6)" }}>Koi rate available nahi</span>
          ) : (
            <div className="km-ticker-scroll">
              {[...tickerItems, ...tickerItems].map((r, i) => {
                const dn = (r.change || "").startsWith("-");
                return (
                  <div key={i} className="km-ticker-item">
                    <span className="tn fs-6">{r.name}</span>
                    <span className="tp">₹{r.price} <span className="m-0 p-0 fs-9 text-warning"> per/{r.unit || "kg"}</span></span>
                    {r.change && r.change !== "0%" && (
                      <span className={dn ? "tc-dn" : "tc-up"}>{dn ? "▼" : "▲"} {r.change}</span>
                    )}
                    <span className="tsep">|</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════ FEATURES ══════ */}
      <section className="py-5 bg-km-light">
        <div className="container">
          <h2 className="km-section-title text-center">Kyon Chunein KisanMilan?</h2>
          <p className="km-section-sub text-center mt-1 mb-5">Aapki fasal, aapka faisla — hum sirf saath hain</p>

          <div className="row g-4">
            {FEATURES.map(f => (
              <div key={f.title} className="col-md-6 col-lg-4">
                <div className="km-feat-card bg-white p-4 h-100 shadow-sm text-center border border-light border-1">
                  <span className="km-feat-icon mb-3">{f.icon}</span>
                  <div className="km-feat-title mb-2">{f.title}</div>
                  <p className="km-feat-desc mb-0">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section className="py-5 bg-white">
        <div className="container">
          <h2 className="km-section-title text-center">Kaise Kaam Karta Hai?</h2>
          <p className="km-section-sub text-center mt-1 mb-5">Sirf 4 aasaan steps mein shuru karein</p>

          <div className="km-steps-wrap">
            <div className="km-steps-line d-none d-md-block" />
            <div className="row g-4">
              {STEPS.map(s => (
                <div key={s.n} className="col-6 col-md-3">
                  <div className="km-step-card bg-white p-4 text-center h-100 shadow-sm">
                    <div className="km-step-num mb-3">{s.n}</div>
                    <div className="km-step-title fw-bold mb-2">{s.title}</div>
                    <p className="km-step-desc mb-0">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ MANDI BHAV (Dynamic) ══════ */}
       <section className="py-5 bg-km-light">
        <div className="container">

        <h2 className="km-section-title text-center">Aaj Ke Mandi Bhav</h2>
           <p className="km-section-sub text-center mt-1 mb-5">
           {TODAY} — Live Updated · Agent + Farmer Rates
             </p>

              {loading ? (
        <div className="row g-3">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="col-6 col-md-4 col-lg-3">
            <div className="bg-white rounded-4 p-3">
              <div className="km-skel mb-2" style={{ width: "60%", height: 13 }} />
              <div className="km-skel mb-2" style={{ width: "40%", height: 30 }} />
              <div className="km-skel" style={{ height: 5 }} />
            </div>
          </div>
        ))}
        </div>

         ) : mandiSection.length === 0 ? (

         <p className="text-center text-muted py-4">
        ⚠️ Backend se data nahi aaya. Server check karo.
        </p>

        ) : (

        <div className="row g-3">
        {mandiSection.map((r: any, i: number) => {
          const nm  = r.name || r.product_name || "—";
          const rawChange = r.change || "0%";
          const value = parseFloat(rawChange) || 0;
          const type = value < 0 ? "down" : value === 0 ? "neutral" : "up";
          const bar = Math.min(Math.abs(value) * 8 + 30, 100);
          const src = r._src || "agent";
          return (
            <div key={i} className="col-6 col-md-4 col-lg-3">
              <div className="km-mandi-card bg-white p-3 h-100 shadow-sm rounded-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex flex-column gap-1">
                    <div className="text-muted mb-1 fw-bold">{nm}</div>
                    <div className={`km-mandi-price fs-5 py-1 
                      ${type === "up" ? "text-success" : ""}
                      ${type === "down" ? "text-danger" : ""}
                      ${type === "neutral" ? "text-success" : ""}
                    `}>
                      ₹{r.price} <span className="km-mandi-unit">
                      per/{r.unit || "kg"}
                    </span>
                    </div>
                  
                  </div>

                  <div className="d-flex flex-column align-items-end gap-1">
                    <span className="km-mandi-icon">{getIcon(r.category)}</span>
                    <span className={`km-src-badge ${  src === "agent" ? "km-src-agent" : "km-src-farmer" }`}>
                      {/* {src === "agent" ? "🏪 Agent" : "👨‍🌾 Farmer"} */}
                      {src === "agent" ? "👨‍🌾 Farmer" : "👨‍🌾 Farmer"}
                    </span>
                  </div>
                </div>
                {/* Location */}
                {r.location && (
                  <div className="small text-muted my-3">
                    📍 {r.location}
                  </div>
                )}
                {/* Progress bar */}
                <div className="km-bar-wrap my-2">
                  <div className={`km-bar 
                      ${type === "down" ? "km-bar-dn" : ""}
                      ${type === "up" ? "km-bar-up" : ""}
                      ${type === "neutral" ? "km-bar-warning" : ""}`}  style={{ width: `${bar}%` }}/>
                </div>
                {/* Bottom row */}
                <div className="d-flex justify-content-between align-items-center">
                  {/* CHANGE BADGE */}
                  <span className={`badge 
                    ${type === "up" ? "bg-success" : ""}
                    ${type === "down" ? "bg-danger" : ""}
                    ${type === "neutral" ? "bg-warning" : ""}`}>
                      {/* up color green down neutral neutral color red */}
                      {type === "up" ? "▲" : type === "down" ? "▼" : "•"} {rawChange}

                    
                    {/* {type === "up" ? "▲" : type === "down" ? "▼" : "•"} {rawChange} */}
                  </span>

                  {r.stock ? (
                    <span className="small text-muted">
                      📦 {r.stock} {r.unit || "kg"}
                    </span>
                  ) : null}

                </div>
      
              </div>

            </div>
          );
        })}
        </div>
         )}

          <div className="text-center mt-4">
          <Link href="/Rates" className="btn btn-lg px-4 py-2 btn-km-gold">
          Sab Mandi Bhav Dekhen →
         </Link>
            </div>
        </div>
       </section>

      {/* ══════ FEATURED PRODUCTS (Dynamic) ══════ */}
      {(loading || featuredProds.length > 0) && (
        <section className="py-5 bg-white">
          <div className="container">
            <h2 className="km-section-title text-center">🌱 Featured Products</h2>
            <p className="km-section-sub text-center mt-1 mb-5">
              Seedha kisano se — fresh & direct
            </p>

            {loading ? (
              <div className="row g-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="col-6 col-md-4 col-lg-3">
                    <div className="rounded-4 overflow-hidden bg-white border" style={{ border: "1.5px solid #e8f5e9" }}>
                      <div className="km-skel" style={{ height: 150 }} />
                      <div className="p-3">
                        <div className="km-skel mb-2" style={{ width: "70%", height: 14 }} />
                        <div className="km-skel mb-2" style={{ width: "40%", height: 20 }} />
                        <div className="km-skel" style={{ width: "55%", height: 11 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredProds.length === 0 ? (
              <p className="text-center text-muted py-4">Koi product available nahi</p>
            ) : (
              <div className="row g-3">
                {featuredProds.map((p: any) => {
                  const nm  = p.product_name || p.name || "";
                  const img = p.image_url || `https://placehold.co/400x200/e8f5e9/198754?text=${encodeURIComponent(nm)}`;
                  return (
                    <div key={p._id} className="col-6 col-md-4 col-lg-3">
                      <div className="km-prod-card rounded-4 overflow-hidden bg-white">
                        <Link href={`/ProductView/${p._id}`} className="km-prod-link">
                        <img src={img} alt={nm} className="km-prod-img"
                          onError={e => { (e.target as HTMLImageElement).src =
                         `https://placehold.co/400x200/e8f5e9/198754?text=${encodeURIComponent(nm)}`; }}
                        />
                         </Link>
                        <div className="p-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="km-cat-badge">
                              {getIcon(p.category)} {p.category || "Other"}
                            </span>
                            <ChgBadge change={p.change} />
                          </div>
                          <div className="km-prod-name mb-1 text-truncate">{nm}</div>
                          <div className="km-prod-price">
                            ₹{p.price}
                            <span className="km-prod-unit"> /{p.unit || "kg"}</span>
                          </div>
                          <div className="km-prod-meta mt-1">
                            {p.location && <span>📍 {p.location} · </span>}
                            <span>📦 {p.stock} {p.unit || "kg"}</span>
                            {p.farmer_name && (
                              <div className="mt-1">👨‍🌾 {p.farmer_name}</div>
                            )}
                          </div>
                                                 {!user && (
            <button className="btn btn-outline-success btn-sm w-100 mb-2 mt-4"  onClick={() => router.push("/Login")}>
              🔐 Login to Order
            </button>
          )}
                        </div>
                     
      
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            )}

            {products.filter((p: any) => p.is_available !== false && Number(p.stock) > 0).length > 4 && (
              <div className="text-center mt-4">
                <Link href="/Products" className="btn btn-lg px-4 py-2 btn-km-gold">
                  Sab Products Dekhen →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════ CTA ══════ */}
      <section className="km-cta py-5">
        <div className="container py-3 text-center" style={{ position: "relative", zIndex: 1 }}>
          <h2 className="font-heading text-white fw-bold mb-3">
            Aaj Hi KisanMilan Se Judein!
          </h2>
          <p className="text-white opacity-75 mb-4 fs-6">
            Free registration — koi hidden charge nahi. Apni fasal ka sahi daam paana shuru karein abhi.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link href="/Register" className="btn btn-lg px-4 py-2 btn-km-gold">
              🌾 Free Mein Register Karein
            </Link>
            <Link href="/Rates" className="btn btn-lg px-4 py-2 btn-km-ghost">
              📊 Live Rates Dekhen
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}