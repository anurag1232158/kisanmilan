"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import PageFooter from "../../../Sidebar/Footer/page";
import Sidebars from "../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../AOS/AOS";
import Pagination from "../../../AOS/Pagination";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
type AC = {
  id: string;
  name: string;
  pic: string;
  description: string;
  price: string;
  duration: string;
  createdAt: string;
  updatedAt: string;
  rating: string;
  status: string;
  details: string;
  category: string;
  discount?: string;
};

function AdminViewAC() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [data, setData] = useState<AC | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/electrical?id=${params.id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Error fetching AC:", err);
      }
    };
    if (params?.id) fetchData();
  }, [params?.id]);

  // Pagination logic
  const totalPages = Math.ceil(1 / itemsPerPage);
  const indexOfLastItem = (currentPage + 1) * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!data) return <></>;
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/electrical?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("✅ Deleted successfully!");
        router.push(`/AdminElectrical`);
      } else {
        console.error("Failed to delete, server responded:", await res.text());
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };
  return (
    <>
      <ASO />
      <div className="wrapper">
        <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />
          <section className="mb-5 py-5">
            <div className="container-fluid px-4">
              <div className="row">
                <div className="col-md-12 col-sm-12 m-auto">
                  <div className="card">
                    <div className="card-body bg-grays1">
                      <h5
                        className="bg-gradient text-center p-2 fw-bold mb-4"
                        data-aos="flip-left"
                        data-aos-easing="ease-out-cubic"
                        data-aos-duration="1500"
                      >
                        View Electrical Service
                        <Link href="/AdminElectrical" className="mx-2">
                          <i className="fa fa-arrow-left fw-bold mx-2 text-white"></i>
                        </Link>
                      </h5>

                      <div
                        className="table"
                        style={{ maxHeight: "500px", overflowY: "auto" }}
                        data-aos="zoom-in-down"
                        data-aos-duration="1500"
                      >
                        <table className="table table-bordered table-hover">
                          <thead>
                            <tr className="text-center bg-gradient">
                              <th className="text-dark">#</th>
                              <th className="text-dark">Name</th>
                              <th className="text-dark">Price </th>
                              <th className="text-dark">Discount </th>
                              <th className="text-dark">Reting </th>
                              <th className="text-dark">Duration </th>
                              <th className="text-dark">UpdatedAt </th>
                              <th className="text-dark">CreatedAt</th>
                              <th className="text-dark">Description</th>
                              <th className="text-dark">Details</th>
                              <th className="text-dark">Status </th>
                              <th className="text-dark">Image</th>
                              <th className="text-dark">Back & Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center">
                              <td>{"#" + data.id + 1}</td>
                              <td className="text-left table-respons">
                                {" "}
                                {data.name}
                              </td>
                              <td className="table-respons"> {data.price}</td>
                              <td className="table-respons">
                                {" "}
                                {data.discount}
                              </td>
                              <td className="table-respons"> {data.rating}</td>
                              <td className="table-respons">
                                {" "}
                                {data.duration}
                              </td>
                              <td className="table-respons">
                                {" "}
                                {data.updatedAt}
                              </td>
                              <td className="table-respons">
                                {" "}
                                {data.createdAt}
                              </td>
                              <td className="table-respons">
                                {data.description.length > 10
                                  ? data.description.slice(0, 10) + "..."
                                  : data.description}
                              </td>
                              <td className="table-respons w-25">
                                {data.details.length > 30
                                  ? data.details.slice(0, 30) + "..."
                                  : data.details}
                              </td>
                              <td className="table-respons"> {data.status}</td>
                              <td>
                                {data.pic && (
                                  <Link
                                    href={`/assets/images/${data.pic}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={`/assets/images/${data.pic}`}
                                      alt="Uploaded"
                                      className="img-fluid images-respons"
                                      style={{ maxWidth: "80px" }}
                                    />
                                  </Link>
                                )}
                              </td>
                              <td>
                                <Link
                                  href={`/AdminElectrical`}
                                  className="btn btn-warning btn-sm mb-2"
                                >
                                  <i className="fa fa-arrow-left"></i>
                                </Link>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDelete(data.id)}
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        handlePrevPage={() =>
                          setCurrentPage((p) => Math.max(p - 1, 0))
                        }
                        handleNextPage={() =>
                          setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
                        }
                      />
                    </div>
                  </div>
                </div>
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
