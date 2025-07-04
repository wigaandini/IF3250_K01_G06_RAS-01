"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MainSidebar } from "@/components/main-sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Save,
  Loader2,
  AlertCircle,
  Check,
  X,
  MapPin,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale/id";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  statusPernikahanOptions,
  jenisKelaminOptions,
  agamaOptions,
  pendidikanOptions,
  asnafOptions,
} from "@/lib/constants";

// Di bagian atas file, tambahkan import dynamic
import dynamic from "next/dynamic";

// Dynamically import the MapComponent
const MapComponent = dynamic(() => import("@/components/ui/map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
      Memuat peta...
    </div>
  ),
});

interface Mustahiq {
  id: number;
  NIK: string;
  nama: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  no_telepon: string;
  email: string;
  alamat: string;
  provinsi_id: number | null;
  kabupaten_id: number | null;
  kecamatan_id: number | null;
  kelurahan_id: number | null;
  kode_pos: string;
  GPS_lat: number | null;
  GPS_long: number | null;
  status_pernikahan: string;
  pekerjaan: string;
  agama: string;
  pendidikan_terakhir: string;
  jumlah_anggota_kk: number | null;
  foto_kk: string | null;
  foto_ktp: string | null;
  foto_mustahiq: string | null;
  asnafs: {
    asnaf: {
      id: number;
      type: string;
    };
  }[];
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  kelurahan?: string;
  bantuans?: {
    id: number;
    program_id: number;
    jumlah: number | null;
    tanggal: string;
    status: string;
    program: {
      nama_program: string;
    };
  }[];
}

// Extended toSentenceCase with special mappings
const toSentenceCase = (text: string | null | undefined): string => {
  if (!text) return "-";

  // Special mappings
  const specialCases: Record<string, string> = {
    nik: "NIK",
    kk: "KK",
    ktp: "KTP",
    "laki-laki": "Laki-laki",
    perempuan: "Perempuan",
    belum_menikah: "Belum Menikah",
    menikah: "Menikah",
    cerai_hidup: "Cerai Hidup",
    cerai_mati: "Cerai Mati",
    islam: "Islam",
    kristen: "Kristen",
    katolik: "Katolik",
    hindu: "Hindu",
    buddha: "Buddha",
    konghucu: "Konghucu",
  };

  // Check if text matches any special case
  const lowerText = text.toLowerCase();
  if (specialCases[lowerText]) {
    return specialCases[lowerText];
  }

  // Convert snake_case and underscores to spaces
  const spacedText = text.replace(/[_]/g, " ");

  // Convert to sentence case
  return spacedText
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function DetailMustahiq() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [mustahiq, setMustahiq] = useState<Mustahiq | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/user");
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  // Fetch mustahiq data
  const fetchMustahiq = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mustahiq/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch mustahiq data");
      }

      const data = await response.json();
      console.log("Mustahiq data from API:", data);
      console.log("Asnafs structure:", data.asnafs); // Debug line
      console.log("First asnaf item:", data.asnafs?.[0]);
      console.log("Bantuans data:", data.bantuans);
      setMustahiq(data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard/kelola-mustahiq");
  };

  // Handle image click
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageViewerOpen(true);
  };

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMMM yyyy", {
      locale: indonesianLocale,
    });
  };

  // Initial data fetching
  useEffect(() => {
    if (!id || typeof id !== "string") {
      console.error("Invalid ID parameter:", id);
      router.push("/dashboard/kelola-mustahiq");
      return;
    }
    fetchCurrentUser();
    fetchMustahiq();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F5F7FB]">
        <MainSidebar userRole={currentUser?.role || "superadmin"} />
        <main className="flex-1 overflow-auto">
          <TopNav />
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[#FCB82E]" />
            <span className="ml-2">Memuat data...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!mustahiq) {
    return (
      <div className="flex h-screen bg-[#F5F7FB]">
        <MainSidebar userRole={currentUser?.role || "superadmin"} />
        <main className="flex-1 overflow-auto">
          <TopNav />
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleBack}
              >
                <img
                  src="/images/back-button-circled.svg"
                  alt="Back"
                  className="h-15 w-15"
                />
              </Button>
              <h1 className="text-3xl font-bold text-[#FCB82E]">
                Detail Mustahiq
              </h1>
            </div>
            <Card>
              <CardContent className="p-6 text-center">
                <p>Data mustahiq tidak ditemukan</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const penyaluranList = mustahiq.penyaluran_list || [];

  return (
    <div className="flex h-screen bg-[#F5F7FB]">
      <MainSidebar userRole={currentUser?.role || "superadmin"} />
      <main className="flex-1 overflow-auto">
        <TopNav />

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleBack}
            >
              <img
                src="/images/back-button-circled.svg"
                alt="Back"
                className="h-15 w-15"
              />
            </Button>
            <h1 className="text-3xl font-bold text-[#FCB82E]">
              Detail Mustahiq
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Mustahiq</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Informasi Identitas */}
                <div className="border p-4 rounded-md">
                  <h3 className="font-medium text-lg mb-4">
                    Informasi Identitas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Nama Lengkap
                      </Label>
                      <p className="text-sm">
                        {toSentenceCase(mustahiq.nama) || "-"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Jenis Kelamin
                      </Label>
                      <p className="text-sm">
                        {toSentenceCase(mustahiq.jenis_kelamin) || "-"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        NIK / Nomor KTP
                      </Label>
                      <p className="text-sm">{mustahiq.NIK || "-"}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Tempat Lahir
                      </Label>
                      <p className="text-sm">
                        {toSentenceCase(mustahiq.tempat_lahir) || "-"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Tanggal Lahir
                      </Label>
                      <p className="text-sm">
                        {formatDisplayDate(mustahiq.tanggal_lahir)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Status Pernikahan
                      </Label>
                      <p className="text-sm">
                        {toSentenceCase(mustahiq.status_pernikahan) || "-"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Agama
                      </Label>
                      <p className="text-sm">
                        {toSentenceCase(mustahiq.agama) || "-"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Pendidikan Terakhir
                      </Label>
                      <p className="text-sm">
                        {toSentenceCase(mustahiq.pendidikan_terakhir) || "-"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Pekerjaan
                      </Label>
                      <p className="text-sm">
                        {toSentenceCase(mustahiq.pekerjaan) || "-"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Jumlah Anggota KK
                      </Label>
                      <p className="text-sm">
                        {mustahiq.jumlah_anggota_kk || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kategori Asnaf */}
                <div className="border p-4 rounded-md">
                  <h3 className="font-medium text-lg mb-4">Kategori Asnaf</h3>
                  <div className="space-y-3">
                    {/* <Label className="text-sm font-medium text-gray-500">Kategori Asnaf</Label> */}
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        if (
                          !mustahiq.asnafs ||
                          !Array.isArray(mustahiq.asnafs) ||
                          mustahiq.asnafs.length === 0
                        ) {
                          return (
                            <p className="text-sm text-gray-500">
                              Belum ada kategori asnaf
                            </p>
                          );
                        }

                        return mustahiq.asnafs
                          .map((item, index) => {
                            console.log(`Asnaf item ${index}:`, item);
                            const asnafType = item?.asnaf?.type || item?.type;

                            if (!asnafType) {
                              console.log(`No asnaf type for item ${index}`);
                              return null;
                            }

                            const option = asnafOptions.find(
                              (opt) => opt.value === asnafType
                            );
                            const displayLabel = option?.label || asnafType;

                            return (
                              <span
                                key={
                                  item.asnaf?.id || item.id || `asnaf-${index}`
                                }
                                className="px-3 py-2 rounded-md text-sm bg-secondary text-secondary-foreground border"
                              >
                                {displayLabel}
                              </span>
                            );
                          })
                          .filter(Boolean); 
                      })()}
                    </div>
                  </div>
                </div>

                {/* Informasi Kontak */}
                <div className="border p-4 rounded-md">
                  <h3 className="font-medium text-lg mb-4">Informasi Kontak</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Nomor Telepon
                      </Label>
                      <p className="text-sm">{mustahiq.no_telepon || "-"}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Email
                      </Label>
                      <p className="text-sm">{mustahiq.email || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Informasi Alamat */}
                <div className="border p-4 rounded-md">
                  <h3 className="font-medium text-lg mb-4">Informasi Alamat</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">
                        Alamat Lengkap
                      </Label>
                      <p className="text-sm">{mustahiq.alamat || "-"}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-500">
                          Provinsi
                        </Label>
                        <p className="text-sm">{mustahiq.provinsi || "-"}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-500">
                          Kabupaten/Kota
                        </Label>
                        <p className="text-sm">{mustahiq.kabupaten || "-"}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-500">
                          Kecamatan
                        </Label>
                        <p className="text-sm">{mustahiq.kecamatan || "-"}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-500">
                          Desa/Kelurahan
                        </Label>
                        <p className="text-sm">{mustahiq.kelurahan || "-"}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-500">
                          Kode Pos
                        </Label>
                        <p className="text-sm">{mustahiq.kode_pos || "-"}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-500">
                        Koordinat GPS
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">
                            Latitude
                          </Label>
                          <p className="text-sm">{mustahiq.GPS_lat || "-"}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Longitude
                          </Label>
                          <p className="text-sm">{mustahiq.GPS_long || "-"}</p>
                        </div>
                      </div>

                      {/* Tambahkan peta di sini */}
                      {mustahiq.GPS_lat && mustahiq.GPS_long ? (
                        <div className="h-80 w-full rounded-md overflow-hidden border mt-2">
                          <MapComponent
                            position={[mustahiq.GPS_lat, mustahiq.GPS_long]}
                            interactive={false} // Non-interactive mode for display only
                          />
                        </div>
                      ) : (
                        <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
                          <p className="text-gray-500">
                            Tidak ada data koordinat
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dokumen */}
                <div className="border p-4 rounded-md">
                  <h3 className="font-medium text-lg mb-4">Dokumen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-500">
                        Foto KTP
                      </Label>
                      {mustahiq.foto_ktp ? (
                        <div
                          className="border rounded-md p-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(mustahiq.foto_ktp!)}
                        >
                          <img
                            src={mustahiq.foto_ktp}
                            alt="KTP"
                            className="w-full h-40 object-contain rounded-md"
                          />
                          <p className="text-xs text-center mt-2 text-blue-600">
                            Klik untuk memperbesar
                          </p>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-md p-4 text-center bg-gray-50">
                          <p className="text-sm text-gray-500">
                            Tidak ada dokumen
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-500">
                        Foto Kartu Keluarga
                      </Label>
                      {mustahiq.foto_kk ? (
                        <div
                          className="border rounded-md p-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(mustahiq.foto_kk!)}
                        >
                          <img
                            src={mustahiq.foto_kk}
                            alt="KK"
                            className="w-full h-40 object-contain rounded-md"
                          />
                          <p className="text-xs text-center mt-2 text-blue-600">
                            Klik untuk memperbesar
                          </p>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-md p-4 text-center bg-gray-50">
                          <p className="text-sm text-gray-500">
                            Tidak ada dokumen
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-500">
                        Foto Mustahiq
                      </Label>
                      {mustahiq.foto_mustahiq ? (
                        <div
                          className="border rounded-md p-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() =>
                            handleImageClick(mustahiq.foto_mustahiq!)
                          }
                        >
                          <img
                            src={mustahiq.foto_mustahiq}
                            alt="Mustahiq"
                            className="w-full h-40 object-contain rounded-md"
                          />
                          <p className="text-xs text-center mt-2 text-blue-600">
                            Klik untuk memperbesar
                          </p>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-md p-4 text-center bg-gray-50">
                          <p className="text-sm text-gray-500">
                            Tidak ada dokumen
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Back Button */}
                <div className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-[#07B0C8] text-white hover:bg-[#07B0C8]/90"
                    onClick={handleBack}
                  >
                    Kembali ke Daftar Mustahiq
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="border p-5 rounded-md">
          {/* Riwayat Penyaluran */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Riwayat Penyaluran</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>TANGGAL</TableHead>
                    <TableHead>PROGRAM</TableHead>
                    <TableHead>JUMLAH</TableHead>
                    <TableHead>STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penyaluranList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <AlertCircle size={24} className="mb-2" />
                          <p>Tidak ada mustahiq terdaftar pada program ini.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    penyaluranList.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.id}</TableCell>
                        <TableCell>{formatDisplayDate(p.tanggal)}</TableCell>
                        <TableCell>{p.program.nama_program}</TableCell>
                        <TableCell>
                          {p.jumlah?.toLocaleString("id-ID")} Rupiah
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              p.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : p.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {p.status?.charAt(0).toUpperCase() +
                              p.status?.slice(1) || "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Image Viewer Dialog */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Dokumen</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[70vh] flex items-center justify-center">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Dokumen"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
