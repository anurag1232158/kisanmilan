"use client";
import Link from "next/link";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import PageFooter from "../../../Sidebar/Footer/page";
import Sidebars from "../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../AOS/AOS";

// Type for Investor form data
type InvestorForm = {
  name: string;
  title: string;
  pic: string;
};

function AdminHome() {
  const [ACData, setACData] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();
  const [errorsMassage, setErrorsMassage] = useState<{ [key: string]: string }>(
    {}
  );
  const [show, setShow] = useState(false);

  const [data, setData] = useState<InvestorForm>({
    name: "",
    title: "",
    pic: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/investors");
        if (response.ok) {
          const result = await response.json();
          setACData(result);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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

  const resetForm = () => {
    setData({
      name: "",
      title: "",
      pic: "",
    });
    setShow(false);
    setErrorsMassage({});
  };

  const postData = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/investors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ Investor name added successfully!");
        router.push(`/AdminInvestor`);
      } else {
        alert(result.error || "Something went wrong.");
      }
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  return (
    <>
      <ASO />
      <div className="wrapper">
        <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />

          {/* ---------- FORM SECTION ---------- */}
          <section className="mb-5 py-5">
            <div className="container-fluid px-4">
              <div className="border">
                <div className="text-center">
                  <h5
                    className="bg-gradient text-center p-3 fw-bold mb-4"
                    data-aos="flip-left"
                    data-aos-easing="ease-out-cubic"
                    data-aos-duration="1500"
                  >
                    Add Investor Service
                    <Link href="/AdminInvestor">
                      <i className="fa fa-arrow-left ms-2 text-white"></i>
                    </Link>
                  </h5>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12 col-sm-12 m-auto">
                  <div className="card">
                    <div
                      className="card-body bg-grays1 mx-3"
                      data-aos="zoom-in-down"
                      data-aos-duration="1500"
                    >
                      <form onSubmit={postData} className="mt-2">
                        {/* Investor Description & Details */}
                        <div className="row my-4">
                          <div className="col-md-4">
                            <label className="form-label fw-bold">
                              {" "}
                              Name :
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={data.name}
                              onChange={getInputData}
                              className="form-control mt-2"
                              placeholder="Enter name"
                            />
                          </div>

                          <div className="col-md-4">
                            <label className="form-label fw-bold">
                              {" "}
                              Title :
                            </label>
                            <input
                              type="text"
                              name="title"
                              value={data.title}
                              onChange={getInputData}
                              className="form-control mt-2"
                              placeholder="Enter Name"
                            />
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
                                    alt={data.pic}
                                    width="150"
                                    height="70"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="mb-3 btn-group w-100 py-5">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="btn btn-secondary text-light w-50"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push("/AdminInvestor")}
                            className="btn btn-primary text-light w-50"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            className="btn btn-success text-light w-50"
                          >
                            Submit
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

export default AdminHome;
