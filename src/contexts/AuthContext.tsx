"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  schoolId: string | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  schoolId: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from local storage
    const storedUser = localStorage.getItem("mock_user");
    const storedRole = localStorage.getItem("mock_role");
    const storedSchoolId = localStorage.getItem("mock_schoolId");

    if (storedUser && storedRole && storedSchoolId) {
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
      setSchoolId(storedSchoolId);
    }
    setLoading(false);
  }, []);

  const login = async (email: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockUser: User = { uid: "mock_uid_123", email, displayName: email.split("@")[0] };
    
    // Determine mock role based on email (for easy testing)
    let newRole = "admin";
    if (email.includes("teacher")) newRole = "teacher";
    if (email.includes("student")) newRole = "student";
    if (email.includes("super")) newRole = "super_admin";

    let newSchoolId = "idpskalaburagi";
    if (newRole === "super_admin") newSchoolId = "all";
    if (email.includes("cherukupalli")) newSchoolId = "idpscherukupalli";

    localStorage.setItem("mock_user", JSON.stringify(mockUser));
    localStorage.setItem("mock_role", newRole);
    localStorage.setItem("mock_schoolId", newSchoolId);
    
    setUser(mockUser);
    setRole(newRole);
    setSchoolId(newSchoolId);
  };

  const logout = async () => {
    localStorage.removeItem("mock_user");
    localStorage.removeItem("mock_role");
    localStorage.removeItem("mock_schoolId");
    setUser(null);
    setRole(null);
    setSchoolId(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, schoolId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
