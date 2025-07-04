"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainSidebar } from "@/components/main-sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Pencil, Trash2, Plus } from "lucide-react"
import { TopNav } from "@/components/dashboard/top-nav"
import { Menu } from "lucide-react"; 
import { usePathname } from "next/navigation";
import { menuItems } from "@/lib/constants"
import Image from "next/image"
import { Upload, Download } from "lucide-react";

interface Mustahiq {
  id: number
  nama: string
  no_ktp: string
  alamat: string
  kategori_mustahiq: string
  no_hp: string
  tanggal_input: string
  nama_penginput: string
}

type ToastType = "success" | "error";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
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
                    <Image
                      src={pathname === item.href ? item.iconActive : item.iconDefault}
                      alt={item.title}
                      width={20}
                      height={20}
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

export default function KelolaMustahiq() {
  const router = useRouter()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingMustahiq, setEditingMustahiq] = useState<Mustahiq | null>(null)
  const [mustahiqs, setMustahiqs] = useState<Mustahiq[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [overlayMessage, setOverlayMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);


  // Check if the screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkIfMobile()
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  useEffect(() => {
    if (overlayMessage) {
      const timeout = setTimeout(() => {
        setOverlayMessage(null);
      }, 10000); //10 detik
      return () => clearTimeout(timeout);
    }
  }, [overlayMessage]);


  const fetchMustahiqs = async () => {
    setLoading(true);
    try {
      const userRes = await fetch("/api/auth/user", { credentials: 'include' });
      if (!userRes.ok) throw new Error('Failed to fetch user data');
      
      const userData = await userRes.json();
      if (userData?.nama) {
        setCurrentUser(userData);
      }
      
      const usersRes = await fetch("/api/users", { credentials: 'include' });
      if (!usersRes.ok) throw new Error("Failed to fetch all user data");
      
      const usersData = await usersRes.json();
      const usersMap = Object.fromEntries(usersData.map((u: any) => [u.id, u.nama]));
  
      const mustahiqsRes = await fetch("/api/mustahiq", { credentials: 'include' });
      if (!mustahiqsRes.ok) throw new Error('Failed to fetch mustahiq data');
      
      const mustahiqsData = await mustahiqsRes.json();
      const mappedMustahiqs = mustahiqsData.map((mustahiq: any) => {
        const categories = mustahiq.asnafs?.map((asnaf: any) => 
          asnaf.asnaf?.type
            ? asnaf.asnaf.type.toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            : null
        ).filter(Boolean) || [];
      
        return {
          id: mustahiq.id,
          nama: mustahiq.nama,
          no_ktp: mustahiq.NIK,
          alamat: mustahiq.alamat,  
          kategori_mustahiq: categories.length > 0 
            ? categories.join(', ') 
            : "Belum ditentukan",
          no_hp: mustahiq.no_telepon,
          tanggal_input: mustahiq.created_at, 
          nama_penginput: usersMap[mustahiq.created_by] || "-",
        }
      })

      setMustahiqs(mappedMustahiqs);
    } catch (error) {
      console.error("Error fetching mustahiqs:", error);
      setError("Failed to load data: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }  

  useEffect(() => {
    fetchMustahiqs()
  }, [])

  const mustahiqsPerPage = 7
  const totalPages = Math.ceil(mustahiqs.length / mustahiqsPerPage)

  const getCurrentPageMustahiqs = () => {
    const safeArray = Array.isArray(mustahiqs) ? mustahiqs : [];
    const startIndex = (currentPage - 1) * mustahiqsPerPage
    const endIndex = startIndex + mustahiqsPerPage
    
    return safeArray
      .sort((a, b) => a.id - b.id)
      .slice(startIndex, endIndex)
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleRowClick = (id: number) => {
    router.push(`/dashboard/kelola-mustahiq/detail-mustahiq/${id}`);
  };
  
  const handleAddMustahiq = () => {
    router.push("/dashboard/kelola-mustahiq/tambah-mustahiq")
  }

  const handleEditMustahiq = (mustahiq: Mustahiq) => {
    router.push(`/dashboard/kelola-mustahiq/edit-mustahiq/${mustahiq.id}`);
  }

  const handleDeleteMustahiq = async (id: number) => {
    try {
      const response = await fetch(`/api/mustahiq/${id}`, {
        method: "DELETE",
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete mustahiq')
      }

      fetchMustahiqs()
      setIsDeleteModalOpen(false)
      setError(null)
    } catch (error) {
      console.error("Error deleting mustahiq:", error)
      setError((error as Error).message)
    }
  }


  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/mustahiq/eksport", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to export data");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "mustahiq-export.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setIsExporting(false);
      setOverlayMessage({ type: "success", text: "Export berhasil! File telah diunduh." });
    } catch (error) {
      setIsExporting(false);
      console.error("Export error:", error);
      setOverlayMessage({ type: "error", text: "Gagal melakukan export data. Silakan coba lagi." });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsImporting(true);
    
    try {
      const response = await fetch("/api/mustahiq/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      // Handle berbagai status code
      switch (response.status) {
        case 200:
          // Semua data berhasil diimport
          setOverlayMessage({ 
            type: "success", 
            text: result.message 
          });
          await fetchMustahiqs();
          setCurrentPage(1);
          break;

        case 207:
          // Mixed results - sebagian berhasil, sebagian gagal
          const detailMessage = result.details.errors.length > 0 
            ? `${result.message}\n\nError pertama: ${result.details.errors[0]}` 
            : result.message;
          
          setOverlayMessage({ 
            type: "warning", // atau "info" jika ada tipe warning
            text: detailMessage
          });
          await fetchMustahiqs();
          setCurrentPage(1);
          break;

        case 400:
          let errorMessage = result.message;
          
          if (result.details?.errors && result.details.errors.length > 0) {
            errorMessage += `\n\nDetail error:\n${result.details.errors.slice(0, 3).join('\n')}`;
            if (result.details.errors.length > 3) {
              errorMessage += `\n... dan ${result.details.errors.length - 3} error lainnya`;
            }
          }
          
          setOverlayMessage({ 
            type: "error", 
            text: errorMessage 
          });
          break;

        case 401:
          // Unauthorized
          setOverlayMessage({ 
            type: "error", 
            text: result.message || "Sesi Anda telah berakhir. Silakan login kembali." 
          });
          break;

        case 500:
          setOverlayMessage({ 
            type: "error", 
            text: result.message || "Terjadi kesalahan server. Silakan coba lagi atau hubungi administrator." 
          });
          break;

        default:
          setOverlayMessage({ 
            type: "error", 
            text: result.message || "Terjadi kesalahan yang tidak diketahui." 
          });
          break;
      }

      // Reset file input hanya jika berhasil (200) atau sebagian berhasil (207)
      if (response.status === 200 || response.status === 207) {
        event.target.value = "";
      }
      
      setIsImporting(false);

    } catch (error) {
      setIsImporting(false);
      console.error("Import error:", error);
      setOverlayMessage({ 
        type: "error", 
        text: "Gagal terhubung ke server. Periksa koneksi internet Anda." 
      });

      event.target.value = "";
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return new Date(dateString).toLocaleDateString("id-ID", options)
  }

  const canDelete = currentUser?.role === "amil" || currentUser?.role === "kepala_program" || currentUser?.role === "superadmin"

  // Mobile card view component
  const MustahiqCard = ({ mustahiq }: { mustahiq: Mustahiq }) => {
    return (
      <div 
        className="mb-4 border rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:bg-gray-50"
        onClick={() => handleRowClick(mustahiq.id)}
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-gray-800">{mustahiq.nama}</div>
            <div className="text-xs text-gray-500">ID: {mustahiq.id}</div>
          </div>
          
          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-sm">
            <div className="text-gray-500">No KTP:</div>
            <div className="text-gray-800">{mustahiq.no_ktp}</div>
            
            <div className="text-gray-500">Alamat:</div>
            <div className="text-gray-800">{mustahiq.alamat}</div>
            
            <div className="text-gray-500">Kategori:</div>
            <div className="text-gray-800">{mustahiq.kategori_mustahiq}</div>
            
            <div className="text-gray-500">No HP:</div>
            <div className="text-gray-800">{mustahiq.no_hp}</div>
            
            <div className="text-gray-500">Tanggal Input:</div>
            <div className="text-gray-800">{formatDate(mustahiq.tanggal_input)}</div>
            
            <div className="text-gray-500">Penginput:</div>
            <div className="text-gray-800">{mustahiq.nama_penginput}</div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              onClick={() => handleEditMustahiq(mustahiq)}
            >
              <Pencil size={16} />
            </Button>
            
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full text-red-600 hover:text-red-800 hover:bg-red-100"
                onClick={() => {
                  setEditingMustahiq(mustahiq)
                  setIsDeleteModalOpen(true)
                }}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F5F7FB]">
      {/* Mobile menu button and header */}
      <div className="md:hidden flex items-center p-4 bg-white border-b">
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
        <h1 className="text-xl font-bold text-[#FCB82E] ml-4">Kelola Mustahiq</h1>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={isMobileMenuOpen} closeMenu={() => setIsMobileMenuOpen(false)} />

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:flex-none">
        <MainSidebar userRole={currentUser?.role || "superadmin"} />
      </div>
      <main className="flex-1 overflow-auto">
        <div className="hidden md:block">
          <TopNav />
        </div>

        <div className={`${isMobile ? 'p-4 pt-6' : 'p-6'} relative`}>
          {overlayMessage && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg shadow-md transition-all duration-300 w-full max-w-md
                  ${overlayMessage.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                  }`}
              >
                <span className="text-xl">
                  {overlayMessage.type === "success" ? "✅" : "❌"}
                </span>
                <span className="text-sm font-medium">{overlayMessage.text}</span>
                <button
                  onClick={() => setOverlayMessage(null)}
                  className="ml-auto text-lg font-bold text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#FCB82E]">Kelola Mustahiq</h1>

            
            <div className="flex gap-3">
              <div className="relative">
                <label
                  htmlFor="importFile"
                  className={`cursor-pointer inline-flex items-center justify-center gap-2 rounded-md transition-all shadow-md
                    ${isImporting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#07B0C8] hover:bg-[#059BB1] cursor-pointer'
                    } text-white
                    ${isMobile ? "text-xs h-7 px-2 min-w-[100px]" : "text-sm h-10 px-5 min-w-[120px]"}`}
                  aria-label="Import Penyaluran"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={isMobile ? 10 : 14} />
                      <span>Import</span>
                    </>
                  )}
                </label>
                <input
                  type="file"
                  id="importFile"
                  accept=".xls,.xlsx"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="hidden"
                />
              </div>

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className={`inline-flex items-center justify-center gap-2 rounded-md transition-all shadow-md
                  ${isExporting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#07B0C8] hover:bg-[#059BB1]'
                  } text-white
                  ${isMobile ? "text-xs h-7 px-2 min-w-[100px]" : "text-sm h-10 px-5 min-w-[120px]"}`}
                aria-label="Export Penyaluran"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download size={isMobile ? 10 : 14} />
                    <span>Export</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className={isMobile ? "text-base" : "text-lg"}>Daftar Mustahiq</CardTitle>
                <Button
                  className={`rounded-md bg-[#07B0C8] hover:bg-[#07B0C8]/90 flex items-center gap-2 ${
                    isMobile ? "text-xs py-1 px-2 h-8" : ""
                  }`}
                  onClick={handleAddMustahiq}
                >
                  <Plus size={isMobile ? 14 : 18} />
                  <span className={isMobile ? "hidden sm:inline" : ""}>Tambah Mustahiq</span>
                  {isMobile && <span className="sm:hidden">Tambah</span>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!isMobile ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>NAMA</TableHead>
                      <TableHead>NO KTP</TableHead>
                      <TableHead>ALAMAT</TableHead>
                      <TableHead>KATEGORI</TableHead>
                      <TableHead>NO HP</TableHead>
                      <TableHead>TANGGAL INPUT</TableHead>
                      <TableHead>PENGINPUT</TableHead>
                      <TableHead className="w-[100px]">AKSI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">Memuat data...</TableCell>
                      </TableRow>
                    ) : getCurrentPageMustahiqs().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">Tidak ada data mustahiq</TableCell>
                      </TableRow>
                    ) : (
                      getCurrentPageMustahiqs().map((mustahiq) => (
                        <TableRow 
                          key={mustahiq.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleRowClick(mustahiq.id)}
                        >
                          <TableCell>{mustahiq.id}</TableCell>
                          <TableCell>{mustahiq.nama}</TableCell>
                          <TableCell>{mustahiq.no_ktp}</TableCell>
                          <TableCell>{mustahiq.alamat}</TableCell>
                          <TableCell>{mustahiq.kategori_mustahiq}</TableCell>
                          <TableCell>{mustahiq.no_hp}</TableCell>
                          <TableCell>{formatDate(mustahiq.tanggal_input)}</TableCell>
                          <TableCell>{mustahiq.nama_penginput}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-800"
                                onClick={() => handleEditMustahiq(mustahiq)}
                              >
                                <Pencil size={16} />
                              </Button>
                              
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-800"
                                  onClick={() => {
                                    setEditingMustahiq(mustahiq)
                                    setIsDeleteModalOpen(true)
                                  }}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-4">
                  {loading ? (
                    <div className="text-center py-4">Memuat data...</div>
                  ) : getCurrentPageMustahiqs().length === 0 ? (
                    <div className="text-center py-4">Tidak ada data mustahiq</div>
                  ) : (
                    getCurrentPageMustahiqs().map((mustahiq) => (
                      <MustahiqCard key={mustahiq.id} mustahiq={mustahiq} />
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <div className={isMobile ? "text-xs" : ""}>
              Ditampilkan {mustahiqs.length === 0 ? 0 : (currentPage - 1) * mustahiqsPerPage + 1}-
              {Math.min(currentPage * mustahiqsPerPage, mustahiqs.length)} dari {mustahiqs.length}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                &lt;
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                &gt;
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="w-[90vw] max-w-[425px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className={isMobile ? "text-lg" : ""}>Konfirmasi Hapus</DialogTitle>
            <DialogDescription className={isMobile ? "text-sm" : ""}>
              Apakah Anda yakin ingin menghapus mustahiq {editingMustahiq?.nama} (ID: {editingMustahiq?.id})?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="block flex-col space-y-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className={`w-full ${isMobile ? "text-xs py-1 h-8" : ""}`}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              className={`w-full bg-red-600 hover:bg-red-600/90 ${isMobile ? "text-xs py-1 h-8" : ""}`}
              onClick={() => editingMustahiq && handleDeleteMustahiq(editingMustahiq.id)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


