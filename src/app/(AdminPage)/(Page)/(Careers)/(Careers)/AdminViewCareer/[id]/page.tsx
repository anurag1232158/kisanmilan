"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import PageFooter from "../../../../Sidebar/Footer/page";
import Sidebars from "../../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../../AOS/AOS";
import { useParams } from "next/navigation";

type AC = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  salary: string;
  status: string;
  department: string;
  description1: string;
  description2: string;
  description3: string;
  requirements1: string;
  requirements2: string;
  requirements3: string;
  requirements4: string;
  createdAt: string;
  updatedAt: string;
  rating: string;
  details: string;
  pic: string;
  discount?: string;
};

function AdminViewAC() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [data, setData] = useState<AC | null>(null);
  const params = useParams();

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        // If your data.json has a key like "mostbooked", use that:
        setData(data.careers || data);
      })
      .catch((err) => console.error("Error fetching services:", err));
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/careers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setData(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (!data) return <></>;

  const items = [
    { label: "Department", value: data.department },
    { label: "Title", value: data.title },
    { label: "Location", value: data.location },
    { label: "Type", value: data.type },
    { label: "Status", value: data.status },
    { label: "Salary", value: data.salary },
    { label: "Details", value: data.details },
    { label: "Requirements1", value: data.requirements1 },
    { label: "Requirements2", value: data.requirements2 },
    { label: "Requirements3", value: data.requirements3 },
    { label: "Requirements4", value: data.requirements4 },
    { label: "Description1", value: data.description1 },
    { label: "Description2", value: data.description2 },
    { label: "Description3", value: data.description3 },
  ];

  return (
    <>
      <ASO />
      <div className="wrapper">
        <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />
          <section className="mb-5 py-5">
            <div className="container-fluid px-4">
              <h5 className="bg-gradient text-center p-2 fw-bold mb-4">
                View Career Service
                <Link href="/AdminCareer" className="mx-2">
                  {" "}
                  <i className="fa fa-arrow-left fw-bold mx-2 text-white"></i>
                </Link>
                <i
                  className="fa fa-trash text-white mx-2"
                  onClick={() => handleDelete(data.id)}
                  style={{ cursor: "pointer" }}
                ></i>
              </h5>

              <div className="row">
                {items.map((item, idx) => (
                  <div className="col-md-4 mb-3" key={idx}>
                    <div className="card p-3 bg-light h-100">
                      <h6 className="fw-bold">{item.label}</h6>
                      <p className="mb-0">{item.value || "-"}</p>
                    </div>
                  </div>
                ))}
                {data.pic && (
                  <div className="col-md-4 mb-3">
                    <div className="card p-3 bg-light h-100 text-center">
                      <h6 className="fw-bold">Image</h6>
                      <img
                        src={`/assets/images/${data.pic}`}
                        alt="Uploaded"
                        style={{ maxWidth: "100%" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          <PageFooter />
        </div>
      </div>
    </>
  );
}

export default AdminViewAC;
