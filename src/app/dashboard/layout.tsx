"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { MainSidebar } from "@/components/main-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Role } from "@/types";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch("/api/auth/role");
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setUserRole(data.role as Role);
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile(); // Initial check
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Loading state
  if (!userRole) {
    return (
      <div className="relative w-full h-[calc(100vh-64px-200px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b2c2]"></div>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        {!isMobile && (
          <div className="w-[250px]">
            <MainSidebar userRole={userRole} />
          </div>
        )}
        <div className="flex-grow bg-background">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
