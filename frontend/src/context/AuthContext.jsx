import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [recruiter, setRecruiter] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    setLoading(true);
    try {
      const current = await api.get("/users/profile", false);
      const recruiterPayload = await api.get("/users/check-recruiter", false);
      setUser(current);
      setIsRecruiter(recruiterPayload.isRecruiter);
      setRecruiter(recruiterPayload.recruiter);
      return { current, recruiterPayload };
    } catch (error) {
      setUser(null);
      setIsRecruiter(false);
      setRecruiter(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email, password) => {
    const result = await api.post("/users/login", { email, password }, false);
    setUser(result?.user ?? null);
    setIsRecruiter(result?.user?.isRecruiter ?? false);
    if (result?.user) {
      if (!result.user.onboarded) {
        navigate("/onboarding");
      } else if (result.user.isRecruiter) {
        navigate("/portfolios");
      } else {
        navigate("/dashboard");
      }
    }
    await refreshUser();
  };

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } catch (error) {
      console.warn(error.message);
    }
    setUser(null);
    setIsRecruiter(false);
    setRecruiter(null);
    navigate("/login");
  };

  const value = useMemo(
    () => ({ user, isRecruiter, recruiter, loading, login, logout, refreshUser, setUser, setIsRecruiter, setRecruiter }),
    [user, isRecruiter, recruiter, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
