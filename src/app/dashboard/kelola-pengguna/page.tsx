"use client";
import React, { useState, useEffect } from "react";
import { MainSidebar } from "@/components/main-sidebar";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, MapPin, AlertCircle, Upload, Download } from "lucide-react";
import { TopNav } from "@/components/dashboard/top-nav";
import { Menu } from "lucide-react"; 
import { usePathname, useRouter } from "next/navigation"; 
import { menuItems } from "@/lib/constants";

interface User {
  id: number;
  nama: string;
  email: string;
  no_telp: string;
  role: "amil" | "relawan" | "superadmin";
  alamat: string;
  password: string;
}

const MobileSidebar = ({
  isOpen,
  closeMenu,
}: {
  isOpen: boolean;
  closeMenu: () => void;
}) => {
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
                    src={
                      pathname === item.href
                        ? item.iconActive
                        : item.iconDefault
                    }
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

export default function KelolaPengguna() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [newUser, setNewUser] = useState({
    nama: "",
    role: "amil" as "amil" | "relawan",
    email: "",
    no_telp: "",
    alamat: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({
    nama: "",
    email: "",
    no_telp: "",
    alamat: "",
    password: "",
  });
  const [isMobile, setIsMobile] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check if the screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    if (overlayMessage) {
      const timeout = setTimeout(() => {
        setOverlayMessage(null);
      }, 10000); //10 detik
      return () => clearTimeout(timeout);
    }
  }, [overlayMessage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [userRes, usersRes] = await Promise.all([
        fetch("/api/auth/user"),
        fetch("/api/users"),
      ]);
      const userData = await userRes.json();
      const usersData = await usersRes.json();
      if (userData?.role) {
        setCurrentUser(userData);
      }
      const filteredUsers = usersData.filter(
        (user: User) => user.role !== "superadmin"
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const usersPerPage = 6;
  const totalPages = Math.ceil(users.length / usersPerPage);

  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return users
      .slice()
      .sort((a, b) => a.id - b.id)
      .slice(startIndex, endIndex);
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

  const validateEmail = (email: string) => {
    if (!email) return "Email tidak boleh kosong";
    if (!email.endsWith("@rumahamal.org"))
      return "Email harus berakhiran @rumahamal.org";
    return "";
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return "Nomor telepon tidak boleh kosong";
    if (!/^\d+$/.test(phone)) return "Nomor telepon hanya boleh angka";
    if (phone.length < 11 || phone.length > 13)
      return "Nomor telepon harus 11-13 digit";
    return "";
  };

  const validateForm = (
    user: User | typeof newUser,
    isEdit: boolean = false
  ) => {
    if (
      user.role !== "amil" &&
      user.role !== "relawan" &&
      user.role !== "superadmin"
    ) {
      return false;
    }
    const errors = {
      nama: user.nama ? "" : "Nama tidak boleh kosong",
      email: validateEmail(user.email),
      no_telp: validatePhoneNumber(user.no_telp),
      alamat: user.alamat ? "" : "Alamat tidak boleh kosong",
      password: !isEdit && !user.password ? "Password tidak boleh kosong" : "",
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        [name]: value,
      });

      // Clear error for the field being edited
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    } else {
      setNewUser((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear error for the field being edited
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const handleRoleChange = (value: string) => {
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        role: value as "amil" | "relawan",
      });
    } else {
      setNewUser({
        ...newUser,
        role: value as "amil" | "relawan",
      });
    }
  };

  const handleAddUser = async () => {
    if (!validateForm(newUser)) {
      return;
    }
    try {
      const userToAdd = {
        ...newUser,
        role: newUser.role.toLowerCase(),
      };
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userToAdd),
      });
      if (response.ok) {
        fetchUsers();
        setIsModalOpen(false);
        setNewUser({
          nama: "",
          role: "amil",
          email: "",
          password: "",
          no_telp: "",
          alamat: "",
        });
        setFormErrors({
          nama: "",
          email: "",
          no_telp: "",
          alamat: "",
          password: "",
        });
      } else {
        alert("Gagal menambah pengguna");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Terjadi kesalahan saat menambahkan pengguna.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (!validateForm(editingUser, true)) {
      return;
    }
    try {
      const userToUpdate = {
        ...editingUser,
        role: editingUser.role.toLowerCase(),
      };
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userToUpdate),
      });
      if (response.ok) {
        fetchUsers();
        setIsEditModalOpen(false);
        setEditingUser(null);
        setFormErrors({
          nama: "",
          email: "",
          no_telp: "",
          alamat: "",
          password: "",
        });
      } else {
        alert("Gagal mengupdate pengguna");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Terjadi kesalahan saat mengupdate pengguna.");
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchUsers();
        setIsDeleteModalOpen(false);
      } else {
        alert("Gagal menghapus pengguna");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Gagal menghapus pengguna");
    }
  };

  const handleExport = async () => {
      setIsExporting(true);
      try {
        const response = await fetch("/api/users/eksport", {
          method: "GET",
          credentials: "include",
        });
  
        if (!response.ok) throw new Error("Failed to export data");
  
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
  
        const a = document.createElement("a");
        a.href = url;
        a.download = "pengguna-export.xlsx";
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
        const response = await fetch("/api/users/import", {
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
            await fetchUsers();
            setCurrentPage(1);
            break;

          case 207:
            let warningMessage = result.message;
            
            if (result.errors && result.errors.length > 0) {
              warningMessage += `\n\nContoh error:\n${result.errors.slice(0, 3).join('\n')}`;
              if (result.errors.length > 3) {
                warningMessage += `\n... dan ${result.errors.length - 3} error lainnya`;
              }
            }
            
            
            setOverlayMessage({ 
              type: "warning", 
              text: warningMessage
            });
            await fetchUsers();
            setCurrentPage(1);
            break;

          case 400:
            let errorMessage = result.message;
            
            if (result.errors && result.errors.length > 0) {
              errorMessage += `\n\nDetail error:\n${result.errors.slice(0, 3).join('\n')}`;
              if (result.errors.length > 3) {
                errorMessage += `\n... dan ${result.errors.length - 3} error lainnya`;
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

  // Mobile card view component
  const UserCard = ({ user }: { user: User }) => {
    return (
      <div className="mb-4 border rounded-lg p-4 bg-white shadow-sm">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-gray-800">{user.nama}</div>
            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
              {user.role.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-2 text-sm">
            <div className="text-gray-500">Email:</div>
            <div className="text-gray-800">{user.email}</div>

            <div className="text-gray-500">No Telp:</div>
            <div className="text-gray-800">{user.no_telp}</div>

            <div className="text-gray-500">Alamat:</div>
            <div className="text-gray-800">{user.alamat}</div>

            <div className="text-gray-500">ID:</div>
            <div className="text-gray-800">{user.id}</div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              onClick={() => {
                setEditingUser({
                  ...user,
                  password: "",
                });
                setIsEditModalOpen(true);
                setFormErrors({
                  nama: "",
                  email: "",
                  no_telp: "",
                  alamat: "",
                  password: "",
                });
              }}
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full text-red-600 hover:text-red-800 hover:bg-red-100"
              onClick={() => {
                setEditingUser(user);
                setIsDeleteModalOpen(true);
              }}
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
          Kelola Pengguna
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

      <main className="flex-1 overflow-auto">
        <div className="hidden md:block">
          <TopNav />
        </div>

        <div className={`p-4 ${isMobile ? "pt-6" : "p-6"}`}>
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
            <h1 className="text-3xl font-bold text-[#FCB82E]">Kelola Pengguna</h1>

            
            <div className="flex gap-3">
              <div className="relative">
                <label
                  htmlFor="importFile"
                  className={`cursor-pointer inline-flex items-center justify-center gap-2 rounded-md transition-all shadow-md
                    ${isImporting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#07B0C8] hover:bg-[#059BB1] cursor-pointer'
                    } text-white
                    ${isMobile ? "text-xs h-7 px-2 min-w-[95px]" : "text-sm h-10 px-5 min-w-[120px]"}`}
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
                  ${isMobile ? "text-xs h-7 px-2 min-w-[95px]" : "text-sm h-10 px-5 min-w-[120px]"}`}
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

          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className={isMobile ? "text-base" : "text-lg"}>
                  Daftar Pengguna
                </CardTitle>
                <Button
                  className={`rounded-md bg-[#07B0C8] hover:bg-[#07B0C8]/90 flex items-center gap-2 ${
                    isMobile ? "text-xs py-1 px-2 h-8" : ""
                  }`}
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus size={isMobile ? 14 : 18} />
                  <span className={isMobile ? "hidden sm:inline" : ""}>
                    Tambah Pengguna
                  </span>
                  {isMobile && <span className="sm:hidden">Tambah</span>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!isMobile ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>NAMA</TableHead>
                      <TableHead>EMAIL</TableHead>
                      <TableHead>NO TELP</TableHead>
                      <TableHead>ALAMAT</TableHead>
                      <TableHead>PERAN</TableHead>
                      <TableHead className="w-[100px]">AKSI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageUsers().map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.nama}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.no_telp}</TableCell>
                        <TableCell>{user.alamat}</TableCell>
                        <TableCell>{user.role.toUpperCase()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-800"
                              onClick={() => {
                                setEditingUser({
                                  ...user,
                                  password: "",
                                });
                                setIsEditModalOpen(true);
                                setFormErrors({
                                  nama: "",
                                  email: "",
                                  no_telp: "",
                                  alamat: "",
                                  password: "",
                                });
                              }}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-800"
                              onClick={() => {
                                setEditingUser(user);
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-4">
                  {getCurrentPageUsers().map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <div className={isMobile ? "text-xs" : ""}>
              Ditampilkan {(currentPage - 1) * usersPerPage + 1}-
              {Math.min(currentPage * usersPerPage, users.length)} dari{" "}
              {users.length}
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

      {/* Add User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[90vw] max-w-[425px] p-4 sm:p-6">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="bg-[#07B0C8] rounded-full p-2 text-white">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                    fill="white"
                  />
                </svg>
              </div>
              <div>
                <DialogTitle className={isMobile ? "text-lg" : ""}>
                  Tambah Pengguna
                </DialogTitle>
                <DialogDescription className={isMobile ? "text-sm" : ""}>
                  Tambah pengguna baru sebagai amil ataupun relawan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <div className="space-y-1">
              <Label
                htmlFor="name"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Nama<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="nama"
                placeholder="Masukkan nama pengguna"
                value={newUser.nama}
                onChange={handleInputChange}
                className={`${formErrors.nama ? "border-red-500" : ""} ${
                  isMobile ? "text-xs h-8" : ""
                }`}
              />
              {formErrors.nama && (
                <p
                  className={`text-red-500 flex items-center gap-1 ${
                    isMobile ? "text-[10px]" : "text-xs"
                  }`}
                >
                  <AlertCircle size={isMobile ? 10 : 12} />
                  {formErrors.nama}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="role"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Peran<span className="text-red-500">*</span>
              </Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => handleRoleChange(value)}
              >
                <SelectTrigger className={isMobile ? "text-xs h-8" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isMobile ? "text-xs" : ""}>
                  <SelectItem value="amil">AMIL</SelectItem>
                  <SelectItem value="relawan">RELAWAN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="email"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Email<span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Masukkan alamat email pengguna"
                value={newUser.email}
                onChange={handleInputChange}
                className={`${formErrors.email ? "border-red-500" : ""} ${
                  isMobile ? "text-xs h-8" : ""
                }`}
              />
              {formErrors.email && (
                <p
                  className={`text-red-500 flex items-center gap-1 ${
                    isMobile ? "text-[10px]" : "text-xs"
                  }`}
                >
                  <AlertCircle size={isMobile ? 10 : 12} />
                  {formErrors.email}
                </p>
              )}
              <p
                className={`text-gray-500 ${
                  isMobile ? "text-[10px]" : "text-xs"
                }`}
              >
                Email harus berakhiran @rumahamal.org
              </p>
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="password"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Password<span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password pengguna"
                value={newUser.password}
                onChange={handleInputChange}
                className={`${formErrors.password ? "border-red-500" : ""} ${
                  isMobile ? "text-xs h-8" : ""
                }`}
              />
              {formErrors.password && (
                <p
                  className={`text-red-500 flex items-center gap-1 ${
                    isMobile ? "text-[10px]" : "text-xs"
                  }`}
                >
                  <AlertCircle size={isMobile ? 10 : 12} />
                  {formErrors.password}
                </p>
              )}
              <p
                className={`text-gray-500 ${
                  isMobile ? "text-[10px]" : "text-xs"
                }`}
              >
                Password harus memiliki setidaknya 6 karakter.
              </p>
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="alamat"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Alamat<span className="text-red-500">*</span>
              </Label>
              <Input
                id="alamat"
                name="alamat"
                placeholder="Masukkan alamat pengguna"
                value={newUser.alamat}
                onChange={handleInputChange}
                className={`${formErrors.alamat ? "border-red-500" : ""} ${
                  isMobile ? "text-xs h-8" : ""
                }`}
              />
              {formErrors.alamat && (
                <p
                  className={`text-red-500 flex items-center gap-1 ${
                    isMobile ? "text-[10px]" : "text-xs"
                  }`}
                >
                  <AlertCircle size={isMobile ? 10 : 12} />
                  {formErrors.alamat}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="no_telp"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Nomor Telepon<span className="text-red-500">*</span>
              </Label>
              <Input
                id="no_telp"
                name="no_telp"
                placeholder="Masukkan nomor telepon pengguna"
                value={newUser.no_telp}
                onChange={handleInputChange}
                className={`${formErrors.no_telp ? "border-red-500" : ""} ${
                  isMobile ? "text-xs h-8" : ""
                }`}
              />
              {formErrors.no_telp && (
                <p
                  className={`text-red-500 flex items-center gap-1 ${
                    isMobile ? "text-[10px]" : "text-xs"
                  }`}
                >
                  <AlertCircle size={isMobile ? 10 : 12} />
                  {formErrors.no_telp}
                </p>
              )}
              <p
                className={`text-gray-500 ${
                  isMobile ? "text-[10px]" : "text-xs"
                }`}
              >
                Nomor telepon harus berupa 11-13 digit angka.
              </p>
            </div>
          </div>
          <DialogFooter className="block flex-col space-y-2 pt-4">
            <Button
              type="submit"
              className={`w-full bg-[#07B0C8] hover:bg-[#07B0C8]/90 ${
                isMobile ? "text-xs py-1 h-8" : ""
              }`}
              onClick={handleAddUser}
            >
              Tambah
            </Button>
            <Button
              type="button"
              variant="outline"
              className={`w-full ${isMobile ? "text-xs py-1 h-8" : ""}`}
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[90vw] max-w-[425px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className={isMobile ? "text-lg" : ""}>
              Edit Pengguna
            </DialogTitle>
            <DialogDescription className={isMobile ? "text-sm" : ""}>
              Perbarui informasi pengguna.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <div className="space-y-1">
              <Label
                htmlFor="name"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Nama<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="nama"
                placeholder="Masukkan nama pengguna"
                value={editingUser?.nama || ""}
                onChange={handleInputChange}
                className={`${formErrors.nama ? "border-red-500" : ""} ${
                  isMobile ? "text-xs h-8" : ""
                }`}
              />
              {formErrors.nama && (
                <p
                  className={`text-red-500 flex items-center gap-1 ${
                    isMobile ? "text-[10px]" : "text-xs"
                  }`}
                >
                  <AlertCircle size={isMobile ? 10 : 12} />
                  {formErrors.nama}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="role"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Peran<span className="text-red-500">*</span>
              </Label>
              <Select
                value={editingUser ? editingUser.role : newUser.role}
                onValueChange={(value) => handleRoleChange(value)}
              >
                <SelectTrigger className={isMobile ? "text-xs h-8" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isMobile ? "text-xs" : ""}>
                  <SelectItem value="amil">AMIL</SelectItem>
                  <SelectItem value="relawan">RELAWAN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="email"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Email<span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Masukkan alamat email pengguna"
                value={editingUser?.email || ""}
                onChange={handleInputChange}
                className={`${formErrors.email ? "border-red-500" : ""} ${
                  isMobile ? "text-xs h-8" : ""
                }`}
              />
              {formErrors.email && (
                <p
                  className={`text-red-500 flex items-center gap-1 ${
                    isMobile ? "text-[10px]" : "text-xs"
                  }`}
                >
                  <AlertCircle size={isMobile ? 10 : 12} />
                  {formErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="password"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password baru jika ingin mengubahnya"
                value={editingUser?.password || ""}
                onChange={handleInputChange}
                className={`${formErrors.password ? "border-red-500" : ""} ${
                  isMobile ? "text-xs h-8" : ""
                }`}
              />
              {formErrors.password && (
                <p
                  className={`text-red-500 flex items-center gap-1 ${
                    isMobile ? "text-[10px]" : "text-xs"
                  }`}
                >
                  <AlertCircle size={isMobile ? 10 : 12} />
                  {formErrors.password}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="alamat"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Alamat<span className="text-red-500">*</span>
              </Label>
              <Input
                id="alamat"
                name="alamat"
                placeholder="Masukkan alamat pengguna"
                value={editingUser?.alamat || ""}
                onChange={handleInputChange}
                className={`${formErrors.alamat ? "border-red-500" : ""} ${
                  isMobile ? "text-xs h-8" : ""
                }`}
              />
              {formErrors.alamat && (
                <p
                  className={`text-red-500 flex items-center gap-1 ${
                    isMobile ? "text-[10px]" : "text-xs"
                  }`}
                >
                  <AlertCircle size={isMobile ? 10 : 12} />
                  {formErrors.alamat}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="no_telp"
                className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}
              >
                Nomor Telepon<span className="text-red-500">*</span>
              </Label>
              <Input
                id="no_telp"
                name="no_telp"
                placeholder="Masukkan nomor telepon pengguna"
                value={editingUser?.no_telp || ""}
                onChange={handleInputChange}
                className={`${formErrors.no_telp ? "border-red-500" : ""} ${
                  isMobile ? "text-xs h-8" : ""
                }`}
              />
              {formErrors.no_telp && (
                <p
                  className={`text-red-500 flex items-center gap-1 ${
                    isMobile ? "text-[10px]" : "text-xs"
                  }`}
                >
                  <AlertCircle size={isMobile ? 10 : 12} />
                  {formErrors.no_telp}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="block flex-col space-y-2 pt-4">
            <Button
              className={`w-full bg-[#07B0C8] hover:bg-[#07B0C8]/90 ${
                isMobile ? "text-xs py-1 h-8" : ""
              }`}
              onClick={handleSaveEdit}
            >
              Simpan
            </Button>
            <Button
              type="button"
              variant="outline"
              className={`w-full ${isMobile ? "text-xs py-1 h-8" : ""}`}
              onClick={() => setIsEditModalOpen(false)}
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="w-[90vw] max-w-[425px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className={isMobile ? "text-lg" : ""}>
              Konfirmasi Hapus
            </DialogTitle>
            <DialogDescription className={isMobile ? "text-sm" : ""}>
              Apakah Anda yakin ingin menghapus pengguna ini?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="block flex-col space-y-2 pt-4">
            <Button
              variant="outline"
              className={`w-full ${isMobile ? "text-xs py-1 h-8" : ""}`}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              className={`w-full bg-red-600 hover:bg-red-600/90 ${
                isMobile ? "text-xs py-1 h-8" : ""
              }`}
              onClick={() => handleDeleteUser(editingUser?.id || 0)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
