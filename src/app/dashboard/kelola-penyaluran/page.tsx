"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainSidebar } from "@/components/main-sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Menu } from "lucide-react";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";

interface Penyaluran {
  id: number;
  tanggal: string;
  jumlah: number;
  catatan: string;
  status: string;
  mustahiq: {
    id: number;
    nama: string;
    NIK: string;
    alamat: string;
  };
  program: {
    id: number;
    nama_program: string;
  };
  creator: {
    id: number;
    nama: string;
  } | null;
  coa_debt: {
    kode: string;
    jenis_transaksi: string;
  };
  coa_cred: {
    kode: string;
    jenis_transaksi: string;
  };
}

export default function KelolaPenyaluranPage() {
  const router = useRouter();
  const [penyalurans, setPenyalurans] = useState<Penyaluran[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // const pathname = usePathname();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1600);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (overlayMessage) {
      const timeout = setTimeout(() => {
        setOverlayMessage(null);
      }, 10000); //10 detik
      return () => clearTimeout(timeout);
    }
  }, [overlayMessage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/penyaluran");
      const data = await res.json();
      setPenyalurans(data || []);
    } catch (error) {
      console.error("Error loading penyaluran:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (tanggal: string) => {
    return new Date(tanggal).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDelete = async (id: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (!confirm(`Yakin ingin menghapus penyaluran dengan ID ${id}?`)) return;
    try {
      const res = await fetch(`/api/penyaluran/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data");
      setPenyalurans(penyalurans.filter((p) => p.id !== id));
    } catch (err) {
      alert("Terjadi kesalahan saat menghapus penyaluran.");
      console.error(err);
    }
  };

  const handleRowClick = (id: number) => {
    router.push(`/dashboard/kelola-penyaluran/detail-penyaluran/${id}`);
  };

  const handleEdit = (id: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    router.push(`/dashboard/kelola-penyaluran/edit-penyaluran/${id}`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/penyaluran/eksport", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to export data");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "penyaluran-export.xlsx";
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

  // Show loading state
  setIsImporting(true);

  try {
    const response = await fetch("/api/penyaluran/import", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const result = await response.json();

    switch (response.status) {
      case 200:
        // Full success - refresh data
        setOverlayMessage({ 
          type: "success", 
          text: result.message || "Data penyaluran berhasil diimpor sepenuhnya!" 
        });
        // Refresh data setelah import berhasil
        await fetchData();
        setCurrentPage(1);
        break;

      case 207:
        setOverlayMessage({ 
          type: "warning", 
          text: `${result.message}\n${result.errors?.slice(0, 3).join('\n') || ''}${result.errors?.length > 3 ? '\n...dan lainnya' : ''}` 
        });
        await fetchData();
        setCurrentPage(1);
        break;

      case 400:
        if (result.summary && result.summary.success === 0) {
          setOverlayMessage({ 
            type: "error", 
            text: `${result.message}\n${result.errors?.slice(0, 3).join('\n') || ''}${result.errors?.length > 3 ? '\n...dan lainnya' : ''}` 
          });
        } else {
          setOverlayMessage({ 
            type: "error", 
            text: result.message || "Format file tidak valid atau data tidak lengkap." 
          });
        }
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

  // Pagination
  const itemsPerPage = 7;
  const totalPages = Math.ceil(penyalurans.length / itemsPerPage);

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return penyalurans.slice(startIndex, endIndex);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Mobile card component
  const PenyaluranCard = ({ item }: { item: Penyaluran }) => {
    return (
      <div
        className="mb-4 border rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:bg-gray-50"
        onClick={() => handleRowClick(item.id)}
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-gray-800">
              {item.mustahiq?.nama}
            </div>
            <div className="text-xs text-gray-500">ID: {item.id}</div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-sm">
            <div className="text-gray-500">NIK:</div>
            <div className="text-gray-800">{item.mustahiq?.NIK}</div>

            <div className="text-gray-500">Alamat:</div>
            <div className="text-gray-800">{item.mustahiq?.alamat}</div>

            <div className="text-gray-500">Program:</div>
            <div className="text-gray-800">{item.program?.nama_program}</div>

            <div className="text-gray-500">Tanggal:</div>
            <div className="text-gray-800">{formatDate(item.tanggal)}</div>

            <div className="text-gray-500">Jumlah:</div>
            <div className="text-gray-800">{item.jumlah}</div>

            <div className="text-gray-500">Status:</div>
            <div className="text-gray-800">{item.status}</div>

            <div className="text-gray-500">CoA Debet:</div>
            <div className="text-gray-800">{item.coa_debt.kode} - {item.coa_debt.jenis_transaksi}</div>

            <div className="text-gray-500">CoA Kredit:</div>
            <div className="text-gray-800">{item.coa_cred.kode} - {item.coa_cred.jenis_transaksi}</div>

            <div className="text-gray-500">Penginput:</div>
            <div className="text-gray-800">{item.creator?.nama || "-"}</div>
          </div>

          <div
            className="flex justify-end space-x-2 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              onClick={(e) => handleEdit(item.id, e)}
            >
              <Pencil size={16} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full text-red-600 hover:text-red-800 hover:bg-red-100"
              onClick={(e) => handleDelete(item.id, e)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

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
        <h1 className="text-xl font-bold text-[#FCB82E] ml-4">
          Kelola Penyaluran
        </h1>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        closeMenu={() => setIsMobileMenuOpen(false)}
      />

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:flex-none">
        <MainSidebar userRole="superadmin" />
      </div>

      <main className="flex-1">
        <div className="hidden md:block">
          <TopNav />
        </div>
          <div className={`${isMobile ? "p-4 pt-6" : "p-6"}`}>
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

            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-[#FCB82E] hidden md:block">
                Kelola Penyaluran
              </h1>

              <div className="flex gap-3 items-center">
                <Button
                  className={`rounded-md bg-[#07B0C8] hover:bg-[#07B0C8]/90 flex items-center gap-2 ${
                    isMobile ? "text-xs py-1 px-2 h-8" : ""
                  }`}
                  onClick={() =>
                    router.push("/dashboard/kelola-penyaluran/tambah-penyaluran")
                  }
                >
                  <Plus size={isMobile ? 14 : 18} />
                  <span className={isMobile ? "hidden sm:inline" : ""}>
                    Tambah Penyaluran
                  </span>
                  {isMobile && <span className="sm:hidden">Tambah</span>}
                </Button>


                <div className="relative">
                  <label
                    htmlFor="importFile"
                    className={`cursor-pointer inline-flex items-center justify-center gap-2 rounded-md transition-all shadow-md
                      ${isImporting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-[#07B0C8] hover:bg-[#059BB1] cursor-pointer'
                      } text-white
                      ${isMobile ? "text-xs h-8 px-2 min-w-[95px]" : "text-sm h-10 px-5 min-w-[120px]"}`}
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
                    ${isMobile ? "text-xs h-8 px-2 min-w-[95px]" : "text-sm h-10 px-5 min-w-[120px]"}`}
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className={isMobile ? "text-base" : "text-lg"}>
                Daftar Penyaluran
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!isMobile ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Mustahiq</TableHead>
                      <TableHead>NIK</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>COA Debet</TableHead>
                      <TableHead>COA Credit</TableHead>
                      <TableHead>Penginput</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-6">
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    ) : penyalurans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-6">
                          Tidak ada data penyaluran
                        </TableCell>
                      </TableRow>
                    ) : (
                      getCurrentPageItems().map((item) => (
                        <TableRow
                          key={item.id}
                          onClick={() => handleRowClick(item.id)}
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.mustahiq?.nama}</TableCell>
                          <TableCell>{item.mustahiq?.NIK}</TableCell>
                          <TableCell>{item.mustahiq?.alamat}</TableCell>
                          <TableCell>{item.program?.nama_program}</TableCell>
                          <TableCell>{formatDate(item.tanggal)}</TableCell>
                          <TableCell>{item.jumlah}</TableCell>
                          <TableCell>{item.status}</TableCell>
                          <TableCell title={item.coa_debt.jenis_transaksi}>
                            {item.coa_debt.kode}
                          </TableCell>
                          <TableCell title={item.coa_cred.jenis_transaksi}>
                            {item.coa_cred.kode}
                          </TableCell>
                          <TableCell>{item.creator?.nama || "-"}</TableCell>
                          <TableCell>
                            <div
                              className="flex space-x-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600"
                                onClick={(e) => handleEdit(item.id, e)}
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600"
                                onClick={(e) => handleDelete(item.id, e)}
                              >
                                <Trash2 size={16} />
                              </Button>
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
                  ) : penyalurans.length === 0 ? (
                    <div className="text-center py-4">
                      Tidak ada data penyaluran
                    </div>
                  ) : (
                    getCurrentPageItems().map((item) => (
                      <PenyaluranCard key={item.id} item={item} />
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination controls */}
          {penyalurans.length > 0 && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
              <div className={isMobile ? "text-xs" : ""}>
                Ditampilkan{" "}
                {penyalurans.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}
                -{Math.min(currentPage * itemsPerPage, penyalurans.length)} dari{" "}
                {penyalurans.length}
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
          )}
        </div>
      </main>
    </div>
  );
}
