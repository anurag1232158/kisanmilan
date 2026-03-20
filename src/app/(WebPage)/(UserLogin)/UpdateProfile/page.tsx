"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Profile {
  id: number;
  name?: string;
  username?: string;
  email?: string;
  number?: string;
  address?: string;
  pin?: string;
  city?: string;
  state?: string;
  country?: string;
  pic?: string; // stored in DB (filename)
  preview?: string; // temporary preview for UI
}

export default function UpdateProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!formData) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        pic: file.name,
        preview: URL.createObjectURL(file),
      });
    }
  };

  // Load user profile from localStorage and API
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("authUser") || "{}");
    if (user?.id) {
      fetch(`/api/user?id=${user.id}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((profile: Profile) => setFormData(profile))
        .catch((err) => console.error("Fetch profile error:", err));
    }
  }, []);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, preview: undefined }),
      });

      if (res.ok) {
        alert("Profile updated successfully ✅");
        router.push("/Profile");
      } else {
        alert("Error updating profile ❌");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return <></>;

  return (
    <section className="py-5 bg-gray">
      <div className="container">
        <div className="card shadow">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="col-md-12 mx-auto pt-3">
                <h5 className="bg-primary text-center p-2 fw-bold">
                  Update Profile
                  <Link href="/Profile" className="btn btn-dark w-100  mx-3">
                    <i className="fa fa-arrow-left"></i> Back
                  </Link>
                </h5>
                <div className="row px-3 py-4">
                  {/* Profile Picture */}
                  <div className="col-md-4 text-center my-auto">
                    <h5 className="form-label text-dark fw-bold text-decoration-underline mb-0 pb-0">
                      Your Profile Picture:
                    </h5>
                    <br />
                    {(formData.pic || formData.preview) && (
                      <img
                        src={
                          formData.preview || `./assets/images/${formData.pic}`
                        }
                        alt="Profile"
                        className="py-2 img-fluid rounded w-75"
                      />
                    )}
                    <input
                      type="file"
                      className="form-control w-75 m-auto py-2"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Profile Form Fields */}
                  <div className="col-md-8">
                    <table className="table table-bordered table-responsive">
                      <tbody>
                        <tr>
                          <th>Name</th>
                          <td>
                            <input
                              type="text"
                              name="name"
                              className="form-control"
                              value={formData.name || ""}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th>Username</th>
                          <td>
                            <input
                              type="text"
                              name="username"
                              className="form-control"
                              value={formData.username || ""}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th>Email</th>
                          <td>
                            <input
                              type="email"
                              name="email"
                              className="form-control"
                              value={formData.email || ""}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th>Phone</th>
                          <td>
                            <input
                              type="text"
                              name="number"
                              className="form-control"
                              value={formData.number || ""}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th>Address</th>
                          <td colSpan={3}>
                            <input
                              type="text"
                              name="address"
                              className="form-control"
                              value={formData.address || ""}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th>PIN</th>
                          <td>
                            <input
                              type="text"
                              name="pin"
                              className="form-control"
                              value={formData.pin || ""}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th>City</th>
                          <td>
                            <input
                              type="text"
                              name="city"
                              className="form-control"
                              value={formData.city || ""}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th>State</th>
                          <td>
                            <input
                              type="text"
                              name="state"
                              className="form-control"
                              value={formData.state || ""}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <th>Country</th>
                          <td>
                            <input
                              type="text"
                              name="country"
                              className="form-control"
                              value={formData.country || ""}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="text-center py-4 w-100">
                            <button
                              type="submit"
                              disabled={loading}
                              className="btn btn-success w-100"
                            >
                              <i className="fa fa-save"></i>{" "}
                              {loading ? "Saving..." : "Save Changes"}
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
