// AdminContact/page.tsx
"use client";
import { useEffect, useState } from "react";
import PageNavbar from "../../Sidebar/Navbar/PageNavbar";
import PageFooter from "../../Sidebar/Footer/page";
import Sidebars from "../../Sidebar/Sidebars/PageSidebar";
import Link from "next/link";
import Pagination from "../../AOS/Pagination";

function Dashboard() {
  const [adminData, setAdminData] = useState<any[]>([]);
  const [userData, setUserData] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const itemsPerPage = 5;
  const indexOfLastItem = (currentPage + 1) * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // ✅ calculate total pages for pagination
  const totalPages = Math.ceil(userData.length / itemsPerPage);

  useEffect(() => {
    const fetchData = async (url: string, setData: any) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const result = await response.json();
          setData(result); // store full list
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData("/api/admin", setAdminData);
    fetchData("/api/user", setUserData);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Delete from user collection
  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/user/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("✅ User deleted successfully!");
      } else {
        const err = await res.json();
        alert(`❌ Failed to delete user: ${err.error}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("❌ Failed to delete user (Network error)");
    }
  };

  // Delete from admin collection
  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;

    try {
      const res = await fetch(`/api/admin/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("✅ admin deleted successfully!");
      } else {
        const err = await res.json();
        alert(`❌ Failed to delete admin: ${err.error}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("❌ Failed to delete admin (Network error)");
    }
  };

  return (
    <div className="wrapper">
      <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
        <PageNavbar toggleSidebar={toggleSidebar} />

        <section className="mb-5">
          <div className="container-fluid px-4">
            {/* User Contact */}
            <div className="row mb-5">
              <div className="col-12 m-auto">
                <div className="card">
                  <div className="card-body bg-grays1">
                    <h5 className="bg-gradient text-center p-2 fw-bold mb-4">
                      Total User Contact: {userData.length}
                    </h5>

                    <div
                      className="table-responsive"
                      style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      <table className="table table-bordered table-hover">
                        <thead>
                          <tr className="text-center bg-gradient">
                            <th>ID</th>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Number</th>
                            <th>Address</th>
                            <th>City</th>
                            <th>State</th>
                            <th>ZIP</th>
                            <th>Country</th>
                            <th>Image</th>
                            <th>Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userData.length > 0 ? (
                            userData
                              .slice(indexOfFirstItem, indexOfLastItem)
                              .map((user, idx) => (
                                <tr key={user.id} className="text-center">
                                  <td>{idx + 1}</td>
                                  <td>{user.name}</td>
                                  <td>{user.username}</td>
                                  <td>{user.email}</td>
                                  <td>{user.number}</td>
                                  <td>{user.address}</td>
                                  <td>{user.city}</td>
                                  <td>{user.state}</td>
                                  <td>{user.pin}</td>
                                  <td>{user.country}</td>
                                  <td>
                                    {user.pic && (
                                      <Link
                                        href={`/assets/images/${user.pic}`}
                                        target="_blank"
                                      >
                                        <img
                                          src={`/assets/images/${user.pic}`}
                                          alt="Uploaded"
                                          style={{ maxWidth: "80px" }}
                                        />
                                      </Link>
                                    )}
                                  </td>
                                  <td>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleDeleteUser(user.id)}
                                    >
                                      <i className="fa fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
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

            {/* Admin Contact */}
            <div className="row">
              <div className="col-12 m-auto">
                <div className="card">
                  <div className="card-body bg-grays1">
                    <h5 className="bg-gradient text-center p-2 fw-bold mb-4">
                      Total Admin Contact: {adminData.length}
                    </h5>

                    <div
                      className="table-responsive"
                      style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      <table className="table table-bordered table-hover">
                        <thead>
                          <tr className="text-center bg-gradient">
                            <th>ID</th>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Number</th>
                            <th>Address</th>
                            <th>City</th>
                            <th>State</th>
                            <th>ZIP</th>
                            <th>Country</th>
                            <th>Image</th>
                            <th>Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.length > 0 ? (
                            adminData.map((admin, idx) => (
                              <tr key={admin.id} className="text-center">
                                <td>{idx + 1}</td>
                                <td>{admin.name}</td>
                                <td>{admin.username}</td>
                                <td>{admin.email}</td>
                                <td>{admin.number}</td>
                                <td>{admin.village}</td>
                                <td>{admin.post}</td>
                                <td>{admin.state}</td>
                                <td>{admin.pin}</td>
                                <td>{admin.country}</td>
                                <td>
                                  {admin.pic && (
                                    <Link
                                      href={`/assets/images/${admin.pic}`}
                                      target="_blank"
                                    >
                                      <img
                                        src={`/assets/images/${admin.pic}`}
                                        alt="Uploaded"
                                        style={{ maxWidth: "80px" }}
                                      />
                                    </Link>
                                  )}
                                </td>

                                <td>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                  >
                                    <i className="fa fa-trash"></i>
                                  </button>
                                </td>
                              </tr>
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <PageFooter />
      </div>
    </div>
  );
}

export default Dashboard;
