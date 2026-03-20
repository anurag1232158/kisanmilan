"use client";
import React, { useState, useEffect } from "react"; // 👈 important
import Link from "next/link";
import PageFooter from "../../../Sidebar/Footer/page";
import Sidebars from "../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../AOS/AOS";
import Pagination from "../../../AOS/Pagination";

type AboutUs = {
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

function AdminCareer() {
  const [aboutUsData, setAboutUsData] = useState<AboutUs[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        // If your data.json has a key like "mostbooked", use that:
        setAboutUsData(data.careers || data);
      })
      .catch((err) => console.error("Error fetching services:", err));
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Pagination logic
  const totalPages = Math.ceil(aboutUsData.length / itemsPerPage);
  const indexOfLastItem = (currentPage + 1) * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContent = aboutUsData.slice(indexOfFirstItem, indexOfLastItem);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/careers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAboutUsData((prev) => prev.filter((item) => item.id !== id));
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
                        Career Services : {aboutUsData.length}
                        <Link href="/AdminAddCareer" className="mx-2">
                          <i className="fa fa-plus fw-bold mx-2 text-white"></i>
                        </Link>
                      </h5>

                      <div
                        className="table-responsive"
                        style={{ maxHeight: "500px", overflowY: "auto" }}
                        data-aos="zoom-in-down"
                        data-aos-duration="1500"
                      >
                        <table className="table table-bordered table-hover">
                          <thead className="text-center bg-gradient">
                            <tr>
                              <th className="text-dark">#</th>
                              <th className="text-dark">Department</th>
                              <th className="text-dark">Title</th>
                              <th className="text-dark">Location</th>
                              <th className="text-dark">Type</th>
                              <th className="text-dark">Salary</th>
                              <th className="text-dark">Status</th>
                              <th className="text-dark">Details</th>
                              <th className="text-dark">Main Description</th>
                              <th className="text-dark">Edit & View</th>
                            </tr>
                            <tr>
                              <th className="text-dark">#</th>
                              <th className="text-dark">Description 1</th>
                              <th className="text-dark">Description 2</th>
                              <th className="text-dark">Description 3</th>
                              <th className="text-dark">Requirement 1</th>
                              <th className="text-dark">Requirement 2</th>
                              <th className="text-dark">Requirement 3</th>
                              <th className="text-dark">Requirement 4</th>
                              <th className="text-dark">Images</th>
                              <th className="text-dark">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentContent.length > 0 ? (
                              currentContent.map((item, index) => (
                                <React.Fragment key={item.id}>
                                  <tr className="text-center">
                                    <td className="table-respons">
                                      {indexOfFirstItem + index + 1}
                                    </td>
                                    <td className="table-respons">
                                      {item.department}
                                    </td>
                                    <td className="table-respons">
                                      {item.title}
                                    </td>
                                    <td className="table-respons">
                                      {item.location}
                                    </td>
                                    <td className="table-respons">
                                      {item.type}
                                    </td>
                                    <td className="table-respons">
                                      {item.salary}
                                    </td>
                                    <td className="table-respons">
                                      {item.status}
                                    </td>
                                    <td className="table-respons">
                                      {item.details?.length > 10
                                        ? item.details.slice(0, 10) + "..."
                                        : item.details || ""}
                                    </td>
                                    <td className="table-respons">
                                      {item.description?.length > 10
                                        ? item.description.slice(0, 10) + "..."
                                        : item.description || ""}
                                    </td>

                                    <td className="table-respons">
                                      <Link
                                        className="btn btn-success btn-sm my-1"
                                        href={`/AdminUpdateCareer/${item.id}`}
                                      >
                                        <i className="fa fa-edit text-white mx-2"></i>
                                      </Link>
                                      <Link
                                        className="btn btn-info btn-sm"
                                        href={`/AdminViewCareer/${item.id}`}
                                      >
                                        <i className="fa fa-eye text-white mx-2"></i>
                                      </Link>
                                    </td>
                                  </tr>
                                  <tr className="text-center py-4">
                                    <td className="table-respons"></td>
                                    <td className="table-respons">
                                      {item.description1?.length > 10
                                        ? item.description1.slice(0, 10) + "..."
                                        : item.description1 || ""}
                                    </td>
                                    <td className="table-respons">
                                      {item.description2?.length > 10
                                        ? item.description2.slice(0, 10) + "..."
                                        : item.description2 || ""}
                                    </td>
                                    <td className="table-respons">
                                      {item.description3?.length > 10
                                        ? item.description3.slice(0, 10) + "..."
                                        : item.description3 || ""}
                                    </td>
                                    <td className="table-respons">
                                      {item.requirements1?.length > 10
                                        ? item.requirements1.slice(0, 10) +
                                          "..."
                                        : item.requirements1 || ""}
                                    </td>
                                    <td className="table-respons">
                                      {item.requirements2?.length > 10
                                        ? item.requirements2.slice(0, 10) +
                                          "..."
                                        : item.requirements2 || ""}
                                    </td>
                                    <td className="table-respons">
                                      {item.requirements3?.length > 10
                                        ? item.requirements3.slice(0, 10) +
                                          "..."
                                        : item.requirements3 || ""}
                                    </td>
                                    <td className="table-respons">
                                      {item.requirements4?.length > 10
                                        ? item.requirements4.slice(0, 10) +
                                          "..."
                                        : item.requirements4 || ""}
                                    </td>
                                    <td className="table-respons">
                                      {item.pic && (
                                        <Link
                                          href={`/assets/images/${item.pic}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <img
                                            src={`/assets/images/${item.pic}`}
                                            alt="Uploaded"
                                            className="img-fluid images-respons"
                                            style={{ maxWidth: "80px" }}
                                          />
                                        </Link>
                                      )}
                                    </td>
                                    <td className="table-respons">
                                      <button className="btn btn-danger btn-sm">
                                        <i
                                          className="fa fa-trash text-white mx-2"
                                          onClick={() => handleDelete(item.id)}
                                        ></i>
                                      </button>
                                    </td>
                                  </tr>
                                </React.Fragment>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={10} className="text-center">
                                  No content found
                                </td>
                              </tr>
                            )}
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

export default AdminCareer;
