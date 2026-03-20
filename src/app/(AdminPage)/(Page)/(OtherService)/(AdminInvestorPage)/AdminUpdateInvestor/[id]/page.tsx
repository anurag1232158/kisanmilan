"use client";
import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import PageFooter from "../../../../Sidebar/Footer/page";
import Sidebars from "../../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../../AOS/AOS";
import Link from "next/link";

type AC = {
  id: string;
  name: string;
  pic: string;
  title: string;
};

function AdminUpdateInvestor() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [data, setData] = useState<AC>({
    id: "",
    name: "",
    pic: "",
    title: "",
  });
  const [errorsMassage, setErrorsMassage] = useState<{ [key: string]: string }>(
    {}
  );
  const [show, setShow] = useState(false);
  const router = useRouter();
  const params = useParams(); // to get id from URL

  // Fetch AC by ID

  // Fetch AC by ID
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/investors?id=${params.id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    if (params?.id) fetchData();
  }, [params?.id]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Handle input changes
  const getInputData = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, files } = e.target as HTMLInputElement; // type narrow
    if (files && files[0]) {
      setData((prev) => ({ ...prev, [name]: files[0].name }));
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle update
  const updateData = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShow(true);

    let errors: any = {};
    if (!data.name) errors.name = "Investor Name is required";
    setErrorsMassage(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const res = await fetch(`/api/investors?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("✅ Updated successfully!");
        router.push("/AdminInvestor");
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <ASO />
      <div className="wrapper">
        <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />
          <section className="mb-5 py-5">
            <div className="container-fluid px-4">
              <div className="border p-3 mb-3 bg-gradient">
                <div className="text-center">
                  <h5 className="mb-0 font-weight-medium fw-bold text-white">
                    {" "}
                    Update Investor Service
                    <Link href="/AdminInvestor" className="ms-2">
                      <i className="fa fa-arrow-left text-white"></i>
                    </Link>
                  </h5>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 col-sm-12 m-auto">
                  <div className="card">
                    <div className="card-body bg-grays1">
                      <form onSubmit={updateData} className="mt-2">
                        <div className="row">
                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Investor Name:</label>
                              <input
                                type="text"
                                name="name"
                                value={data.name}
                                onChange={getInputData}
                                className="form-control mt-2"
                              />
                              {errorsMassage.name && (
                                <span className="text-danger">
                                  {errorsMassage.name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Investor Title:</label>
                              <input
                                type="text"
                                name="title"
                                value={data.title}
                                onChange={getInputData}
                                className="form-control mt-2"
                              />
                              {errorsMassage.title && (
                                <span className="text-danger">
                                  {errorsMassage.title}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Image :</label>
                              <input
                                type="file"
                                name="pic"
                                className="form-control mt-2"
                                onChange={getInputData}
                              />
                              {data.pic && (
                                <div className="mt-2">
                                  <img
                                    src={`/assets/images/${data.pic}`}
                                    alt="AC"
                                    width="100"
                                    height="100"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mb-3 btn-group w-100 py-5">
                          <button
                            type="button"
                            onClick={() => router.push("/AdminInvestor")}
                            className="btn btn-primary text-light w-50"
                          >
                            {" "}
                            Back{" "}
                          </button>
                          <button
                            onClick={scrollToTop}
                            type="submit"
                            className="btn btn-success text-light w-50"
                          >
                            Update
                          </button>
                        </div>
                      </form>
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

export default AdminUpdateInvestor;
