"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MainSidebar } from "@/components/main-sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Plus, Trash2, Menu } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToastStore } from "@/lib/toast-store";
import { menuItems } from "@/lib/constants";

interface Program {
  id: number;
  nama_program: string;
  bidang_kategori: string;
  status: string | null;
  jumlah_bantuan?: number;
  jumlah_mustahiq_dibantu?: number;
}

const MobileSidebar = ({ isOpen, closeMenu }: { isOpen: boolean; closeMenu: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();

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

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToastStore();

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await fetch("/api/program");
        const raw = await res.json();
        const transformed = raw.map((item: any) => ({
          id: item.id,
          nama_program: item.nama_program,
          bidang_kategori: item.bidang_kategori,
          status: item.status,
          jumlah_bantuan: item.jumlah_bantuan,
          jumlah_mustahiq_dibantu: item.jumlah_mustahiq_dibantu,
        }));
        
        setPrograms(transformed);
      } catch (error) {
        console.error("Failed to fetch programs:", error);
        showToast("Gagal memuat daftar program.", "error");
      }
    };
    fetchPrograms();
  }, [showToast]);

  const openDeleteDialog = (id: number) => {
    setProgramToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (programToDelete === null) return;

    try {
      const response = await fetch(`/api/program/${programToDelete}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPrograms(programs.filter(p => p.id !== programToDelete));
        showToast("Program berhasil dihapus.", "success");
      } else {
        console.error("Failed to delete program");
        showToast("Gagal menghapus program.", "error");
      }
    } catch (error) {
      console.error("Error deleting program:", error);
      showToast("Terjadi kesalahan saat menghapus program.", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setProgramToDelete(null);
    }
  };

  const handleAddNavigation = () => {
    router.push(`${pathname}/tambah-program`);
  };

  const navigateToDetail = (programId: number) => {
    router.push(`${pathname}/detail-program/${programId}`);
  };

  const navigateToEdit = (programId: number) => {
    router.push(`${pathname}/edit-program/${programId}`);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const renderProgramCard = (program: Program) => (
    <Card
      key={program.id}
      className="min-w-[280px] w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-16px)] cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigateToDetail(program.id)}
    >
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-semibold text-[#333]">{program.nama_program}</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Kategori: {program.bidang_kategori.charAt(0).toUpperCase() + program.bidang_kategori.slice(1)}<br />
          Mustahiq Dibantu: {program.jumlah_mustahiq_dibantu ?? "-"} orang
        </p>
      </CardHeader>
      <CardContent className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-blue-500 hover:text-blue-700"
          onClick={(e) => {
            e.stopPropagation();
            navigateToEdit(program.id);
          }}
        >
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation();
            openDeleteDialog(program.id);
          }}
        >
          <Trash2 size={16} />
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F5F7FB]">
      {/* Mobile menu button and header */}
      <div className="md:hidden flex items-center p-4 bg-white border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          className="hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-[#FCB82E] ml-4">Kelola Program</h1>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={isMobileMenuOpen} closeMenu={() => setIsMobileMenuOpen(false)} />

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:flex-none">
        <MainSidebar userRole="superadmin" />
      </div>

      <main className="flex-1 overflow-auto">
        <div className="hidden md:block">
          <TopNav />
        </div>
        
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-[#FCB82E] hidden md:block">Kelola Program</h1>
            <Button 
              onClick={handleAddNavigation} 
              className="bg-[#07B0C8] hover:bg-[#07B0C8]/90 mt-2 md:mt-0 w-full md:w-auto"
            >
              <Plus className="mr-2" size={16} />
              Tambah Program
            </Button>
          </div>

          <section className="mb-6">
            <h2 className="text-lg md:text-xl font-semibold mb-2">Program Aktif</h2>
            <div className="flex flex-wrap gap-4">
              {programs.filter(p => p.status === "active").map(renderProgramCard)}
              {programs.filter(p => p.status === "active").length === 0 && (
                <p className="text-gray-500 italic">Tidak ada program aktif</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-semibold mb-2">Program Non-aktif</h2>
            <div className="flex flex-wrap gap-4">
              {programs.filter(p => p.status === "inactive").map(renderProgramCard)}
              {programs.filter(p => p.status === "inactive").length === 0 && (
                <p className="text-gray-500 italic">Tidak ada program non-aktif</p>
              )}
            </div>
          </section>
        </div>
      </main>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90%] md:max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Program</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus program ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-2 sm:mt-0">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-500 hover:bg-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}