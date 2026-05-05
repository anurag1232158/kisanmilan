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
  pic?: string;
  preview?: string;
}

export default function UpdateProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!formData) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("authUser") || "{}");
    if (user?.id) {
      fetch(`/api/user?id=${user.id}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((profile: Profile) => setFormData(profile))
        .catch((err) => console.error("Fetch profile error:", err));
    }
  }, []);

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
        setSaved(true);
        setTimeout(() => {
          router.push("/Profile");
        }, 1200);
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

  if (!formData)
    return (
    <>
    </>
    );

  const avatarSrc =
    formData.preview ||
    (formData.pic ? `./assets/images/${formData.pic}` : null);

  const initials = (formData.name || formData.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="up-root">
        <div className="up-noise" />
        <div className="up-glow" />
        <div className="up-glow2" />

        <div className="up-container">
          {/* Header */}
          <div className="up-header">
            <div className="up-header-left">
              <Link href="/Profile" className="up-back-btn">
                ← Back
              </Link>
              <h1 className="up-title">Edit Profile</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="up-card">
              {/* Avatar Section */}
              <div className="up-avatar-section">
                <div className="up-avatar-wrap">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" className="up-avatar" />
                  ) : (
                    <div className="up-avatar-placeholder">{initials}</div>
                  )}
                  <label htmlFor="pic-upload" className="up-avatar-edit-btn" title="Change photo">
                    ✏️
                  </label>
                </div>
                <div className="up-avatar-info">
                  <h3>{formData.name || formData.username || "Your Name"}</h3>
                  <p>{formData.email || "your@email.com"}</p>
                  <label htmlFor="pic-upload" className="up-file-label">
                    📷 Change Photo
                  </label>
                  <input
                    id="pic-upload"
                    type="file"
                    accept="image/*"
                    className="up-file-input"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="up-form-body">
                {/* Personal Info */}
                <div className="up-section-label">Personal Info</div>
                <div className="up-grid up-grid-2">
                  <div className="up-field">
                    <label>Full Name</label>
                    <input
                      type="text" name="name" placeholder="John Doe"
                      value={formData.name || ""} onChange={handleChange}
                    />
                  </div>
                  <div className="up-field">
                    <label>Username</label>
                    <input
                      type="text" name="username" placeholder="johndoe"
                      value={formData.username || ""} onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="up-section-label">Contact</div> 
                <div className="up-grid up-grid-2">
                  <div className="up-field">
                    <label>Email Address</label>
                    <input
                      type="email" name="email" placeholder="you@example.com"
                      value={formData.email || ""} onChange={handleChange}
                    />
                  </div>
                  <div className="up-field">
                    <label>Phone Number</label>
                    <input
                      type="text" name="number" placeholder="+91 98765 43210"
                      value={formData.number || ""} onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="up-section-label">Address</div>
                <div className="up-grid" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="up-field">
                    <label>Street Address</label>
                    <input
                      type="text" name="address" placeholder="123 Main Street"
                      value={formData.address || ""} onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="up-grid up-grid-3">
                  <div className="up-field">
                    <label>PIN Code</label>
                    <input
                      type="text" name="pin" placeholder="110001"
                      value={formData.pin || ""} onChange={handleChange}
                    />
                  </div>
                  <div className="up-field">
                    <label>City</label>
                    <input
                      type="text" name="city" placeholder="New Delhi"
                      value={formData.city || ""} onChange={handleChange}
                    />
                  </div>
                  <div className="up-field">
                    <label>State</label>
                    <input
                      type="text" name="state" placeholder="Delhi"
                      value={formData.state || ""} onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="up-grid up-grid-2">
                  <div className="up-field">
                    <label>Country</label>
                    <input
                      type="text" name="country" placeholder="India"
                      value={formData.country || ""} onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="up-footer">
                <Link href="/Profile" className="up-cancel-btn">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || saved}
                  className={`up-save-btn${saved ? " saved" : ""}`}
                >
                  {loading ? (
                    <></>
                  ) : saved ? (
                    <>✓ Saved!</>
                  ) : (
                    <>💾 Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}