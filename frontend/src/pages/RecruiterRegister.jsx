import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";

export const RecruiterRegister = () => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [hiringForRole, setHiringForRole] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/users/recruiter-signup", {
        fullName,
        username,
        email,
        password,
        name,
        company,
        company_size: companySize,
        hiring_for_role: hiringForRole,
      });

      // Save tokens
      if (response.accessToken && response.refreshToken) {
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
      }

      // Set user
      if (response.user) {
        setUser(response.user);
      }

      toast.pushToast("Recruiter account created successfully!", "success");
      navigate("/recruiters");
    } catch (error) {
      toast.pushToast(error.message || "Failed to create recruiter account", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-[32px] border border-slate-200/40 bg-white/90 p-8 shadow-xl shadow-slate-950/5">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-indigo-600">Recruiter Signup</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Join as a Recruiter</h1>
        <p className="mt-2 text-sm text-slate-600">Create your account and start finding top talent.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm text-slate-700">
            Full name
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" required />
          </label>
          <label className="block text-sm text-slate-700">
            Username
            <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username" required />
          </label>
          <label className="block text-sm text-slate-700 md:col-span-2">
            Email
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" required />
          </label>
          <label className="block text-sm text-slate-700 md:col-span-2">
            Password
            <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••" required />
          </label>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold text-slate-950 mb-4">Recruiter Information</h3>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm text-slate-700">
              Recruiter Name
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your recruiter name" required />
            </label>
            <label className="block text-sm text-slate-700">
              Company
              <Input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company name" required />
            </label>
            <label className="block text-sm text-slate-700">
              Company Size
              <Input value={companySize} onChange={(event) => setCompanySize(event.target.value)} placeholder="e.g., 50-100" />
            </label>
            <label className="block text-sm text-slate-700">
              Hiring for Role
              <Input value={hiringForRole} onChange={(event) => setHiringForRole(event.target.value)} placeholder="e.g., Software Engineer" />
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create recruiter account"}
        </Button>
      </form>

      <div className="text-center text-sm text-slate-600">
        Already have an account? <Link to="/login" className="text-indigo-600 font-semibold">Sign in</Link>
      </div>
    </div>
  );
};
