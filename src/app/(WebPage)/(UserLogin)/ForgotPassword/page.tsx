"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const STEP = { EMAIL: 1, OTP: 2, PASSWORD: 3, DONE: 4 };

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(STEP.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef<HTMLInputElement[]>([]);

  /* ─── Timer ─── */
  const startTimer = () => {
    setResendTimer(30);
    const t = setInterval(() => {
      setResendTimer((v) => {
        if (v <= 1) {
          clearInterval(t);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  };

  /* ─── Validation ─── */
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const otpFilled = otp.join("").length === 6;
  const passOk = newPass.length >= 6 && newPass === confirmPass;

  const passStrength = (p: string): number => {
    if (!p) return 0;
    if (p.length < 6) return 1;
    if (p.length < 8) return 2;
    if (p.length < 12) return 3;
    return 4;
  };

  const strength = passStrength(newPass);

  /* ─── API CALLS ─── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!emailValid) return setError("Valid email likho");

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStep(STEP.OTP);
      startTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP send failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otpFilled) return setError("Complete OTP daalo");

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join("") }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStep(STEP.PASSWORD);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP invalid");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passOk) return setError("Password match nahi kar raha");

    setLoading(true);
    try {
      const res = await fetch(` ${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otp.join(""),
          new_password: newPass,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStep(STEP.DONE);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  /* ─── OTP INPUT ─── */
  const handleOtpChange = (i: number, val: string) => {
    const newOtp = [...otp];
    newOtp[i] = val.replace(/\D/g, "").slice(0, 1);
    setOtp(newOtp);

    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  /* ─── UI ─── */
  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
      <div className="card p-4 shadow" style={{ width: 400 }}>
        <h4 className="text-center mb-3">🔐 Forgot Password</h4>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        {/* STEP 1 */}
        {step === STEP.EMAIL && (
          <form onSubmit={handleSendOtp}>
            <input
              type="email"
              className="form-control mb-3"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn btn-success w-100" disabled={!emailValid}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === STEP.OTP && (
          <form onSubmit={handleVerifyOtp}>
            <div className="d-flex gap-2 justify-content-center mb-3">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    if (el) otpRefs.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  maxLength={1}
                  className="form-control text-center"
                  style={{ width: 40 }}
                />
              ))}
            </div>
            <button className="btn btn-success w-100">
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {/* STEP 3 */}
        {step === STEP.PASSWORD && (
          <form onSubmit={handleReset}>
            <input
              type="password"
              className="form-control mb-2"
              placeholder="New Password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Confirm Password"
              value={confirmPass}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button className="btn btn-success w-100">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* DONE */}
        {step === STEP.DONE && (
          <div className="text-center">
            <h5 className="text-success">✅ Password Reset Done</h5>
            <button
              className="btn btn-success mt-3"
              onClick={() => router.push("/Login")}
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}