"use client"

import { TopNav } from "@/components/dashboard/top-nav";
import { Button } from "@/components/ui/button";
import { MapPin, Menu, ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
import MapSection from "@/components/map-section";
import { useEffect, useState } from 'react';

const MobileSidebar = ({ isOpen, closeMenu }: { isOpen: boolean; closeMenu: () => void }) => {
  const router = useRouter();

  type MenuItem = {
    title: string;
    iconDefault: string;
    iconActive: string;
    href: string;
    roles: string[];
  };

  const menuItems: MenuItem[] = [
    {
      title: "Home",
      iconDefault: "/images/icon-home-w.svg",
      iconActive: "/images/icon-home-t.svg",
      href: "/dashboard",
      roles: ["amil", "superadmin", "relawan"],
    },
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
  ];

  return (
    <div
      className={`fixed inset-0 z-50 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:hidden transition-transform duration-300 ease-in-out`}
    >
      <div className="relative w-80 max-w-[80%] h-full bg-gradient-to-b from-[#FCB82E] to-[#07B0C8] shadow-xl">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-[#ffffff]">Menu</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <button
                  onClick={() => {
                    router.push(item.href);
                    closeMenu();
                  }}
                  className={`flex items-center w-full p-3 font-bold rounded-lg text-white hover:bg-white hover:bg-opacity-20`}
                >
                  <img
                    src={item.iconDefault}
                    alt={item.title}
                    className="w-5 h-5 mr-3"
                  />
                  <span>{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <button
          onClick={closeMenu}
          className="absolute top-4 right-4 mt-1 rounded-full hover:bg-gray-100"
          aria-label="Close menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function MapPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleBack = () => {
    router.push('/dashboard');
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <div className="p-0">
      {/* Mobile menu button and header */}
      {isMobile && (
        <div className="flex items-center p-4 bg-white border-b">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            className="hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-[#FCB82E] ml-4">Peta</h1>
        </div>
      )}

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={isMobileMenuOpen} closeMenu={() => setIsMobileMenuOpen(false)} />

      {/* Desktop TopNav */}
      {!isMobile && <TopNav />}

      <div className="px-4 md:px-8">
        <div className="flex items-center mt-8 md:mt-12 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl md:text-4xl font-bold text-secondary">
            Peta Penyebaran Penyaluran
          </h1>
        </div>

        {/* Map Section */}
        <div className="rounded-lg overflow-hidden shadow-md border h-[calc(100vh-200px)] md:h-[calc(100vh-250px)]">
          <MapSection />
        </div>
      </div>
    </div>
  );
}