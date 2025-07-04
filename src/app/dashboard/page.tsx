"use client"

import { TopNav } from "@/components/dashboard/top-nav";
import { Button } from "@/components/ui/button";
import { MapPin, Menu } from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MapSection from "@/components/map-section";
import { useEffect, useState } from 'react';

interface DashboardStats {
  mustahiqTerbantu: number;
  banyakProgram: number;
  mustahiqTersalurkan: number;
}

const MobileSidebar = ({ isOpen, closeMenu }: { isOpen: boolean; closeMenu: () => void }) => {
  const pathname = usePathname();
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
    {
      title: "Kelola Pengaturan",
      iconDefault: "/images/icon-pengaturan-w.svg", 
      iconActive: "/images/icon-pengaturan-t.svg",
      href: "/dashboard/kelola-pengaturan", 
      roles: ["amil", "superadmin"],
    }
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
                  className={`flex items-center w-full p-3 font-bold rounded-lg ${
                    pathname === item.href
                      ? "bg-white text-[#07B0C8]" // Selected state (white bg with teal text)
                      : "text-white hover:bg-white hover:bg-opacity-20" // Default state (white text with semi-transparent hover)
                  }`}
                >
                  <img
                    src={pathname === item.href ? item.iconActive : item.iconDefault}
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

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    mustahiqTerbantu: 0,
    banyakProgram: 0,
    mustahiqTersalurkan: 0
  });
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigation = () => {
    router.push('/map');
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user data
        const userResponse = await fetch('/api/auth/user');
        if (!userResponse.ok) throw new Error('Failed to fetch user data');
        const userData = await userResponse.json();
        setUserName(userData.nama);

        // Fetch programs data
        const programsResponse = await fetch('/api/program');
        if (!programsResponse.ok) throw new Error('Failed to fetch programs data');
        const programsData = await programsResponse.json();
        
        // Fetch mustahiq data
        const mustahiqResponse = await fetch('/api/mustahiq');
        if (!mustahiqResponse.ok) throw new Error('Failed to fetch mustahiq data');
        const mustahiqData = await mustahiqResponse.json();
        
        // Fetch penyaluran data
        const penyaluranResponse = await fetch('/api/penyaluran');
        if (!penyaluranResponse.ok) throw new Error('Failed to fetch penyaluran data');
        const penyaluranData = await penyaluranResponse.json();
        
        // Calculate stats
        const currentYear = new Date().getFullYear();
        const currentYearPenyaluran = penyaluranData.filter((item: any) => {
          const itemDate = new Date(item.tanggal);
          return itemDate.getFullYear() === currentYear;
        });
        
        const uniqueMustahiqIds = new Set(
          penyaluranData.map((item: any) => item.mustahiq_id)
        );
        
        setStats({
          mustahiqTerbantu: mustahiqData.length,
          banyakProgram: programsData.length,
          mustahiqTersalurkan: currentYearPenyaluran.length
        });

      } catch (error) {
        console.error('Error fetching data:', error);
        // Using browser's built-in alert instead of toast
        alert("Error: Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-0">
        {!isMobile && <TopNav />}
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
            <h1 className="text-xl font-bold text-[#FCB82E] ml-4">Home</h1>
          </div>
        )}
        <div className="px-4 md:px-8">
          <div className="mt-8 md:mt-12 flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b2c2]"></div>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-[#FCB82E] ml-4">Home</h1>
        </div>
      )}

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={isMobileMenuOpen} closeMenu={() => setIsMobileMenuOpen(false)} />

      {/* Desktop TopNav */}
      {!isMobile && <TopNav />}

      <div className="px-4 md:px-8">
        <h1 className="mt-8 md:mt-12 text-2xl md:text-4xl font-bold text-secondary">
          Selamat Datang, {userName}!
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
          {/* Jumlah Mustahiq Terbantu */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg">Jumlah Mustahiq Terbantu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {stats.mustahiqTerbantu.toLocaleString()}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
                Total penerima manfaat
              </p>
            </CardContent>
          </Card>

          {/* Banyak Program */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg">Banyak Program</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-success">
                {stats.banyakProgram}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
                Program aktif saat ini
              </p>
            </CardContent>
          </Card>

          {/* Mustahiq Tersalurkan */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg">Mustahiq Tersalurkan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-[#FCB82E]">
                {stats.mustahiqTersalurkan.toLocaleString()}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
                Tahun ini
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Map Section */}
        <div className="mt-8 md:mt-12">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2 md:gap-0">
            <p className="text-xl md:text-3xl font-bold text-secondary">
              Penyebaran Penyaluran
            </p>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full md:w-auto"
              onClick={handleNavigation}
            >
              <MapPin size={16} />
              Lihat Peta Lengkap
            </Button>
          </div>
          
          <div className="rounded-lg overflow-hidden shadow-md border h-[300px] md:h-[400px]">
            <MapSection />
          </div>
        </div>
      </div>

      <div className="relative mt-8">
        <div className="absolute inset-x-0 bottom-0 -z-10 opacity-30 flex justify-end items-end">
          <div className="h-32 w-32 md:h-64 md:w-64 rounded-full bg-secondary"></div>
          <div className="absolute top-[-2.5rem] left-[-2.5rem] h-32 w-32 md:h-64 md:w-64 rounded-full bg-primary"></div>
          <div className="absolute top-[-5rem] left-[2.5rem] h-32 w-32 md:h-64 md:w-64 rounded-full bg-success"></div>
        </div>
      </div>
    </div>
  );
}