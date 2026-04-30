"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = `${process.env.NEXT_PUBLIC_API_URL}`;
type TabKey =
  | "dashboard" | "users" | "products" | "orders" | "payments"
  | "farmerrates" | "agentrates" | "reviews" | "cart"
  | "communications" | "notifications";
type ModalType = "view" | "edit" | "delete" | "contact" | null;
interface ModalState { type: ModalType; collection: string; data: any; }
const PER_PAGE = 10;

export default function AdminDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<TabKey>("dashboard");
  const [users,       setUsers]       = useState<any[]>([]);
  const [products,    setProducts]    = useState<any[]>([]);
  const [orders,      setOrders]      = useState<any[]>([]);
  const [payments,    setPayments]    = useState<any[]>([]);
  const [farmerRates, setFarmerRates] = useState<any[]>([]);
  const [agentRates,  setAgentRates]  = useState<any[]>([]);
  const [reviews,     setReviews]     = useState<any[]>([]);
  const [fetchError, setFetchError] = useState("");
  const [actionMsg,  setActionMsg]  = useState<{ text: string; ok: boolean } | null>(null);
  const [modal,      setModal]      = useState<ModalState>({ type: null, collection: "", data: null });
  const [editForm,   setEditForm]   = useState<any>({});
  const [saving,     setSaving]     = useState(false);
  const [userRoleFilter,    setUserRoleFilter]    = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [payStatusFilter,   setPayStatusFilter]   = useState("all");

  /* ── NEW: Date + Location filters ── */
  const [dateFrom,        setDateFrom]        = useState("");
  const [dateTo,          setDateTo]          = useState("");
  const [productLocFilter,setProductLocFilter] = useState("");
  const [orderLocFilter,  setOrderLocFilter]  = useState("");
  const [productSearch,   setProductSearch]   = useState("");
  const [orderSearch,     setOrderSearch]     = useState("");
  /* dashboard inline filters */
  const [dashProdSearch,   setDashProdSearch]   = useState("");
  const [dashOrderStatus,  setDashOrderStatus]  = useState("all");
  const [dashFarmerSearch, setDashFarmerSearch] = useState("");
  const [dashUserRole,     setDashUserRole]     = useState("all");

  /* comm / notif state */
  const [commTab,       setCommTab]       = useState<"sms"|"email"|"call">("sms");
  const [smsText,       setSmsText]       = useState("");
  const [emailSubject,  setEmailSubject]  = useState("");
  const [emailBody,     setEmailBody]     = useState("");
  const [notifTitle,    setNotifTitle]    = useState("");
  const [notifBody,     setNotifBody]     = useState("");
  const [notifTarget,   setNotifTarget]   = useState("all");
  const [pages, setPages] = useState<Record<string,number>>({
    users:1, products:1, orders:1, payments:1, farmerrates:1, agentrates:1, reviews:1,
  });
  const setPage = (tab:string, n:number) => setPages(p=>({...p,[tab]:n}));
  useEffect(()=>{
    if(typeof window==="undefined") return;
    const stored = localStorage.getItem("user");
    if(!stored){router.push("/AdminLogin");return;}
    let u:any;
    try{u=JSON.parse(stored);}catch{router.push("/AdminLogin");return;}
    if(u?.role!=="admin"){router.push("/");return;}
    fetchAll();
  },[]);
  const getToken=()=>(typeof window!=="undefined"?localStorage.getItem("token")||"":"");
  const safeFetch=async(url:string)=>{
    try{
      const r=await fetch(BASE+url,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${getToken()}`}});
      const text=await r.text();
      let d:any;try{d=JSON.parse(text);}catch{d=[];}
      if(!r.ok){console.error(`[${r.status}] ${url}`,d);return[];}
      return Array.isArray(d)?d:[];
    }catch(e:any){console.error(`❌ ${url}:`,e.message);return[];}
  };
  const fetchAll=async()=>{
    setLoading(true);setFetchError("");
    const[u,p,o,pay,fr,ar,rev]=await Promise.all([
      safeFetch("/user"),safeFetch("/products"),safeFetch("/order"),
      safeFetch("/payment"),safeFetch("/farmer-rates"),safeFetch("/agent-rates"),safeFetch("/review"),
    ]);
    setUsers(u);setProducts(p);setOrders(o);
    setPayments(pay);setFarmerRates(fr);setAgentRates(ar);setReviews(rev);
    if(u.length+p.length+o.length+pay.length+fr.length+ar.length+rev.length===0)
      setFetchError("⚠️ Backend se data nahi aaya. Server check karo.");
    setLoading(false);
  };
  const CC:Record<string,{endpoint:string;label:string}>={
    users:      {endpoint:"/user",        label:"User"},
    products:   {endpoint:"/products",    label:"Product"},
    orders:     {endpoint:"/order",       label:"Order"},
    payments:   {endpoint:"/payment",     label:"Payment"},
    farmerrates:{endpoint:"/farmer-rates",label:"Farmer Rate"},
    agentrates: {endpoint:"/agent-rates", label:"Agent Rate"},
    reviews:    {endpoint:"/review",      label:"Review"},
  };
  const flash=(text:string,ok:boolean)=>{setActionMsg({text,ok});setTimeout(()=>setActionMsg(null),3500);};
  const openView   =(col:string,row:any)=>{ setModal({type:"view",   collection:col,data:row}); };
  const openEdit   =(col:string,row:any)=>{ setEditForm({...row}); setModal({type:"edit",   collection:col,data:row}); };
  const openDelete =(col:string,row:any)=>{ setModal({type:"delete", collection:col,data:row}); };
  const openContact=(col:string,row:any)=>{ setModal({type:"contact",collection:col,data:row}); };
  const closeModal =()=>setModal({type:null,collection:"",data:null});
  /* ── FIXED: handleSave uses editForm state ── */
  const handleSave=async()=>{
    if(!modal.data?._id)return;
    const cfg=CC[modal.collection];if(!cfg)return;
    setSaving(true);
    try{
      const payload={...editForm};
      delete payload._id;delete payload.__v;delete payload.createdAt;delete payload.updatedAt;
      const r=await fetch(`${BASE}${cfg.endpoint}/${modal.data._id}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${getToken()}`},
        body:JSON.stringify(payload)
      });
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||d.message||"Update failed");
      flash(`✅ ${cfg.label} updated successfully!`,true);
      closeModal();
      fetchAll();
    }catch(e:any){flash(`❌ ${e.message}`,false);}
    setSaving(false);
  };
  /* ── FIXED: Quick status change for orders ── */
  const handleQuickStatusChange=async(orderId:string,newStatus:string)=>{
    try{
      const r=await fetch(`${BASE}/order/${orderId}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${getToken()}`},
        body:JSON.stringify({status:newStatus})
      });
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||d.message||"Update failed");
      flash(`✅ Order status → ${newStatus}`,true);
      fetchAll();
    }catch(e:any){flash(`❌ ${e.message}`,false);}
  };

  const handleDelete=async()=>{
    if(!modal.data?._id)return;
    const cfg=CC[modal.collection];if(!cfg)return;
    setSaving(true);
    try{
      const r=await fetch(`${BASE}${cfg.endpoint}/${modal.data._id}`,{method:"DELETE",headers:{Authorization:`Bearer ${getToken()}`}});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||d.message||"Delete failed");
      flash(`🗑️ ${cfg.label} deleted!`,true);closeModal();fetchAll();
    }catch(e:any){flash(`❌ ${e.message}`,false);}
    setSaving(false);
  };
  const logout=()=>{localStorage.removeItem("token");localStorage.removeItem("user");router.push("/AdminLogin");};
  const fmt    =(d:string)=>d?new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
  const money  =(n:any)=>"₹"+Number(n||0).toLocaleString("en-IN");
  const shortId=(id:any)=>id?String(id).slice(-6):"—";
  /* ── Date filter helper ── */
  const inDateRange=(dateStr:string)=>{
    if(!dateFrom&&!dateTo) return true;
    const d=new Date(dateStr);
    if(isNaN(d.getTime())) return true;
    const from=dateFrom?new Date(dateFrom):null;
    const to  =dateTo  ?new Date(dateTo+"T23:59:59"):null;
    if(from&&d<from) return false;
    if(to  &&d>to  ) return false;
    return true;
  };

  const roleBadge=(role:string)=>{
    const m:any={farmer:"success",buyer:"primary",agent:"warning",admin:"danger",dpartner:"purple"};
    const cls=m[role]||"secondary";
    if(cls==="purple") return <span className="badge rounded-pill text-white" style={{background:"#7c3aed",fontSize:"0.7rem"}}>{role}</span>;
    return <span className={`badge bg-${cls} rounded-pill`} style={{fontSize:"0.7rem"}}>{role||"—"}</span>;
  };
  const statusBadge=(s:string)=>{
    const m:any={pending:"warning",confirmed:"primary",shipped:"info",delivered:"success",cancelled:"danger",completed:"success",failed:"danger",refunded:"secondary"};
    return <span className={`badge bg-${m[(s||"").toLowerCase()]||"secondary"} rounded-pill`} style={{fontSize:"0.7rem"}}>{s||"—"}</span>;
  };
  const farmers  =users.filter((u:any)=>u.role==="farmer");
  const buyers   =users.filter((u:any)=>u.role==="buyer");
  const agents   =users.filter((u:any)=>u.role==="agent");
  const dpartners=users.filter((u:any)=>u.role==="dpartner");
  const revenue  =payments.filter((p:any)=>p.status==="completed").reduce((s:number,p:any)=>s+(p.amount||0),0);

  /* ── FIXED: All filters applied together ── */
  const filteredUsers   =userRoleFilter==="all"?users:users.filter((u:any)=>u.role===userRoleFilter);

  const filteredProducts=products.filter((p:any)=>{
    const matchSearch=!productSearch||(p.product_name||p.name||"").toLowerCase().includes(productSearch.toLowerCase());
    const matchLoc   =!productLocFilter||(p.location||"").toLowerCase().includes(productLocFilter.toLowerCase());
    const matchDate  =inDateRange(p.createdAt);
    return matchSearch&&matchLoc&&matchDate;
  });
  const filteredOrders=orders.filter((o:any)=>{
    const matchStatus=orderStatusFilter==="all"||o.status===orderStatusFilter;
    const matchSearch=!orderSearch||(o.buyer_name||"").toLowerCase().includes(orderSearch.toLowerCase())||(o.product_name||"").toLowerCase().includes(orderSearch.toLowerCase());
    const matchLoc   =!orderLocFilter||(o.delivery_address||"").toLowerCase().includes(orderLocFilter.toLowerCase());
    const matchDate  =inDateRange(o.createdAt);
    return matchStatus&&matchSearch&&matchLoc&&matchDate;
  });
  const filteredPayments=payStatusFilter==="all"?payments.filter((p:any)=>inDateRange(p.createdAt)):payments.filter((p:any)=>p.status===payStatusFilter&&inDateRange(p.createdAt));
  const dashProducts=products.filter((p:any)=>!dashProdSearch||(p.product_name||p.name||"").toLowerCase().includes(dashProdSearch.toLowerCase())).slice(0,10);
  const dashOrders  =orders.filter((o:any)=>dashOrderStatus==="all"||o.status===dashOrderStatus).slice(0,10);
  const dashFarmers =farmerRates.filter((f:any)=>!dashFarmerSearch||(f.farmer_name||"").toLowerCase().includes(dashFarmerSearch.toLowerCase())).slice(0,10);
  const dashUsers   =users.filter((u:any)=>dashUserRole==="all"||u.role===dashUserRole).slice(0,10);
  const paginate=(data:any[],tab:string)=>{
    const pg=pages[tab]||1;
    const total=Math.ceil(data.length/PER_PAGE)||1;
    return{sliced:data.slice((pg-1)*PER_PAGE,pg*PER_PAGE),total,pg};
  };

  /* ── FIXED: goStat also resets date/loc filters ── */
  const goStat=(tab:TabKey,userRole?:string,orderStatus?:string,payStatus?:string)=>{
    setActiveTab(tab);
    setPage(tab,1);
    if(userRole!==undefined)   setUserRoleFilter(userRole);
    if(orderStatus!==undefined){setOrderStatusFilter(orderStatus);setPage("orders",1);}
    if(payStatus!==undefined)  {setPayStatusFilter(payStatus);setPage("payments",1);}
  };

  /* ── Date Filter Bar (shared) ── */
  const DateFilterBar=()=>(
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <small className="text-muted fw-semibold" style={{fontSize:"0.72rem"}}>📅 From:</small>
      <input type="date" className="form-control form-control-sm" style={{width:130}} value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(activeTab,1);}}/>
      <small className="text-muted fw-semibold" style={{fontSize:"0.72rem"}}>To:</small>
      <input type="date" className="form-control form-control-sm" style={{width:130}} value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(activeTab,1);}}/>
      {(dateFrom||dateTo)&&<button className="btn-sm btn btn-outline-danger py-1 px-3 fs-8" style={{fontSize:"0.72rem"}} onClick={()=>{setDateFrom("");setDateTo("");setPage(activeTab,1);}}>✕ Clear</button>}
    </div>
  );
  /* ── reusable ── */
  const Pager=({tab,total,dataLen}:{tab:string;total:number;dataLen:number})=>{
    if(total<=1)return null;
    const pg=pages[tab]||1;
    return(
      <div className="d-flex align-items-center justify-content-between px-3 py-2 bg-light border-top">
        <small className="text-muted">Showing {(pg-1)*PER_PAGE+1}–{Math.min(pg*PER_PAGE,dataLen)} of {dataLen}</small>
        <nav><ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${pg===1?"disabled":""}`}><button className="page-link" onClick={()=>setPage(tab,pg-1)}>«</button></li>
          {Array.from({length:total},(_,i)=>i+1).map(n=>(
            <li key={n} className={`page-item ${pg===n?"active":""}`}><button className="page-link" onClick={()=>setPage(tab,n)}>{n}</button></li>
          ))}
          <li className={`page-item ${pg===total?"disabled":""}`}><button className="page-link" onClick={()=>setPage(tab,pg+1)}>»</button></li>
        </ul></nav>
      </div>
    );
  };
  const FilterBar=({options,active,color,onChange}:{options:string[];active:string;color:string;onChange:(v:string)=>void})=>(
    <div className="d-flex flex-wrap gap-1">
      {options.map(o=>(
        <button key={o} onClick={()=>onChange(o)}
          className={`btn btn-sm rounded-pill p-0 px-3 py-0.5 ${active===o?`btn-${color}`:"btn-outline-secondary"}`}>
          {o==="all"?"All":o}
        </button>
      ))}
    </div>
  );

  /* ── FIXED: ActionBtns always stops propagation ── */
  const ActionBtns=({col,row}:{col:string;row:any})=>(
    <td className="text-nowrap">
      <div className="d-flex gap-1">
        <button className="btn btn-outline-info btn-sm py-0 px-2"    style={{fontSize:"0.72rem"}} onClick={(e)=>{e.stopPropagation();openView(col,row);}}    title="View">👁</button>
        <button className="btn btn-outline-success btn-sm py-0 px-2" style={{fontSize:"0.72rem"}} onClick={(e)=>{e.stopPropagation();openEdit(col,row);}}    title="Edit">✏️</button>
        <button className="btn btn-outline-danger btn-sm py-0 px-2"  style={{fontSize:"0.72rem"}} onClick={(e)=>{e.stopPropagation();openDelete(col,row);}}  title="Delete">🗑</button>
        {(row.phone||row.email||row.buyer_phone)&&<button className="btn btn-outline-primary btn-sm py-0 px-2" style={{fontSize:"0.72rem"}} onClick={(e)=>{e.stopPropagation();openContact(col,row);}} title="Contact">📞</button>}
      </div>
    </td>
  );

  /* ── Quick Status Dropdown for Orders ── */
  const QuickStatusDropdown=({order}:{order:any})=>(
    <select
      className="form-select form-select-sm"
      style={{fontSize:"0.72rem",padding:"1px 4px",minWidth:100}}
      value={order.status||"pending"}
      onChange={(e)=>{e.stopPropagation();handleQuickStatusChange(order._id,e.target.value);}}>
      {["pending","confirmed","shipped","delivered","cancelled"].map(s=>(
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
  const THead=({cols}:{cols:string[]})=>(
    <thead className="table-dark"><tr>{cols.map(c=><th key={c} className="text-nowrap" style={{fontSize:"0.75rem",fontWeight:600}}>{c}</th>)}</tr></thead>
  );

  const SectionCard=({title,badge,badgeColor,filter,onViewAll,children}:{
    title:string;badge:number|string;badgeColor:string;
    filter?:React.ReactNode;onViewAll?:()=>void;children:React.ReactNode;
  })=>(
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
      <div className="card-header bg-white border-bottom py-3 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <span className="fw-bold fs-6">
          {title} <span className={`badge bg-${badgeColor} ms-1 rounded-pill`}>{badge}</span>
        </span>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {filter}
          {onViewAll&&<button className={`btn btn-sm btn-outline-${badgeColor}`} style={{fontSize:"0.72rem"}} onClick={onViewAll}>View All →</button>}
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered table-hover table-sm mb-0 align-middle">{children}</table>
      </div>
    </div>
  );
  const navItems=[
    {key:"dashboard",     icon:"📊",label:"Dashboard"},
    {key:"users",         icon:"👥",label:"Users"},
    {key:"products",      icon:"📦",label:"Products"},
    {key:"orders",        icon:"🧾",label:"Orders"},
    {key:"payments",      icon:"💳",label:"Payments"},
    {key:"farmerrates",   icon:"🌾",label:"Farmer Rates"},
    {key:"agentrates",    icon:"🏪",label:"Agent Rates"},
    {key:"reviews",       icon:"⭐",label:"Reviews"},
    {key:"cart",          icon:"🛒",label:"Cart & Wishlist"},
    {key:"communications",icon:"📣",label:"Communications"},
    {key:"notifications", icon:"🔔",label:"Notifications"},
  ];
  const statCards=[
    {label:"Total Users", val:users.length,       icon:"👥",color:"primary",  onClick:()=>goStat("users","all")},
    {label:"Farmers",     val:farmers.length,      icon:"🌾",color:"success",  onClick:()=>goStat("users","farmer")},
    {label:"Buyers",      val:buyers.length,       icon:"🛒",color:"info",     onClick:()=>goStat("users","buyer")},
    {label:"Agents",      val:agents.length,       icon:"🏪",color:"warning",  onClick:()=>goStat("users","agent")},
    {label:"D-Partners",  val:dpartners.length,    icon:"🚴",color:"secondary",onClick:()=>goStat("users","dpartner")},
    {label:"Products",    val:products.length,     icon:"📦",color:"info",     onClick:()=>goStat("products")},
    {label:"Total Orders",val:orders.length,       icon:"🧾",color:"danger",   onClick:()=>goStat("orders",undefined,"all")},
    {label:"Delivered",   val:orders.filter((o:any)=>o.status==="delivered").length,icon:"✅",color:"success",onClick:()=>goStat("orders",undefined,"delivered")},
    {label:"Pending",     val:orders.filter((o:any)=>o.status==="pending").length,  icon:"⏳",color:"warning",onClick:()=>goStat("orders",undefined,"pending")},
    {label:"Revenue",     val:money(revenue),      icon:"💰",color:"success",  onClick:()=>goStat("payments",undefined,undefined,"completed")},
    {label:"Farmer Rates",val:farmerRates.length,  icon:"📋",color:"success",  onClick:()=>goStat("farmerrates")},
    {label:"Agent Rates", val:agentRates.length,   icon:"📈",color:"warning",  onClick:()=>goStat("agentrates")},
    {label:"Reviews",     val:reviews.length,      icon:"⭐",color:"warning",  onClick:()=>goStat("reviews")},
    {label:"Payments",    val:payments.length,     icon:"💳",color:"primary",  onClick:()=>goStat("payments",undefined,undefined,"all")},
  ];

  /* ════ VIEW MODAL ════ */
  const ViewModal=()=>{
    if(modal.type!=="view"||!modal.data)return null;
    const entries=Object.entries(modal.data).filter(([k])=>!["__v","password"].includes(k));
    return(
      <div className="modal show d-block" style={{background:"rgba(0,0,0,0.6)",zIndex:1055}} onClick={closeModal}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered" onClick={e=>e.stopPropagation()}>
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="modal-header bg-info text-white border-0 py-2">
              <h6 className="fw-bold mb-0 text-white">👁 View — {CC[modal.collection]?.label}</h6>
              <button className="btn-close btn-close-warning text-warning" onClick={closeModal}></button>
            </div>
            <div className="modal-body p-0">
              <table className="table table-sm table-striped table-bordered mb-0">
                <tbody>
                  {entries.map(([k,v])=>(
                    <tr key={k} className="fs-7">
                      <td className="fw-semibold text-secondary bg-light text-capitalize px-2 w-40">{k.replace(/_/g," ")}</td>
                     <td className="fs-7 px-2 w-60">
                    {k==="role"?roleBadge(String(v||"")):
                     k==="status"?statusBadge(String(v||"")):
                     k==="image_url" && v ? (
                     <a href={String(v)} target="_blank" rel="noopener noreferrer">
                      <img  src={String(v)} alt="" className="rounded w-25 h-20 img-fluid" style={{ cursor: "pointer" }}/>
                      </a>
                     ) :
                     typeof v==="boolean" ? ( v ? <span className="badge bg-success">Yes</span> : <span className="badge bg-danger">No</span>) :
                     String(v ?? "—")}
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer border-0 bg-light gap-2">
              <button className="btn btn-success btn-sm fw-semibold" onClick={()=>{closeModal();setTimeout(()=>openEdit(modal.collection,modal.data),50);}}>✏️ Edit This</button>
              <button className="btn btn-secondary btn-sm" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ════ EDIT MODAL — FIXED ════ */
  const EditModal=()=>{
    if(modal.type!=="edit"||!modal.data)return null;
    const skip=["_id","__v","createdAt","updatedAt","password"];
    const entries=Object.entries(editForm).filter(([k])=>!skip.includes(k));
    const selectOpts:Record<string,string[]>={
      role:          ["farmer","buyer","agent","dpartner","admin"],
      status:        ["pending","confirmed","shipped","delivered","cancelled","completed","failed","refunded"],
      payment_status:["pending","completed","failed","refunded"],
      payment_method:["UPI","NetBanking","Card","COD"],
      unit:          ["kg","g","litre","ml","dozen","piece","quintal"],
      vehicle_type:  ["bike","bicycle","auto","truck","van"],
    };
    return(
      <div className="modal show d-block" style={{background:"rgba(0,0,0,0.6)",zIndex:1060}} onClick={closeModal}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered" onClick={e=>e.stopPropagation()}>
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="modal-header bg-success text-white border-0 py-3">
              <h6 className="modal-title fw-bold mb-0">✏️ Edit — {CC[modal.collection]?.label} <span className="opacity-75" style={{fontSize:"0.75rem"}}>#{shortId(modal.data._id)}</span></h6>
              <button className="btn-close btn-close-white" onClick={closeModal}></button>
            </div>
            <div className="modal-body">
              {modal.collection==="orders"&&(
                <div className="alert alert-info py-2 mb-3" style={{fontSize:"0.8rem"}}>
                  <strong>💡 Tip:</strong> Status field change karo to order update ho jayega. Admin can change any status.
                </div>
              )}
              <div className="row g-3">
                {entries.map(([k,v])=>{
                  const isBool  =typeof v==="boolean";
                  const isSelect=k in selectOpts;
                  const isNum   =["price","stock","quantity","amount","rating","total_price"].includes(k);
                  const isTextArea=["description","delivery_address","comment","review"].includes(k);
                  return(
                    <div key={k} className={isTextArea?"col-12":"col-md-6"}>
                      <label className="form-label fw-semibold text-capitalize" style={{fontSize:"0.78rem",color:"#475569"}}>
                        {k.replace(/_/g," ")}
                        {k==="status"&&<span className="badge bg-warning text-dark ms-1" style={{fontSize:"0.65rem"}}>KEY FIELD</span>}
                      </label>
                      {isBool?(
                        <select className="form-select form-select-sm" value={String(v)} onChange={e=>setEditForm((f:any)=>({...f,[k]:e.target.value==="true"}))}>
                          <option value="true">Yes</option><option value="false">No</option>
                        </select>
                      ):isSelect?(
                        <select className="form-select form-select-sm" value={String(v||"")} onChange={e=>setEditForm((f:any)=>({...f,[k]:e.target.value}))}>
                          {selectOpts[k].map(opt=><option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ):isTextArea?(
                        <textarea className="form-control form-control-sm" rows={2} value={String(v??"")} onChange={e=>setEditForm((f:any)=>({...f,[k]:e.target.value}))}></textarea>
                      ):(
                        <input className="form-control form-control-sm" type={isNum?"number":"text"} value={String(v??"")} onChange={e=>setEditForm((f:any)=>({...f,[k]:isNum?Number(e.target.value):e.target.value}))}/>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer border-0 bg-light gap-2">
              <button className="btn btn-success fw-bold px-4" onClick={handleSave} disabled={saving}>
                {saving?<><span className="spinner-border spinner-border-sm me-2"/>Saving...</>:"💾 Save Changes"}
              </button>
              <button className="btn btn-secondary px-4" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ════ DELETE MODAL ════ */
  const DeleteModal=()=>{
    if(modal.type!=="delete"||!modal.data)return null;
    const label=modal.data.name||modal.data.product_name||modal.data.farmer_name||modal.data.agent_name||modal.data.buyer_name||shortId(modal.data._id);
    return(
      <div className="modal show d-block" style={{background:"rgba(0,0,0,0.6)",zIndex:1055}} onClick={closeModal}>
        <div className="modal-dialog modal-sm modal-dialog-centered" onClick={e=>e.stopPropagation()}>
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="modal-header bg-danger text-white border-0 py-3">
              <h6 className="modal-title fw-bold mb-0">🗑️ Confirm Delete</h6>
              <button className="btn-close btn-close-white" onClick={closeModal}></button>
            </div>
            <div className="modal-body text-center py-4">
              <div style={{fontSize:"3.2rem"}}>⚠️</div>
              <p className="fw-semibold mt-2 mb-2">Are you sure?</p>
              <div className="alert alert-danger py-1 px-3 d-inline-block" style={{fontSize:"0.8rem"}}>
                <strong>{CC[modal.collection]?.label}:</strong> {label}
              </div>
              <p className="text-muted mt-2 mb-0" style={{fontSize:"0.72rem"}}>This cannot be undone.</p>
            </div>
            <div className="modal-footer border-0 justify-content-center gap-2">
              <button className="btn btn-danger fw-bold px-4" onClick={handleDelete} disabled={saving}>
                {saving?<><span className="spinner-border spinner-border-sm me-2"/>Deleting...</>:"🗑️ Yes, Delete"}
              </button>
              <button className="btn btn-secondary px-4" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ════ CONTACT MODAL ════ */
  const ContactModal=()=>{
    if(modal.type!=="contact"||!modal.data)return null;
    const u=modal.data;
    const name =u.name||u.buyer_name||u.farmer_name||"User";
    const phone=u.phone||u.buyer_phone||"";
    const email=u.email||"";
    return(
      <div className="modal show d-block" style={{background:"rgba(0,0,0,0.6)",zIndex:1055}} onClick={closeModal}>
        <div className="modal-dialog modal-dialog-centered" onClick={e=>e.stopPropagation()}>
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="modal-header text-white border-0 py-3" style={{background:"linear-gradient(135deg,#0f172a,#1e40af)"}}>
              <h6 className="modal-title fw-bold mb-0">📞 Contact — {name}</h6>
              <button className="btn-close btn-close-white" onClick={closeModal}></button>
            </div>
            <div className="modal-body p-3">
              <div className="d-flex flex-column gap-3">
                {phone&&(
                  <div className="card border-success shadow-sm">
                    <div className="card-body d-flex align-items-center gap-3 py-3">
                      <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{width:44,height:44,fontSize:"1.2rem",flexShrink:0}}>📞</div>
                      <div className="flex-grow-1">
                        <div className="fw-bold text-success">Phone Call</div>
                        <div className="text-muted" style={{fontSize:"0.82rem"}}>{phone}</div>
                      </div>
                      <a href={`tel:${phone}`} className="btn btn-success btn-sm fw-bold px-3">📞 Call</a>
                    </div>
                  </div>
                )}
                {phone&&(
                  <div className="card border-primary shadow-sm">
                    <div className="card-body py-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span style={{fontSize:"1.1rem"}}>💬</span>
                        <span className="fw-bold text-primary" style={{fontSize:"0.85rem"}}>Send SMS</span>
                        <span className="ms-auto text-muted" style={{fontSize:"0.78rem"}}>{phone}</span>
                      </div>
                      <div className="d-flex gap-2 mb-2 flex-wrap">
                        {["Order confirmed!","Delivery on the way","Payment received!"].map(t=>(
                          <button key={t} className="btn btn-outline-primary btn-sm py-0" style={{fontSize:"0.7rem"}}
                            onClick={()=>{const el=document.getElementById("quickSms") as HTMLInputElement;if(el)el.value=t;}}>
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="input-group input-group-sm">
                        <input type="text" className="form-control" placeholder="Type SMS message..." id="quickSms"/>
                        <button className="btn btn-primary fw-bold" onClick={()=>{
                          const val=(document.getElementById("quickSms") as HTMLInputElement)?.value||"";
                          window.open(`sms:${phone}?body=${encodeURIComponent(val)}`);
                        }}>Send</button>
                      </div>
                    </div>
                  </div>
                )}
                {phone&&(
                  <div className="card shadow-sm" style={{border:"1px solid #86efac"}}>
                    <div className="card-body d-flex align-items-center gap-3 py-3" style={{background:"#f0fdf4"}}>
                      <span style={{fontSize:"1.5rem"}}>💚</span>
                      <div className="flex-grow-1">
                        <div className="fw-bold" style={{color:"#16a34a",fontSize:"0.85rem"}}>WhatsApp</div>
                        <div className="text-muted" style={{fontSize:"0.78rem"}}>{phone}</div>
                      </div>
                      <a href={`https://wa.me/${phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                        className="btn btn-sm fw-bold px-3" style={{background:"#25d366",color:"white"}}>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}
                {email&&(
                  <div className="card border-warning shadow-sm">
                    <div className="card-body py-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="fs-4">📧</span>
                        <span className="fw-bold text-warning fs-5">Email</span>
                        <span className="ms-auto text-muted fs-5">{email}</span>
                      </div>
                      <input type="text" className="form-control form-control-sm mb-2" placeholder="Subject" id="qSubj" defaultValue="Regarding Your Account"/>
                      <textarea className="form-control form-control-sm mb-2" rows={2} placeholder="Message..." id="qBody"></textarea>
                      <a href={`mailto:${email}?subject=${encodeURIComponent((document.getElementById("qSubj") as HTMLInputElement)?.value||"")}&body=${encodeURIComponent((document.getElementById("qBody") as HTMLTextAreaElement)?.value||"")}`}
                        className="btn btn-warning btn-sm fw-bold w-100">📧 Open Email Client</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer border-0 bg-light">
              <button className="btn btn-secondary btn-sm" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return(
    <div className="d-flex" style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"'Segoe UI',sans-serif"}}>

      {/* ── SIDEBAR ── */}
      <aside style={{width:sidebarOpen?230:62,background:"#0f172a",display:"flex",flexDirection:"column",transition:"width .25s",overflow:"hidden",position:"sticky",top:0,height:"100vh",flexShrink:0}}>
        <div className="d-flex align-items-center gap-2 px-3 py-3 border-bottom" style={{borderColor:"#1e293b",whiteSpace:"nowrap"}}>
          <span style={{flexShrink:0}}>🛡️</span>
          {sidebarOpen&&<span className="fw-bold text-warning" style={{}}>DemoHome Admin</span>}
        </div>
        <nav className="flex-grow-1 pt-1 overflow-auto">
          {navItems.map(item=>(
            <button key={item.key}
              onClick={()=>{setActiveTab(item.key as TabKey);setUserRoleFilter("all");setOrderStatusFilter("all");setPayStatusFilter("all");setDateFrom("");setDateTo("");setProductLocFilter("");setOrderLocFilter("");setProductSearch("");setOrderSearch("");}}
              className="btn w-100 text-start d-flex align-items-center gap-2 rounded-0 border-0"
              style={{padding:"10px 18px",color:activeTab===item.key?"#fbbf24":"#94a3b8",background:activeTab===item.key?"#1e293b":"transparent",borderLeft:`3px solid ${activeTab===item.key?"#fbbf24":"transparent"}`,whiteSpace:"nowrap",fontSize:13,fontWeight:500}}>
              <span style={{flexShrink:0}}>{item.icon}</span>
              {sidebarOpen&&item.label}
            </button>
          ))}
        </nav>
        <div className="p-2">
          <button onClick={logout} className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center gap-2 fs-6">
            <span style={{flexShrink:0}}>🚪</span>{sidebarOpen&&"Logout"}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="d-flex flex-column flex-grow-1" style={{minWidth:0}}>

        {/* Topbar */}
        <header className="d-flex align-items-center justify-content-between bg-white border-bottom px-3" style={{height:54,position:"sticky",top:0,zIndex:100}}>
          <div className="d-flex align-items-center gap-2">
            <button onClick={()=>setSidebarOpen(o=>!o)} className="btn btn-light btn-sm">☰</button>
            <span className="fw-bold text-dark fs-6">📊 DemoHome — Admin Dashboard</span>
          </div>
          <div className="d-flex align-items-center gap-2">
           <span className="badge bg-warning text-dark px-3 py-2">🛡️ Admin</span>
          <button onClick={fetchAll} className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center gap-2 fs-8">🔄 Refresh</button>
          <button onClick={logout} className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center gap-2 fs-7">
            <span style={{flexShrink:0}}>🚪</span>{sidebarOpen&&"Logout"}
          </button>
        </div>
        </header>

        <main className="p-3 flex-grow-1">
          {actionMsg&&(
            <div className={`alert ${actionMsg.ok?"alert-success":"alert-danger"} alert-dismissible py-2 px-3 mb-3 fw-semibold fs-6`}>
              {actionMsg.text}
              <button className="btn-close" onClick={()=>setActionMsg(null)}></button>
            </div>
          )}
          {fetchError&&(
            <div className="alert alert-danger d-flex align-items-center justify-content-between py-2 mb-3">
              <span className="fs-5">{fetchError}</span>
              <button onClick={fetchAll} className="btn btn-danger btn-sm">🔄 Retry</button>
            </div>
          )}
          {loading?(
            <div className="text-center py-5 m-auto">
              <div className="spinner-border text-success" style={{width:44,height:44}}></div>
              <p className="text-success mt-3">Loading MongoDB collections...</p>
            </div>
          ):<>

            {/* ════════════════ DASHBOARD ════════════════ */}
            {activeTab==="dashboard"&&<>

              {/* Banner */}
              <div className="rounded-5 p-4 mb-4 text-white rounded-5" style={{background:"linear-gradient(135deg,#16a34a,#0891b2)"}}>
                <h5 className="fw-bold mb-1 text-white">👋 Welcome back, Admin Pannel!</h5>
                <p className="mb-0 opacity-75 fs-7">Full CRUD — View, Edit, Delete, Contact any record. Live from MongoDB.</p>
              </div>
              <div className="row g-3 mb-4">
              {statCards.map(c => (
               <div key={c.label} className="col-6 col-sm-4 col-md-3 col-xl-2">
                    <div onClick={c.onClick} className={`card text-bg-primary mb-2 py-2 px-3 border-${c.color}`}
                    style={{borderRadius: "14px", cursor: "pointer", transition: "all 0.25s ease" }}
                       onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                   e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.12)";}}
                     onMouseLeave={e => {
                       e.currentTarget.style.transform = "";
                       e.currentTarget.style.boxShadow = ""; }} >
                   {/* Soft color glow */}
                        <div style={{  position: "absolute", top: 5, right: 5,  width: 180, height: 120,
                        background: `radial-gradient(circle, var(--bs-${c.color}) 0%, transparent 90%)`, opacity: 0.15
                            }}/>
                      <div className="d-flex justify-contant-center fs-3">
                       <div className={`fs-4 text-${c.color}`}>  {c.icon} </div>
                       <div className={`fw-bold fs-4 float-end text-${c.color}`}> {c.val}</div>
                       </div>
                          <div className="fs-6 fw-blod fw-bolder">{c.label} </div>
                           <div className="d-flex justify-content-between align-items-center mt-3">
                            <span className={`text-${c.color} fs-7 fw-semibold`}> View details </span>
                           <span className={`fw-bold text-${c.color} fs-5`}>  → </span>
                            </div>
                              </div>
                              </div>
                              ))}
               </div>

              {/* Role Breakdown */}
              <div className="card border-0 shadow-sm rounded-4 mb-4 rounded-5">
                <div className="card-header bg-white border-bottom fw-bold py-2 fs-5">👥 User Role Breakdown</div>
                <div className="card-body">
                  <div className="row g-3">
                    {[{label:"Farmers",val:farmers.length,color:"success"},{label:"Buyers",val:buyers.length,color:"primary"},{label:"Agents",val:agents.length,color:"warning"},{label:"D-Partners",val:dpartners.length,color:"secondary"}].map(rb=>{
                      const pct=users.length>0?Math.round((rb.val/users.length)*100):0;
                      return(
                        <div key={rb.label} className="col-6 col-md-3">
                          <div className="d-flex justify-content-between mb-1">
                            <small className="fw-semibold">{rb.label}</small>
                            <small className={`fw-bold text-${rb.color}`}>{rb.val}</small>
                          </div>
                          <div className="progress">
                            <div className={`progress-bar bg-${rb.color}`} style={{width:`${pct}%`}}></div>
                          </div>
                          <small className="text-muted">{pct}% of users</small>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ─── Latest Products with filter ─── */}
              <SectionCard title="📦 Latest Products" badge={products.length} badgeColor="info"
                onViewAll={()=>goStat("products")}
                filter={<input className="form-control form-control-sm" placeholder="🔍 Search product..." style={{width:180}} value={dashProdSearch} onChange={e=>setDashProdSearch(e.target.value)}/>}>
                <THead cols={["#","Img","Product","Farmer","Category","Price","Stock","Unit","Location","Avail","Date","Actions"]}/>
                <tbody>
                  {dashProducts.map((p:any,i:number)=>(
                    <tr key={i} className="fs-7">
                      <td>{i+1}</td>
                      <td>{p.image_url?<img src={p.image_url} alt="" className="rounded" style={{width:32,height:32,objectFit:"cover"}}/>:<span>📦</span>}</td>
                      <td >{p.product_name||p.name||"—"}<div>#{shortId(p._id)}</div></td>
                      <td>{p.farmer_name||"—"}</td>
                      <td><span className="badge bg-light text-dark border">{p.category||"—"}</span></td>
                      <td className="fw-bold text-success">₹{p.price}/{p.unit}</td>
                      <td className={`fw-bold ${!p.stock?"text-danger":p.stock<10?"text-warning":"text-success"}`}>{p.stock||0}</td>
                      <td >{p.unit||"kg"}</td>
                      <td >{p.location ? p.location.slice(0, 20) : "—"}...</td>
                      <td >{p.is_available?<span className="badge bg-success">Yes</span>:<span className="badge bg-danger">No</span>}</td>
                      <td >{fmt(p.createdAt)}</td>
                      <ActionBtns col="products" row={p}/>
                    </tr>
                  ))}
                  {!dashProducts.length&&<tr><td colSpan={12} className="text-center py-3">No products found</td></tr>}
                </tbody>
              </SectionCard>

              {/* ─── Latest Orders with filter ─── */}
              <SectionCard title="🧾 Latest Orders" badge={orders.length} badgeColor="danger"
                onViewAll={()=>goStat("orders",undefined,"all")}
                filter={<FilterBar options={["all","pending","confirmed","shipped","delivered","cancelled"]} active={dashOrderStatus} color="danger" onChange={setDashOrderStatus}/>}>
                <THead cols={["#","Buyer","Phone","Seller","D-Partner","Product","Qty","Total","Address","Status","Quick Change","Payment","Date","Actions"]}/>
                <tbody>
                  {dashOrders.map((o:any,i:number)=>(
                    <tr key={i} className="fs-7">
                      <td>{i+1}</td>
                      <td>{o.buyer_name||"—"}<div className="fw-bold">{o.buyer_email ? o.buyer_email.slice(0, 10) : "—"}...</div></td>
                      <td className="fw-bold">{o.buyer_phone?<a href={`tel:${o.buyer_phone}`} className="text-decoration-none text-success fw-semibold">{o.buyer_phone}</a>:"—"}</td>
                      <td>{o.farmer_name||"—"}</td>
                      <td>{o.dpartner_name||"—"}</td>
                      <td>{o.product_name||"—"}</td>
                      <td>{o.quantity} {o.unit}</td>
                      <td className="fw-bold text-success">{money(o.total_price)}</td>
                      <td>{o.delivery_address?(o.delivery_address.length>10?o.delivery_address.slice(0,10)+"...":o.delivery_address):"—"}</td>
                      <td>{statusBadge(o.status)}</td>
                      <td><QuickStatusDropdown order={o}/></td>
                      <td>{o.payment_method&&<span className="badge bg-info text-dark">
                      {o.payment_method}</span>}</td>
                      <td>{fmt(o.createdAt)}</td>
                      <ActionBtns col="orders" row={o}/>
                    </tr>
                  ))}
                  {!dashOrders.length&&<tr><td colSpan={14} className="text-center text-muted py-3">No orders found</td></tr>}
                </tbody>
              </SectionCard>

              {/* ─── Latest Farmer Rates with filter ─── */}
              <SectionCard title="🌾 Latest Farmer Rates" badge={farmerRates.length} badgeColor="success"
                onViewAll={()=>goStat("farmerrates")}
                filter={<input className="form-control form-control-sm" placeholder="🔍 Search farmer..." style={{width:180}} value={dashFarmerSearch} onChange={e=>setDashFarmerSearch(e.target.value)}/>}>
                <THead cols={["#","Farmer","Product","Price","Unit","Stock","Category","Description","Location","Avail","Change","Date","Actions"]}/>
                <tbody>
                  {dashFarmers.map((r:any,i:number)=>(
                    <tr key={i} className="fs-7">
                      <td>{i+1}</td>
                      <td >{r.farmer_name||"—"}</td>
                      <td>{r.product_name||"—"}</td>
                      <td className="fw-bold text-success">₹{r.price}</td>
                      <td>{r.unit||"kg"}</td>
                      <td className={`!r.stock?"text-danger":""`}>{r.stock??0}</td>
                      <td>{r.category||"—"}</td>
                      <td>{r.description||"—"}</td>
                      <td> {r.location ? r.location.slice(0, 10) : "—"}..</td>
                      <td >{r.is_available?<span className="badge bg-success">Yes</span>:<span className="badge bg-danger">No</span>}</td>
                      <td className={`fw-bold ${String(r.change||"").startsWith("-")?"text-danger":"text-success"}`}>{r.change||"0%"}</td>
                      <td >{fmt(r.createdAt)}</td>
                      <ActionBtns col="farmerrates" row={r}/>
                    </tr>
                  ))}
                  {!dashFarmers.length&&<tr><td colSpan={13} className="text-center text-muted py-3">No farmer rates found</td></tr>}
                </tbody>
              </SectionCard>

              {/* ─── Latest Users with role filter ─── */}
              <SectionCard title="👥 Latest Users" badge={users.length} badgeColor="primary"
                onViewAll={()=>goStat("users","all")}
                filter={<FilterBar options={["all","farmer","buyer","agent","dpartner"]} active={dashUserRole} color="primary" onChange={setDashUserRole}/>}>
                <THead cols={["#","Name","Email","Phone","Role","Location","Vehicle","Joined","Actions"]}/>
                <tbody>
                  {dashUsers.map((u:any,i:number)=>(
                    <tr key={i} className="fs-7">
                      <td>{i+1}</td>
                      <td>{u.name||"—"}</td>
                      <td>{u.email||"—"}</td>
                      <td className="fw-bold">{u.phone?<a href={`tel:${u.phone}`} className="text-decoration-none text-success fw-semibold">{u.phone}</a>:"—"}</td>
                      <td>{roleBadge(u.role)}</td>
                      <td> {u.location ? u.location.slice(0, 10) : "—"}..</td>
                      <td className="fw-bold">{u.vehicle_type||"—"}</td>
                      <td >{fmt(u.createdAt)}</td>
                      <ActionBtns col="users" row={u}/>
                    </tr>
                  ))}
                  {!dashUsers.length&&<tr><td colSpan={9} className="text-center text-muted py-3">No users found</td></tr>}
                </tbody>
              </SectionCard>
            </>}

            {/* ════════════════ USERS ════════════════ */}
            {activeTab==="users"&&(()=>{
              const{sliced,total,pg}=paginate(filteredUsers,"users");
              return(
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                  <div className="card-header bg-white border-bottom py-3 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <span className="fw-bold fs-5">👥 Users <span className="badge bg-primary rounded-pill ms-1">{filteredUsers.length}</span></span>
                    <FilterBar options={["all","farmer","buyer","agent","dpartner"]} active={userRoleFilter} color="primary" onChange={v=>{setUserRoleFilter(v);setPage("users",1);}}/>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover table-sm mb-0 align-middle">
                      <THead cols={["#","Name","Email","Phone","Role","Location","Vehicle","Aadhaar","Joined","Actions"]}/>
                      <tbody>
                        {sliced.map((u:any,i:number)=>(
                          <tr key={i} className="fs-7">
                            <td >{(pg-1)*PER_PAGE+i+1}</td>
                            <td >{u.name||"—"}</td>
                            <td >{u.email||"—"}</td>
                            <td className="fw-bold">{u.phone?<a href={`tel:${u.phone}`} className="text-decoration-none text-success">{u.phone}</a>:"—"}</td>
                            <td>{roleBadge(u.role)}</td>
                            <td >{u.location ? u.location.slice(0, 20) : "—"}...</td>
                            <td >{u.vehicle_type||"—"}</td>
                            <td >{u.aadhaar||"—"}</td>
                            <td>{fmt(u.createdAt)}</td>
                            <ActionBtns col="users" row={u}/>
                          </tr>
                        ))}
                        {!sliced.length&&<tr><td colSpan={10} className="text-center text-muted py-4">No users found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <Pager tab="users" total={total} dataLen={filteredUsers.length}/>
                </div>
              );
            })()}

            {/* ════════════════ PRODUCTS ════════════════ */}
            {activeTab==="products"&&(()=>{
              const{sliced,total,pg}=paginate(filteredProducts,"products");
              return(
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                  <div className="card-header bg-white border-bottom py-3 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <span className="fw-bold fs-5">📦 Products <span className="badge bg-info rounded-pill ms-1">{filteredProducts.length}</span>
                      {(dateFrom||dateTo||productLocFilter||productSearch)&&<span className="badge bg-warning text-dark ms-1fs-6">Filtered</span>}
                    </span>
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                      <input className="form-control form-control-sm" placeholder="🔍 Product name..." style={{width:140}} value={productSearch} onChange={e=>{setProductSearch(e.target.value);setPage("products",1);}}/>
                      <input className="form-control form-control-sm" placeholder="📍 Location..." style={{width:130}} value={productLocFilter} onChange={e=>{setProductLocFilter(e.target.value);setPage("products",1);}}/>
                      <DateFilterBar/>
                      {(productSearch||productLocFilter||dateFrom||dateTo)&&
                        <button className="btn-sm btn btn-outline-danger py-1 px-3 fs-8" 
                        onClick={()=>{setProductSearch("");setProductLocFilter("");setDateFrom("");setDateTo("");setPage("products",1);}}>✕ Reset</button>}
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover table-sm mb-0 align-middle">
                      <THead cols={["#","Img","Product","Farmer","Category","Price","Stock","Unit","Location","Avail","Added","Actions"]}/>
                      <tbody>
                        {sliced.map((p:any,i:number)=>(
                          <tr key={i} className="fs-7">
                            <td >{(pg-1)*PER_PAGE+i+1}</td>
                            <td>{p.image_url?<img src={p.image_url} alt="" className="rounded" style={{width:32,height:32,objectFit:"cover"}}/>:<span>📦</span>}</td>
                            <td >{p.product_name||p.name||"—"}<div>#{shortId(p._id)}</div></td>
                            <td >{p.farmer_name||"—"}</td>
                            <td ><span className="badge bg-light text-dark border">{p.category||"—"}</span></td>
                            <td className="fw-bold text-success">₹{p.price}</td>
                            <td className={`fw-bold ${!p.stock?"text-danger":p.stock<10?"text-warning":"text-success"}`} >{p.stock||0}</td>
                            <td >{p.unit||"kg"}</td>
                            <td >{p.location ? p.location.slice(0, 20) : "—"}...</td>
                            <td>{p.is_available?<span className="badge bg-success">Yes</span>:<span className="badge bg-danger">No</span>}</td>
                            <td >{fmt(p.createdAt)}</td>
                            <ActionBtns col="products" row={p}/>
                          </tr>
                        ))}
                        {!sliced.length&&<tr><td colSpan={12} className="text-center text-muted py-4">No products found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <Pager tab="products" total={total} dataLen={filteredProducts.length}/>
                </div>
              );
            })()}

            {/* ════════════════ ORDERS ════════════════ */}
            {activeTab==="orders"&&(()=>{
              const{sliced,total,pg}=paginate(filteredOrders,"orders");
              return(
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                 <div className="card-header bg-white border-bottom py-3 px-3 d-flex flex-column gap-2">
               <div className="d-flex justify-content-between align-items-center flex-wrap">
                <div className="d-flex align-items-center gap-2 flex-wrap border-buttom">
                    <span className="fw-bold fs-5">🧾 Orders
                      <span className="badge bg-danger rounded-pill ms-1"> {filteredOrders.length} </span></span>
                     {(dateFrom || dateTo || orderLocFilter || orderSearch || orderStatusFilter !== "all") && (
                     <span className="badge bg-warning text-dark fs-6"> Filtered </span>
                      )}
                    </div>
                  <DateFilterBar />
                </div>

                <div className="border-top pt-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                 <FilterBar options={["all","pending","confirmed","shipped","delivered","cancelled"]} active={orderStatusFilter}
                  color="danger" onChange={v => { setOrderStatusFilter(v); setPage("orders", 1);}} />
                   <div className="d-flex align-items-center gap-2">

                    <input className="form-control form-control-sm"  placeholder="🔍 Buyer / Product..." value={orderSearch}
                     onChange={e => { setOrderSearch(e.target.value); setPage("orders", 1); }}/>
                    <input className="form-control form-control-sm" placeholder="📍 Address / City..." value={orderLocFilter}
                     onChange={e => { setOrderLocFilter(e.target.value); setPage("orders", 1); }}/>
                     {(orderSearch || orderLocFilter || dateFrom || dateTo) && (
                        <button className="btn-sm btn btn-outline-danger py-0 px-3 fs-8"
                         onClick={() => { setOrderSearch(""); setOrderLocFilter("");
                          setDateFrom(""); setDateTo(""); setPage("orders", 1); }}> ✕ Reset
                       </button> )}

                        </div>
                       </div>
                    </div>
                  {/* ── Info banner for quick status ── */}
                  <div className="px-3 py-2 bg-light border-bottom" style={{fontSize:"0.75rem",color:"#374151"}}>
                    💡 <strong>Quick Change:</strong> "Status Change" dropdown se directly order status update karo bina modal khole.
                  </div>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover table-sm mb-0 align-middle">
                      <THead cols={["#","Buyer","Phone","Seller","D-Partner","Product","Qty","Total","Address","Status","Status Change","Payment","Date","Actions"]}/>
                      <tbody>
                        {sliced.map((o:any,i:number)=>(
                          <tr key={i} className="fs-7">
                            <td >{(pg-1)*PER_PAGE+i+1}</td>
                            <td >{o.buyer_name||"—"}</td>
                            <td >{o.buyer_phone?<a href={`tel:${o.buyer_phone}`} className="text-decoration-none text-success">{o.buyer_phone}</a>:"—"}</td>
                            <td >{o.farmer_name||"—"}</td>
                            <td >{o.dpartner_name||"—"}</td>
                            <td >{o.product_name||"—"}</td>
                            <td >{o.quantity} {o.unit}</td>
                            <td className="fw-bold text-success">{money(o.total_price)}</td>
                            <td > {o.delivery_address?(o.delivery_address.length>10?o.delivery_address.slice(0,10)+"...":o.delivery_address):"—"}</td>
                            <td >{statusBadge(o.status)}</td>
                            <td ><QuickStatusDropdown order={o}/></td>
                            <td >{o.payment_method&&<span className="badge bg-info text-dark">{o.payment_method}</span>}</td>
                            <td >{fmt(o.createdAt)}</td>
                            <ActionBtns col="orders" row={o}/>
                          </tr>
                        ))}
                        {!sliced.length&&<tr><td colSpan={14} className="text-center text-muted py-4">No orders found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <Pager tab="orders" total={total} dataLen={filteredOrders.length}/>
                </div>
              );
            })()}

            {/* ════════════════ PAYMENTS ════════════════ */}
            {activeTab==="payments"&&(()=>{
              const{sliced,total,pg}=paginate(filteredPayments,"payments");
              return(
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-white border-bottom py-3 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2">

              {/* LEFT SIDE */}
                  <div className="d-flex align-items-center flex-wrap gap-2">
                   <span className="fw-bold fs-6">💳 Payments     
                   <span className="badge rounded-pill bg-warning text-white">
                    {filteredPayments.length}
                     </span></span>
                      <FilterBar options={["all","pending","confirmed","failed","refunded"]} active={payStatusFilter}
                       className="fs-4"  color="primary" onChange={v => { setPayStatusFilter(v);  setPage("payments", 1); }}/>
                     </div>
                   <DateFilterBar />
                    </div>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover table-sm mb-0 align-middle">
                      <THead cols={["#","Order ID","Buyer ID","Seller ID","Amount","Method","UPI ID","Txn ID","Status","Date","Actions"]}/>
                      <tbody>
                        {sliced.map((p:any,i:number)=>(
                          <tr key={i} className="fs-7">
                            <td>{(pg-1)*PER_PAGE+i+1}</td>
                            <td>{shortId(p.order_id)}</td>
                            <td>{shortId(p.buyer_id)}</td>
                            <td>{shortId(p.seller_id)}</td>
                            <td className="fw-bold text-success">{money(p.amount)}</td>
                            <td><span className="badge bg-info text-dark">{p.payment_method||"—"}</span></td>
                            <td>{p.upi_id||"—"}</td>
                            <td>{p.transaction_id||"—"}</td>
                            <td>{statusBadge(p.status)}</td>
                            <td>{fmt(p.createdAt)}</td>
                            <ActionBtns col="payments" row={p}/>
                          </tr>
                        ))}
                        {!sliced.length&&<tr><td colSpan={11} className="text-center text-muted py-4">No payments found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <Pager tab="payments" total={total} dataLen={filteredPayments.length}/>
                </div>
              );
            })()}

            {/* ════════════════ FARMER RATES ════════════════ */}
            {activeTab==="farmerrates"&&(()=>{
             const filteredFarmerRates=farmerRates.filter((r:any)=>inDateRange(r.createdAt));
              const{sliced,total,pg}=paginate(filteredFarmerRates,"farmerrates");
              
              return(
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                  <div className="card-header bg-white border-bottom py-3 px-3">
                   <div className="d-flex justify-content-between align-items-center flex-wrap">
                 <span className="fw-bold fs-6"> 🌾 Farmer Rates
                <span className="badge rounded-pill ms-1 bg-success text-white">
                 {farmerRates.length}
               </span>
               </span>
               <DateFilterBar />
                </div>
                
                  </div>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover table-sm mb-0 align-middle">
                      <THead cols={["#","Farmer","Product","Price","Unit","Stock","Category","Description","Location","Avail","Change","Date","Actions"]}/>
                      <tbody>
                        {sliced.map((r:any,i:number)=>(
                          <tr key={i} className="fs-7">
                            <td>{(pg-1)*PER_PAGE+i+1}</td>
                            <td>{r.farmer_name||"—"}</td>
                            <td>{r.product_name||"—"}</td>
                            <td className="fw-bold text-success">₹{r.price}</td>
                            <td>{r.unit||"kg"}</td>
                            <td className={!r.stock?"text-danger":""}>{r.stock??0}</td>
                            <td>{r.category||"—"}</td>
                            <td >{r.description ? r.description.slice(0, 20) : "—"}...</td>
                            <td>{r.location ? r.location.slice(0, 20) : "—"}...</td>
                            <td>{r.is_available?<span className="badge bg-success">Yes</span>:<span className="badge bg-danger">No</span>}</td>
                            <td className={`fw-bold ${String(r.change||"").startsWith("-")?"text-danger":"text-success"}`}>{r.change||"0%"}</td>
                            <td>{fmt(r.createdAt)}</td>
                            <ActionBtns col="farmerrates" row={r}/>
                          </tr>
                        ))}
                        {!sliced.length&&<tr><td colSpan={13} className="text-center text-muted py-4">No farmer rates found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <Pager tab="farmerrates" total={total} dataLen={farmerRates.length}/>
                </div>
              );
            })()}

            {/* ════════════════ AGENT RATES ════════════════ */}
            {activeTab==="agentrates"&&(()=>{
              const filteredAgentRates=agentRates.filter((r:any)=>inDateRange(r.createdAt));
              const{sliced,total,pg}=paginate(filteredAgentRates,"agentrates");
             return(
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
               <div className="card-header bg-white border-bottom py-3 px-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                 <span className="fw-bold fs-6"> 🏪 Agent Rates 
                <span className="badge rounded-pill ms-1" style={{ background: "#b45309", color: "white" }}>
                 {filteredAgentRates.length}
               </span>
               </span>
               <DateFilterBar />
                 </div>
                 </div>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover table-sm mb-0 align-middle">
                      <THead cols={["#","Agent","Product","Price","Unit","Stock","Category","Description","Location","Avail","Change","Date","Actions"]}/>
                      <tbody>
                        {sliced.map((r:any,i:number)=>(
                          <tr key={i} className="fs-7">
                            <td>{(pg-1)*PER_PAGE+i+1}</td>
                            <td className="fw-semibold">{r.agent_name||"—"}</td>
                            <td>{r.product_name||"—"}</td>
                            <td className="fw-bold text-success">₹{r.price}</td>
                            <td>{r.unit||"kg"}</td>
                            <td className={!r.stock?"text-danger":""}>{r.stock??0}</td>
                            <td>{r.category||"—"}</td>
                            <td >{r.description ? r.description.slice(0, 20) : "—"}...</td>
                            <td >{r.location ? r.location.slice(0, 20) : "—"}...</td>
                            <td>{r.is_available?<span className="badge bg-success" >Yes</span>:<span className="badge bg-danger" >No</span>}</td>
                            <td className={`fw-bold ${String(r.change||"").startsWith("-")?"text-danger":"text-success"}`}>{r.change||"0%"}</td>
                            <td >{fmt(r.createdAt)}</td>
                            <ActionBtns col="agentrates" row={r}/>
                          </tr>
                        ))}
                        {!sliced.length&&<tr><td colSpan={13} className="text-center text-muted py-4">No agent rates found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <Pager tab="agentrates" total={total} dataLen={agentRates.length}/>
                </div>
              );
            })()}

            {/* ════════════════ REVIEWS ════════════════ */}
            {activeTab==="reviews"&&(()=>{
                 const filteredReviews=reviews.filter((r:any)=>inDateRange(r.createdAt));
                   const{sliced,total,pg}=paginate(filteredReviews,"reviews");
                 return(
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                  <div className="card-header bg-white border-bottom py-3 px-3">
                 
                    <div className="d-flex justify-content-between align-items-center flex-wrap">
                 <span className="fw-bold fs-6"> ⭐ Reviews 
                <span className="badge rounded-pill ms-1 bg-info text-dark">
                 {filteredReviews.length}
               </span>
               </span>
               <DateFilterBar />
                 </div>
                     </div>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover table-sm mb-0 align-middle">
                      <THead cols={["#","Buyer","Product ID","Rating","Comment / Review","Date","Actions"]}/>
                      <tbody>
                        {sliced.map((r:any,i:number)=>(
                          <tr key={i} className="fs-7">
                            <td>{(pg-1)*PER_PAGE+i+1}</td>
                            <td className="fw-semibold">{r.buyer_name||r.user_id?.name||"—"}</td>
                            <td>{shortId(r.product_id)}</td>
                            <td className="fs-5">
                              <span style={{color:"#f59e0b",}}>{"★".repeat(r.rating||0)}</span>
                              <span style={{color:"#d1d5db",}}>{"★".repeat(5-(r.rating||0))}</span>
                              <small className="fs-7">{r.rating}/5</small>
                            </td>
                            <td> {(() => { const text = r.comment || r.review; if (!text) return "—";
                             return text.length > 20 ? text.slice(0, 20) + "..." : text; })()}</td>
                            <td >{fmt(r.createdAt)}</td>
                            <ActionBtns col="reviews" row={r}/>
                          </tr>
                        ))}
                        {!sliced.length&&<tr><td colSpan={7} className="text-center py-4">No reviews found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <Pager tab="reviews" total={total} dataLen={reviews.length}/>
                </div>
              );
            })()}

            {/* ════════════════ CART & WISHLIST ════════════════ */}
            {activeTab==="cart"&&(
              <div>
                <div className="alert alert-warning mb-4" style={{fontSize:13}}>
                  <strong>ℹ️ Note:</strong> Cart & Wishlist need per-user tokens. Add <code>GET /admin/cart</code> & <code>GET /admin/wishlist</code> to backend.
                </div>
                <div className="row g-3 mb-4">
                  {[{title:"🛒 Cart",color:"primary",rows:[["Documents","5"],["Fields","user_id, product_id, quantity"],["Auth","verifyToken"],["Add","POST /cart"],["Update","PUT /cart/:id"],["Remove","DELETE /cart/:id"],["Clear","DELETE /cart"]]},
                    {title:"❤️ Wishlist",color:"danger",rows:[["Documents","1"],["Fields","user_id, product_id"],["Auth","verifyToken"],["Toggle","POST /wishlist"],["Get","GET /wishlist"],["Remove","DELETE /wishlist/:id"],["Response","added/removed"]]}
                  ].map(s=>(
                    <div key={s.title} className="col-md-6">
                      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className={`card-header bg-${s.color} bg-opacity-10 border-bottom py-2 px-3 fw-bold`} style={{fontSize:13}}>{s.title}</div>
                        <table className="table table-sm table-bordered mb-0">
                          <tbody>
                            {s.rows.map(([k,v])=>(
                              <tr key={k}>
                                <td className="fw-semibold text-secondary bg-light px-2 w-40" style={{width:"40%",fontSize:"0.8rem"}}>{k}</td>
                                <td className="px-2" style={{fontSize:"0.8rem"}}>{k==="Auth"?<span className="badge bg-danger">{v}</span>:v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-white border-bottom py-2 px-3 fw-bold" style={{fontSize:13}}>📊 Collection Summary</div>
                  <div className="card-body">
                    <div className="row g-2">
                    {[
                      {col:"user",docs:users.length,icon:"👥",color:"primary"},
                      {col:"products",docs:products.length,icon:"📦",color:"info"},
                      {col:"order",docs:orders.length,icon:"🧾",color:"danger"},
                      {col:"payment",docs:payments.length,icon:"💳",color:"success"},
                      {col:"farmerrates",docs:farmerRates.length,icon:"🌾",color:"success"},
                      {col:"agentrates",docs:agentRates.length,icon:"🏪",color:"warning"},
                      {col:"review",docs:reviews.length,icon:"⭐",color:"warning"},
                      {col:"cart",docs:"~",icon:"🛒",color:"primary"},
                      {col:"wishlist",docs:"~",icon:"❤️",color:"danger"}
                       ].map(c => (
                      <div key={c.col} className="col-6 col-sm-4 col-md-3 col-xl-2">
                        <div className={`card position-relative border-${c.color}`} 
                        style={{ borderRadius: "14px", cursor: "pointer", padding: "12px", transition: "all 0.25s ease", background: "#fff" }} 
                        onMouseEnter={e => {e.currentTarget.style.transform = "translateY(-5px)";e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.12)"; }}
                        onMouseLeave={e => {e.currentTarget.style.transform = "";e.currentTarget.style.boxShadow = ""; }}>
                         <div style={{  position: "absolute",  top: 0,  right: 0,  width: 140,  height: 100,  background: `radial-gradient(circle, var(--bs-${c.color}) 0%, transparent 70%)`,  opacity: 0.12}}/>
                         
                          {/* Top Row */}
                          <div className="d-flex justify-content-between align-items-center">
                            <div className={`fs-4 text-${c.color}`}>{c.icon}</div>
                            <div className={`fw-bold text-${c.color} fs-5`}>{c.docs}</div>
                          </div>
                          <div className="fw-semibold mt-2 fs-7"> {c.col}</div>
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <span className={`fs-6 text-${c.color}`}>View details </span>
                            <span className={`text-${c.color} fw-bold`}>→</span>
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════ COMMUNICATIONS ════════════════ */}
            {activeTab==="communications"&&(
              <div>
                <div className="rounded-4 p-4 mb-4 text-white" style={{background:"linear-gradient(135deg,#1e40af,#0f172a)"}}>
                  <h5 className="fw-bold mb-1 text-white">📣 Communications Center</h5>
                  <p className="mb-0 opacity-75 fs-7">Send SMS, Email, or WhatsApp to users directly from admin panel.</p>
                </div>
                <div className="d-flex gap-2 mb-4 flex-wrap">
                  {(["sms","email","call"] as const).map(t=>(
                    <button key={t} onClick={()=>setCommTab(t)} className={`btn fw-bold px-4 ${commTab===t?"btn-dark":"btn-outline-secondary"}`}>
                      {t==="sms"?"💬 SMS":t==="email"?"📧 Email":"📞 Call List"}
                    </button>
                  ))}
                </div>

                {commTab==="sms"&&(
                  <div className="row g-3">
                    <div className="col-md-8">
                      <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-white border-bottom py-2 px-3 fw-bold">💬 Bulk SMS</div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label fw-semibold" style={{fontSize:"0.82rem"}}>Target Users</label>
                            <select className="form-select form-select-sm" onChange={e=>setNotifTarget(e.target.value)}>
                              <option value="all">All Users ({users.length})</option>
                              <option value="farmer">Farmers ({farmers.length})</option>
                              <option value="buyer">Buyers ({buyers.length})</option>
                              <option value="agent">Agents ({agents.length})</option>
                              <option value="dpartner">D-Partners ({dpartners.length})</option>
                            </select>
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-semibold" style={{fontSize:"0.82rem"}}>SMS Message</label>
                            <textarea className="form-control" rows={4} placeholder="Type SMS message..." value={smsText} onChange={e=>setSmsText(e.target.value)} maxLength={160}></textarea>
                            <small className="text-muted">{smsText.length}/160</small>
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-semibold" style={{fontSize:"0.82rem"}}>Quick Templates</label>
                            <div className="d-flex gap-2 flex-wrap">
                              {["Order confirm ho gaya!","Delivery aaj ho jaegi","Naye products available!","Payment received!"].map(t=>(
                                <button key={t} className="btn btn-outline-primary btn-sm" style={{fontSize:"0.72rem"}} onClick={()=>setSmsText(t)}>{t}</button>
                              ))}
                            </div>
                          </div>
                          <button className="btn btn-primary fw-bold w-100" onClick={()=>{if(!smsText.trim())return flash("❌ SMS text khali hai!",false);flash(`✅ SMS sent to ${notifTarget} users!`,true);setSmsText("");}}>
                            📤 Send SMS to {notifTarget==="all"?`All ${users.length}`:notifTarget} users
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white border-bottom py-2 px-3 fw-bold">📊 User Stats</div>
                        <div className="card-body">
                          {[{label:"Total Users",val:users.length,color:"primary"},{label:"Farmers",val:farmers.length,color:"success"},{label:"Buyers",val:buyers.length,color:"info"},{label:"Agents",val:agents.length,color:"warning"},{label:"D-Partners",val:dpartners.length,color:"secondary"}].map(s=>(
                            <div key={s.label} className="d-flex justify-content-between align-items-center mb-2 py-2 border-bottom">
                              <span style={{fontSize:"0.82rem"}}>{s.label}</span>
                              <span className={`badge bg-${s.color} rounded-pill`}>{s.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {commTab==="email"&&(
                  <div className="row g-3">
                    <div className="col-md-8">
                      <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-white border-bottom py-2 px-3 fw-bold">📧 Bulk Email</div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label fw-semibold" style={{fontSize:"0.82rem"}}>Target</label>
                            <select className="form-select form-select-sm" onChange={e=>setNotifTarget(e.target.value)}>
                              <option value="all">All Users</option><option value="farmer">Farmers</option><option value="buyer">Buyers</option><option value="agent">Agents</option>
                            </select>
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-semibold" style={{fontSize:"0.82rem"}}>Subject</label>
                            <input className="form-control form-control-sm" placeholder="Email subject..." value={emailSubject} onChange={e=>setEmailSubject(e.target.value)}/>
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-semibold" style={{fontSize:"0.82rem"}}>Body</label>
                            <textarea className="form-control" rows={5} placeholder="Compose email..." value={emailBody} onChange={e=>setEmailBody(e.target.value)}></textarea>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex gap-2 flex-wrap">
                              {[{subj:"Order Confirmed",body:"Dear User,\n\nYour order is confirmed!\n\nDemoHome Team"},{subj:"New Products",body:"Dear User,\n\nNew products available. Check them out!\n\nDemoHome"},{subj:"Payment Done",body:"Dear User,\n\nPayment received successfully.\n\nDemoHome"}].map(t=>(
                                <button key={t.subj} className="btn btn-outline-warning btn-sm" style={{fontSize:"0.72rem"}} onClick={()=>{setEmailSubject(t.subj);setEmailBody(t.body);}}>{t.subj}</button>
                              ))}
                            </div>
                          </div>
                          <button className="btn btn-warning fw-bold w-100" onClick={()=>{if(!emailSubject.trim()||!emailBody.trim())return flash("❌ Subject ya body khali hai!",false);flash(`✅ Email sent to ${notifTarget} users!`,true);setEmailSubject("");setEmailBody("");}}>
                            📧 Send Email Campaign
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-white border-bottom py-2 px-3 fw-bold">📋 Preview</div>
                        <div className="card-body bg-light rounded-bottom-4">
                          <div className="bg-white rounded-3 p-3 shadow-sm" style={{fontSize:"0.78rem"}}>
                            <div className="text-muted mb-1">From: <strong>admin@demohome.in</strong></div>
                            <div className="text-muted mb-2">Subject: <strong>{emailSubject||"—"}</strong></div>
                            <hr className="my-1"/>
                            <div style={{whiteSpace:"pre-wrap",color:"#374151",minHeight:60}}>{emailBody||"No content yet..."}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {commTab==="call"&&(
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-bottom py-2 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <span className="fw-bold">📞 Call List <span className="badge bg-success rounded-pill ms-1">{users.filter((u:any)=>u.phone).length} with phone</span></span>
                      <select className="form-select form-select-sm" style={{width:"auto"}} onChange={e=>setUserRoleFilter(e.target.value)}>
                        <option value="all">All Roles</option><option value="farmer">Farmers</option><option value="buyer">Buyers</option><option value="agent">Agents</option><option value="dpartner">D-Partners</option>
                      </select>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover table-sm mb-0 align-middle">
                        <THead cols={["#","Name","Role","Phone","Email","Location","Quick Actions"]}/>
                        <tbody>
                          {(userRoleFilter==="all"?users:users.filter((u:any)=>u.role===userRoleFilter)).filter((u:any)=>u.phone||u.email).slice(0,20).map((u:any,i:number)=>(
                            <tr key={i}>
                              <td style={{fontSize:12}} className="text-muted">{i+1}</td>
                              <td className="fw-semibold" style={{fontSize:12}}>{u.name||"—"}</td>
                              <td>{roleBadge(u.role)}</td>
                              <td style={{fontSize:12}}>{u.phone?<a href={`tel:${u.phone}`} className="fw-bold text-success text-decoration-none">{u.phone}</a>:"—"}</td>
                              <td style={{fontSize:11}}>{u.email?<a href={`mailto:${u.email}`} className="text-primary text-decoration-none">{u.email}</a>:"—"}</td>
                              <td className="text-muted" style={{fontSize:12}}>{u.location||"—"}</td>
                              <td>
                                <div className="d-flex gap-1">
                                  {u.phone&&<><a href={`tel:${u.phone}`} className="btn btn-success btn-sm py-0 px-2" style={{fontSize:"0.72rem"}}>📞</a>
                                    <a href={`sms:${u.phone}`} className="btn btn-primary btn-sm py-0 px-2" style={{fontSize:"0.72rem"}}>💬</a>
                                    <a href={`https://wa.me/${u.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="btn btn-sm py-0 px-2" style={{background:"#25d366",color:"white",fontSize:"0.72rem"}}>💚</a></>}
                                  {u.email&&<a href={`mailto:${u.email}`} className="btn btn-warning btn-sm py-0 px-2" style={{fontSize:"0.72rem"}}>📧</a>}
                                  <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{fontSize:"0.72rem"}} onClick={()=>openContact("users",u)}>More</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {!users.filter((u:any)=>u.phone||u.email).length&&<tr><td colSpan={7} className="text-center text-muted py-4">No users with contact info</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ NOTIFICATIONS ════════════════ */}
            {activeTab==="notifications"&&(
              <div>
                <div className="rounded-4 p-4 mb-4 text-white" style={{background:"linear-gradient(135deg,#d97706,#dc2626)"}}>
                  <h5 className="fw-bold mb-1">🔔 Push Notifications</h5>
                  <p className="mb-0 opacity-75" style={{fontSize:13}}>Send push notifications via Firebase or your notification service.</p>
                </div>
                <div className="row g-3">
                  <div className="col-md-7">
                    <div className="card border-0 shadow-sm rounded-4">
                      <div className="card-header bg-white border-bottom py-2 px-3 fw-bold">🔔 Send Notification</div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label fw-semibold" style={{fontSize:"0.82rem"}}>Target Audience</label>
                          <div className="d-flex flex-wrap gap-2">
                            {["all","farmer","buyer","agent","dpartner"].map(t=>(
                              <button key={t} onClick={()=>setNotifTarget(t)}
                                className={`btn btn-sm rounded-pill fw-bold ${notifTarget===t?"btn-dark":"btn-outline-secondary"}`}
                                style={{fontSize:"0.75rem"}}>
                                {t==="all"?`All (${users.length})`:t==="farmer"?`🌾 Farmers (${farmers.length})`:t==="buyer"?`🛒 Buyers (${buyers.length})`:t==="agent"?`🏪 Agents (${agents.length})`:`🚴 D-Partners (${dpartners.length})`}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold" style={{fontSize:"0.82rem"}}>Title</label>
                          <input className="form-control form-control-sm" placeholder="Notification title..." value={notifTitle} onChange={e=>setNotifTitle(e.target.value)}/>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold" style={{fontSize:"0.82rem"}}>Message</label>
                          <textarea className="form-control" rows={3} placeholder="Notification message..." value={notifBody} onChange={e=>setNotifBody(e.target.value)}></textarea>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold" style={{fontSize:"0.82rem"}}>Quick Templates</label>
                          <div className="d-flex gap-2 flex-wrap">
                            {[{title:"New Products!",body:"Fresh products just arrived!"},{title:"Order Update",body:"Your order status updated."},{title:"Special Offer",body:"Limited time discount!"},{title:"Payment Done",body:"Payment processed!"}].map(n=>(
                              <button key={n.title} className="btn btn-outline-danger btn-sm" style={{fontSize:"0.72rem"}} onClick={()=>{setNotifTitle(n.title);setNotifBody(n.body);}}>{n.title}</button>
                            ))}
                          </div>
                        </div>
                        <button className="btn btn-danger fw-bold w-100" onClick={()=>{if(!notifTitle.trim())return flash("❌ Title khali hai!",false);flash(`✅ Notification sent to ${notifTarget} users!`,true);setNotifTitle("");setNotifBody("");}}>
                          🔔 Send to {notifTarget==="all"?`All ${users.length}`:notifTarget} users
                        </button>
                        <small className="text-muted d-block mt-2">⚠️ Integrate Firebase FCM: <code>POST /admin/send-notification</code></small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="card border-0 shadow-sm rounded-4 mb-3">
                      <div className="card-header bg-white border-bottom py-2 px-3 fw-bold">📱 Phone Preview</div>
                      <div className="card-body d-flex justify-content-center py-4">
                        <div style={{width:240,background:"#0f172a",borderRadius:28,padding:"12px 10px",boxShadow:"0 12px 40px rgba(0,0,0,.3)"}}>
                          <div style={{background:"#1e293b",borderRadius:20,padding:"10px 12px",minHeight:130}}>
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#16a34a,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem"}}>🛡️</div>
                              <div>
                                <div style={{color:"white",fontSize:"0.75rem",fontWeight:700}}>DemoHome Admin</div>
                                <div style={{color:"#94a3b8",fontSize:"0.62rem"}}>now</div>
                              </div>
                            </div>
                            <div style={{color:"white",fontSize:"0.82rem",fontWeight:700,marginBottom:4}}>{notifTitle||"Notification Title"}</div>
                            <div style={{color:"#94a3b8",fontSize:"0.72rem"}}>{notifBody||"Your message will appear here..."}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card border-0 shadow-sm rounded-4">
                      <div className="card-header bg-white border-bottom py-2 px-3 fw-bold">🔧 Integration Steps</div>
                      <div className="card-body">
                        {[{s:"1",t:"Add Firebase Admin SDK to backend"},{s:"2",t:"Store FCM tokens in user schema"},{s:"3",t:"Create POST /admin/send-notification"},{s:"4",t:"Connect this UI to that endpoint"}].map(x=>(
                          <div key={x.s} className="d-flex gap-2 align-items-start mb-2">
                            <span className="badge bg-danger rounded-circle fw-bold" style={{minWidth:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem"}}>{x.s}</span>
                            <span style={{fontSize:"0.78rem",color:"#374151"}}>{x.t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </>}
        </main>
      </div>

      {/* ════ MODALS ════ */}
      <ViewModal/>
      <EditModal/>
      <DeleteModal/>
      <ContactModal/>
    </div>
  );
}