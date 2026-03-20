"use client";
import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import PageFooter from "../../../Sidebar/Footer/page";
import Sidebars from "../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../AOS/AOS";
import Link from "next/link";

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

function AdminUpdateCarpenter() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [data, setData] = useState<AC>({
    id: "",
    name: "",
    pic: "",
    description: "",
    price: "",
    duration: "",
    createdAt: "",
    updatedAt: "",
    rating: "",
    status: "",
    details: "",
    category: "",
  });
  const [errorsMassage, setErrorsMassage] = useState<{ [key: string]: string }>(
    {}
  );
  const [show, setShow] = useState(false);
  const router = useRouter();
  const params = useParams(); // to get id from URL

  // Fetch AC by ID
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/carpenter?id=${params.id}`);
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

  // 🔵 Handle update
  const updateData = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShow(true);

    let errors: any = {};
    if (!data.name) errors.name = "AC Name is required";
    setErrorsMassage(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const res = await fetch(`/api/carpenter?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("✅ Updated successfully!");
        router.push("/AdminCarpenter");
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
                    Update Carpenter Service
                    <Link href="/AdminCarpenter" className="ms-2">
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
                              <label>Select Name :</label>
                              <select
                                name="name"
                                onChange={getInputData}
                                value={data.name}
                                className="form-control mt-2"
                              >
                                <option value="">Select Name</option>
                                <option value="Furniture Making & Repair">
                                  Furniture Making & Repair
                                </option>
                                <option value="Door & Window Fabrication">
                                  Door & Window Fabrication
                                </option>
                                <option value="Cabinet & Kitchen Work">
                                  Cabinet & Kitchen Work
                                </option>
                                <option value="Wooden Flooring & Decking">
                                  Wooden Flooring & Decking
                                </option>
                                <option value="Partitions & Paneling">
                                  Partitions & Paneling
                                </option>
                                <option value="Wardrobes & Closets">
                                  Wardrobes & Closets
                                </option>
                                <option value="Staircases & Railings">
                                  Staircases & Railings{" "}
                                </option>
                                <option value="Outdoor Wooden Structures">
                                  Outdoor Wooden Structures{" "}
                                </option>
                                <option value="Custom Woodwork & Joinery">
                                  Custom Woodwork & Joinery
                                </option>
                                <option value="Repair & Maintenance Services">
                                  Repair & Maintenance Services
                                </option>
                              </select>
                              {show && errorsMassage.name && (
                                <p className="text-danger">
                                  {errorsMassage.name}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label> Select Category </label>
                              <select
                                name="category"
                                onChange={getInputData}
                                value={data.category}
                                className="form-control mt-2"
                              >
                                <option value="">Select Category</option>
                                <option value="Community">Community</option>
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Commercial/Residential">
                                  Commercial/Residential
                                </option>
                                <option value="Residential/Commercial">
                                  Residential/Commercial
                                </option>
                              </select>
                            </div>
                          </div>

                          <div className="col-md-4">
                            <label className="fw-bold">Duration Time </label>
                            <select
                              name="duration"
                              onChange={getInputData}
                              autoFocus
                              value={data.duration}
                              className="form-control mt-2"
                            >
                              <option value="">Select Duration Time</option>
                              <option value="Half day">Half day</option>
                              <option value="1 days">1 day</option>
                              <option value="2 days">2 days</option>
                              <option value="3 days">3 days</option>
                              <option value="4 days">4 days</option>
                              <option value="5 days">5 days</option>
                              <option value="1-2 days">1-2 days</option>
                              <option value="2-3 days">2-3 days</option>
                              <option value="3-4 days">3-4 days</option>
                              <option value="4-5 days">4-5 days</option>
                              <option value="5-6 days">5-6 days</option>
                            </select>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4">
                            <label className="fw-bold">CreatedAt </label>
                            <input
                              type="date"
                              name="createdAt"
                              onChange={getInputData}
                              autoFocus
                              value={
                                data.createdAt
                                  ? data.createdAt.split("T")[0]
                                  : ""
                              }
                              className="form-control mt-2"
                            />
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>UpdatedAt :</label>
                              <input
                                type="date"
                                name="updatedAt"
                                onChange={getInputData}
                                autoFocus
                                value={
                                  data.updatedAt
                                    ? data.updatedAt.split("T")[0]
                                    : ""
                                }
                                className="form-control mt-2"
                              />
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Status </label>
                              <select
                                name="status"
                                onChange={getInputData}
                                value={data.status}
                                className="form-control mt-2"
                              >
                                <option value="Select Status">
                                  {" "}
                                  Select Status
                                </option>
                                <option value="Active">Active</option>
                                <option value="Deactive">Deactive</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Rating </label>
                              <div className="d-flex gap-2 mt-2 form-control p-0">
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <label
                                    key={num}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <input
                                      type="radio"
                                      name="rating"
                                      value={num}
                                      checked={data.rating === String(num)}
                                      onChange={(e) =>
                                        setData((prev) => ({
                                          ...prev,
                                          rating: e.target.value,
                                        }))
                                      }
                                      className="d-none mx-3"
                                    />
                                    <span
                                      className="px-1"
                                      style={{
                                        fontSize: "25px",
                                        paddingLeft: "10px",
                                        color:
                                          num <= Number(data.rating)
                                            ? "#ff0000ff"
                                            : "#2f5fffff",
                                      }}
                                    >
                                      ★
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Price :</label>
                              <input
                                type="text"
                                name="price"
                                onChange={getInputData}
                                autoComplete="off"
                                autoFocus
                                value={data.price}
                                placeholder="Enter  Price"
                                className={`form-control mt-2 ${
                                  show && errorsMassage.price
                                    ? "is-invalid"
                                    : ""
                                }`}
                              />
                              {show && errorsMassage.price && (
                                <p className="text-danger">
                                  {errorsMassage.price}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Discount :</label>
                              <input
                                type="number"
                                name="discount"
                                onChange={getInputData}
                                autoComplete="off"
                                autoFocus
                                value={data.discount}
                                placeholder="Enter  Discount"
                                className="form-control mt-2"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="row">
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

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Description :</label>
                              <textarea
                                name="description"
                                placeholder="Enter Description"
                                rows={6}
                                onChange={getInputData}
                                value={data.description}
                                className="form-control"
                                id=""
                              ></textarea>
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Details :</label>
                              <textarea
                                placeholder="Enter Details"
                                name="details"
                                rows={6}
                                onChange={getInputData}
                                value={data.details}
                                className="form-control"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mb-3 btn-group w-100 py-5">
                          <button
                            type="button"
                            onClick={() => router.push("/AdminCarpenter")}
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

export default AdminUpdateCarpenter;
