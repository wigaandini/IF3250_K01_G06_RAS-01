"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./ui/sidebar";
import { Role } from "@/types";
import { LogOut } from "lucide-react";

interface MenuItem {
  title: string;
  iconDefault: string;
  iconActive: string;
  href: string;
  roles: Role[];
}

const menuItems: MenuItem[] = [
  {
    title: "Home",
    iconDefault: "/images/icon-home-w.svg",
    iconActive: "/images/icon-home-t.svg",
    href: "/dashboard",
    roles: ["amil", "superadmin", "relawan"],
  },
  // {
  //   title: "Profil",
  //   iconDefault: "/images/icon-profil-w.svg",
  //   iconActive: "/images/icon-profile-t.svg",
  //   href: "/dashboard/profil",
  //   roles: ["amil", "superadmin", "relawan"],
  // },
  {
    title: "Kelola Pengguna",
    iconDefault: "/images/icon-kelola-pengguna-w.svg",
    iconActive: "/images/icon-kelola-pengguna-t.svg",
    href: "/dashboard/kelola-pengguna",
    roles: ["superadmin"],
  },
  {
    title: "Kelola Program",
    iconDefault: "/images/icon-kelola-program-w.svg",
    iconActive: "/images/icon-kelola-program-t.svg",
    href: "/dashboard/kelola-program",
    roles: ["superadmin"],
  },
  {
    title: "Kelola Penyaluran",
    iconDefault: "/images/icon-kelola-penyaluran-w.svg",
    iconActive: "/images/icon-kelola-penyaluran-t.svg",
    href: "/dashboard/kelola-penyaluran",
    roles: ["superadmin"],
  },
  
  {
    title: "Kelola Mustahiq",
    iconDefault: "/images/icon-kelola-mustahiq-w.svg",
    iconActive: "/images/icon-kelola-mustahiq-t.svg",
    href: "/dashboard/kelola-mustahiq",
    roles: ["amil", "superadmin", "relawan"],
  },
  {
    title: "Kelola Pengaturan",
    iconDefault: "/images/icon-pengaturan-w.svg",
    iconActive: "/images/icon-pengaturan-t.svg",
    href: "/dashboard/kelola-pengaturan",
    roles: ["amil", "superadmin"],
  },
];

interface MainSidebarProps {
  userRole: Role;
}

export function MainSidebar({ userRole }: MainSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-none bg-gradient-to-b from-[#FCB82E] to-[#07B0C8]">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2 p-4">
          <div className="flex-shrink-0">
            <img src="/images/logo-putih.svg" alt="Logo" className="h-[40px] w-auto" />
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-5">
      <SidebarMenu>
        {menuItems
            .filter((item) => item.roles.includes(userRole))
            .map((item) => {
            const isActive = pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href} className="w-full">
                    <SidebarMenuButton
                    isActive={isActive}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg font-bold transition-colors w-full
                    ${isActive ? "bg-[#F1F3F5] text-[#07B0C8] font-bold" : "text-white hover:bg-white/20"}`}
                    >
                    <Image
                        src={isActive ? item.iconActive : item.iconDefault}
                        alt={item.title}
                        width={20}
                        height={20}
                    />
                    <span className={`${isActive ? "text-[#07B0C8] font-bold" : "text-white"}`}>
                        {item.title}
                    </span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            );
            })}
            <SidebarMenuItem className="mt-25">
              <SidebarMenuButton
                className="flex items-center justify-center w-full py-3 rounded-lg 
                  bg-white text-[#07B0C8] font-bold transition-colors duration-300
                  hover:bg-[#FCB82E] hover:text-white"
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/logout", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                      });
                      
                      if (response.ok) {
                        window.location.href = "/login";
                      } else {
                        console.error("Logout failed");
                      }
                    } catch (error) {
                      console.error("Logout error:", error);
                    }
                  }}
              >
                <LogOut className="h-5 w-5 mr-2" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
