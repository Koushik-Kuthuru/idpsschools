import React from "react";
import LoginView from "@/components/auth/LoginView";

export default function SuperAdminLoginPage() {
  return (
    <LoginView
      title="IDPS Admin"
      subtitle="Super Portal"
      primaryColor="#111827"
      secondaryColor="#3b82f6"
      gradientFrom="from-[#111827]/95"
      gradientTo="to-[#1f2937]/95"
      requireSuperAdmin={true}
    />
  );
}
