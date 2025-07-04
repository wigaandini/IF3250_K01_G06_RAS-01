"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainSidebar } from "@/components/main-sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import CoaSection from "@/components/dashboard/pengaturan/coa-section";
import WilayahTabsPage from "@/components/dashboard/pengaturan/wilayah-tab";

// const tabs = ["Wilayah", "CoA"] as const;
const tabs = ["CoA"] as const;
type TabKey = typeof tabs[number];

const MobileSidebar = ({ isOpen, closeMenu }: { isOpen: boolean; closeMenu: () => void }) => {
  const router = useRouter();
  return (
    <div
      className={`fixed inset-0 z-50 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:hidden transition-transform duration-300 ease-in-out`}
    >
      <div className="relative w-80 max-w-[80%] h-full bg-gradient-to-b from-[#FCB82E] to-[#07B0C8] shadow-xl">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-white">Menu</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => {
                  router.push("/dashboard");
                  closeMenu();
                }}
                className="flex items-center w-full p-3 font-bold rounded-lg text-white hover:bg-white hover:bg-opacity-20"
              >
                <span>Dashboard</span>
              </button>
            </li>
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function KelolaPengaturanPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("CoA");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F5F7FB]">
      {/* Mobile Menu Header */}
      <div className="md:hidden flex items-center p-4 bg-white border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          className="hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-[#FCB82E] ml-4">Kelola Pengaturan</h1>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={isMobileMenuOpen} closeMenu={() => setIsMobileMenuOpen(false)} />

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:flex-none">
        <MainSidebar userRole="superadmin" />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="hidden md:block">
          <TopNav />
        </div>
        <div className={`${isMobile ? "p-4 pt-4" : "p-6"}`}>
          <h1 className="text-3xl font-bold text-[#FCB82E] hidden md:block mb-4 -mt-2">Kelola Pengaturan</h1>

          {/* Tab */}
          <div className="flex space-x-6 border-b border-gray-200 mb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={cn(
                  "pb-2 text-sm font-semibold transition-colors",
                  activeTab === tab
                    ? "text-[#FCB82E] border-b-2 border-[#FCB82E]"
                    : "text-gray-500 hover:text-[#FCB82E]"
                )}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          {/* {activeTab === "Wilayah" && <WilayahTabsPage />} */}
          {activeTab === "CoA" && <CoaSection />}
        </div>
      </main>
    </div>
  );
}

// Placeholder
// function WilayahSection() {
//   return <div className="bg-white rounded-lg p-4 shadow">Daftar Wilayah akan ditampilkan di sini.</div>;
// }

// function CoaSection() {
//   return <div className="bg-white rounded-lg p-4 shadow">Daftar CoA akan ditampilkan di sini.</div>;
// }
