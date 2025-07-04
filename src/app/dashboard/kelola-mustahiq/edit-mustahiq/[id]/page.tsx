"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { MainSidebar } from "@/components/main-sidebar"
import { TopNav } from "@/components/dashboard/top-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Save, Loader2, AlertCircle, Check, X, MapPin, Calendar } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { id as indonesianLocale } from "date-fns/locale/id"
import { cn } from "@/lib/utils"
import { createPortal } from 'react-dom'
import { 
  statusPernikahanOptions,
  jenisKelaminOptions,
  agamaOptions,
  pendidikanOptions,
  asnafOptions
} from '@/lib/constants';

interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error";
}

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
    id: number;
    type: string;
  }[];
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  kelurahan?: string;
}

const MapComponent = dynamic(() => import("@/components/ui/map-component"), {
  ssr: false,
  loading: () => <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">Loading map...</div>
})

import dynamic from "next/dynamic"

interface Location {
  id: number;
  nama: string;
  kode: string;
}

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=id`
    );
    
    if (!response.ok) {
      throw new Error('Gagal melakukan reverse geocode');
    }
    
    const data = await response.json();
    console.log('Reverse geocode data:', data);
    
    const address = data.address || {};
    
    // Prioritize Indonesian address components
    return {
      road: address.road || address.highway || address.pedestrian || address.footway || '',
      house_number: address.house_number || '',
      postcode: address.postcode || '',
      
      // Indonesian specific fields
      province: address.state || address.province || address.city || address.region || '',
      regency: address.city_district || address.city || address.town || address.village || address.county || '',
      district: address.suburb || address.district || address.neighbourhood || address.subdistrict ||'',
      village: address.neighbourhood || address.village || address.hamlet || address.town || ''
    };
  } catch (error) {
    console.error('Error reverse geocode:', error);
    return null;
  }
};

export default function EditMustahiq() {
  const router = useRouter();
  const params = useParams();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  const ToastPortal = () => {
    if (!toast?.visible || !portalElement) return null;
  
    return createPortal(
      <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center pt-4"
           style={{ marginTop: 0 }} role="alert">
        <div className={`flex items-center p-4 rounded-lg shadow-lg ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        } max-w-xs sm:max-w-md`}>
          <div className="inline-flex items-center justify-center flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 mr-2">
            {toast.type === "success" ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                     : <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
          </div>
          <div className="ml-2 text-xs sm:text-sm font-medium mr-6">{toast.message}</div>
          <button type="button" className="absolute right-2 top-2 text-white hover:text-gray-200"
                  onClick={() => setToast((prev) => (prev ? { ...prev, visible: false } : null))}
                  aria-label="Close">
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>,
      portalElement
    );
  };
  
  useEffect(() => {
    if (typeof document !== "undefined") {
      setPortalElement(document.body);
    }
  }, []);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
  
    if (toast?.visible) {
      timer = setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, visible: false } : null));
      }, 3000); // Toast disappears after 3 seconds
    }
  
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [toast]);
  
  const showToast = (message: string, type: "success" | "error") => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mustahiq, setMustahiq] = useState<Mustahiq | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    nama: "",
    NIK: "",
    jenis_kelamin: "Laki-laki",
    alamat: "",
    no_telepon: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    status_pernikahan: "Menikah",
    agama: "Islam",
    pendidikan_terakhir: "SD",
    pekerjaan: "",
    email: "",
    provinsi: "",
    provinsi_id: "",
    kabupaten_kota: "",
    kabupaten_id: "",
    kecamatan: "",
    kecamatan_id: "",
    desa_kelurahan: "",
    kelurahan_id: "",
    kode_pos: "",
    GPS_lat: "",
    GPS_long: "",
    jumlah_anggota_kk: "1",
    asnaf: [] as string[]
  });

  // File states
  const [fotoKTP, setFotoKTP] = useState<File | null>(null);
  const [fotoKK, setFotoKK] = useState<File | null>(null);
  const [fotoMustahiq, setFotoMustahiq] = useState<File | null>(null);
  const [fotoKTPPreview, setFotoKTPPreview] = useState<string | null>(null);
  const [fotoKKPreview, setFotoKKPreview] = useState<string | null>(null);
  const [fotoMustahiqPreview, setFotoMustahiqPreview] = useState<string | null>(null);

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
      console.log("Fetched mustahiq data:", data);
      setMustahiq(data);
      
      // Transform data for form
      setFormData({
        nama: data.nama || "",
        NIK: data.NIK || "",
        jenis_kelamin: data.jenis_kelamin || "Laki-laki",
        alamat: data.alamat || "",
        no_telepon: data.no_telepon || "",
        tempat_lahir: data.tempat_lahir || "",
        tanggal_lahir: data.tanggal_lahir ? new Date(data.tanggal_lahir).toISOString().split('T')[0] : "",
        status_pernikahan: data.status_pernikahan || "Menikah",
        agama: data.agama || "Islam",
        pendidikan_terakhir: data.pendidikan_terakhir || "SD",
        pekerjaan: data.pekerjaan || "",
        email: data.email || "",
        provinsi: data.provinsi || "",
        provinsi_id: data.provinsi_id?.toString() || "",
        kabupaten_kota: data.kabupaten || "",
        kabupaten_id: data.kabupaten_id?.toString() || "",
        kecamatan: data.kecamatan || "",
        kecamatan_id: data.kecamatan_id?.toString() || "",
        desa_kelurahan: data.kelurahan || "",
        kelurahan_id: data.kelurahan_id?.toString() || "",
        kode_pos: data.kode_pos || "",
        GPS_lat: data.GPS_lat?.toString() || "",
        GPS_long: data.GPS_long?.toString() || "",
        jumlah_anggota_kk: data.jumlah_anggota_kk?.toString() || "1",
        asnaf: data.asnafs?.map((a: any) => a.type) || []
      });

      // Set image previews
      if (data.foto_ktp) setFotoKTPPreview(data.foto_ktp);
      if (data.foto_kk) setFotoKKPreview(data.foto_kk);
      if (data.foto_mustahiq) setFotoMustahiqPreview(data.foto_mustahiq);
      
    } catch (error) {
      console.error("Fetch Error:", error);
      showToast(error instanceof Error ? error.message : "Gagal mengambil data mustahiq", "error");
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleMapPositionChange = async (lat: number, lng: number) => {
    // Update coordinates first
    setFormData(prev => ({
      ...prev,
      GPS_lat: lat.toString(),
      GPS_long: lng.toString()
    }));

    // Perform reverse geocoding
    const address = await reverseGeocode(lat, lng);
    console.log('Address data:', address);
    
    if (!address) return;

    // Build full address string
    const fullAddress = [
      address.road,
      address.house_number ? `No. ${address.house_number}` : '',
      address.village,
      address.district,
      address.regency,
      address.province,
      address.postcode ? `Kode Pos: ${address.postcode}` : ''
    ].filter(Boolean).join(', ');

    // Update state with all address components
    setFormData(prev => ({
      ...prev,
      alamat: fullAddress,
      provinsi: address.province,
      kabupaten_kota: address.regency,
      kecamatan: address.district,
      desa_kelurahan: address.village,
      kode_pos: address.postcode || prev.kode_pos
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const toggleAsnafSelection = (value: string) => {
    setFormData(prev => {
      const asnafArray = prev.asnaf.includes(value) ?
        prev.asnaf.filter(item => item !== value) :
        [...prev.asnaf, value];
      return { ...prev, asnaf: asnafArray };
    });
  };

  const isAsnafSelected = (value: string) => formData.asnaf.includes(value);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      setFormData({
        ...formData,
        tanggal_lahir: formattedDate,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleCoordinateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  
    // If both coordinates exist, perform reverse geocode
    if (name === 'GPS_lat' && formData.GPS_long) {
      const lat = parseFloat(value);
      const lng = parseFloat(formData.GPS_long);
      if (!isNaN(lat) && !isNaN(lng)) {
        await handleMapPositionChange(lat, lng);
      }
    } else if (name === 'GPS_long' && formData.GPS_lat) {
      const lat = parseFloat(formData.GPS_lat);
      const lng = parseFloat(value);
      if (!isNaN(lat) && !isNaN(lng)) {
        await handleMapPositionChange(lat, lng);
      }
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          await handleMapPositionChange(lat, lng);
        },
        (error) => {
          console.error("Error getting location:", error);
          showToast("Gagal mendapatkan lokasi. Mohon izinkan akses lokasi atau masukkan secara manual.", "error");
        },
      );
    } else {
      showToast("Geolocation tidak didukung oleh browser ini.", "error");
    }
  };

  // Form validation
  const validateKTP = (ktp: string) => {
    if (!ktp) return "Nomor KTP tidak boleh kosong";
    if (!/^\d+$/.test(ktp)) return "Nomor KTP hanya boleh angka";
    if (ktp.length !== 16) return "Nomor KTP harus 16 digit";
    return "";
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return "Nomor telepon tidak boleh kosong";
    if (!/^\d+$/.test(phone)) return "Nomor telepon hanya boleh angka";
    if (phone.length < 10 || phone.length > 15) return "Nomor telepon harus 10-15 digit";
    return "";
  };

  const validateEmail = (email: string) => {
    if (!email) return ""; // Email is optional
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email tidak valid";
    return "";
  };

  const validateForm = () => {
    const errors: Record<string, string> = {
      nama: formData.nama ? "" : "Nama tidak boleh kosong",
      NIK: validateKTP(formData.NIK),
      tempat_lahir: formData.tempat_lahir ? "" : "Tempat lahir tidak boleh kosong",
      tanggal_lahir: formData.tanggal_lahir ? "" : "Tanggal lahir tidak boleh kosong",
      alamat: formData.alamat ? "" : "Alamat tidak boleh kosong",
      no_telepon: validatePhoneNumber(formData.no_telepon),
      email: validateEmail(formData.email),
      provinsi: formData.provinsi ? "" : "Provinsi harus diisi",
      kabupaten_kota: formData.kabupaten_kota ? "" : "Kabupaten/Kota harus diisi",
      kecamatan: formData.kecamatan ? "" : "Kecamatan harus diisi",
      desa_kelurahan: formData.desa_kelurahan ? "" : "Desa/Kelurahan harus diisi",
      pekerjaan: formData.pekerjaan ? "" : "Pekerjaan tidak boleh kosong",
      asnaf: formData.asnaf.length > 0 ? "" : "Kategori asnaf harus dipilih minimal satu",
      jumlah_anggota_kk:
        !formData.jumlah_anggota_kk ||
        parseInt(formData.jumlah_anggota_kk) < 1
          ? "Jumlah anggota KK harus minimal 1"
          : "",
      kode_pos:
        formData.kode_pos && !/^\d{5}$/.test(formData.kode_pos)
          ? "Kode pos harus 5 digit angka"
          : "",
      GPS_lat:
        formData.GPS_lat && isNaN(parseFloat(formData.GPS_lat))
          ? "Latitude harus berupa angka"
          : "",
      GPS_long:
        formData.GPS_long && isNaN(parseFloat(formData.GPS_long))
          ? "Longitude harus berupa angka"
          : "",
    };

    const filteredErrors: Record<string, string> = {};
    Object.keys(errors).forEach((key) => {
      if (errors[key]) {
        filteredErrors[key] = errors[key];
      }
    });

    setFormErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
  
    setSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (key === "asnaf") {
            formDataToSend.append(key, JSON.stringify(value)); // Pass as an array
          } else {
            formDataToSend.append(key, String(value));
          }
        }
      });
      
      // Append files if selected
      if (fotoKTP) formDataToSend.append("foto_ktp", fotoKTP);
      if (fotoKK) formDataToSend.append("foto_kk", fotoKK);
      if (fotoMustahiq) formDataToSend.append("foto_mustahiq", fotoMustahiq);
      
      const response = await fetch(`/api/mustahiq/${id}`, {
        method: "PUT",
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update mustahiq");
      }
      
      showToast("Data mustahiq berhasil diperbarui", "success");
      
      setTimeout(() => {
        router.push("/dashboard/kelola-mustahiq");
      }, 1000);
    } catch (error) {
      console.error("Error updating mustahiq:", error);
      showToast(error instanceof Error ? error.message : "Gagal memperbarui data mustahiq", "error");
    } finally {
      setSubmitting(false);
    }
  };  

  const handleBack = () => {
    router.push("/dashboard/kelola-mustahiq");
  };

  // Initial data fetching
  useEffect(() => {
    if (!id || typeof id !== 'string') {
      console.error('Invalid ID parameter:', id);
      router.push('/dashboard/kelola-mustahiq');
      return;
    }
    fetchCurrentUser();
    fetchMustahiq();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F5F7FB]">
        <MainSidebar userRole={currentUser?.role || "superadmin"} />
        <main className="flex-1">
          <TopNav />
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[#FCB82E]" />
            <span className="ml-2">Memuat data...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F7FB]">
      <MainSidebar userRole={currentUser?.role || "superadmin"} />
      <main className="flex-1 overflow-auto">
        <TopNav />
        <ToastPortal />
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
              <img src="/images/back-button-circled.svg" alt="Back" className="h-15 w-15" />
            </Button>
            <h1 className="text-3xl font-bold text-[#FCB82E]">Edit Mustahiq</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Form Edit Mustahiq</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Informasi Identitas */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium text-lg mb-4">Informasi Identitas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="nama" className="text-sm font-medium">
                          Nama Lengkap<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nama"
                          name="nama"
                          placeholder="Masukkan nama lengkap"
                          value={formData.nama}
                          onChange={handleInputChange}
                          className={formErrors.nama ? "border-red-500" : ""}
                        />
                        {formErrors.nama && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {formErrors.nama}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="jenis_kelamin" className="text-sm font-medium">
                          Jenis Kelamin<span className="text-red-500">*</span>
                        </Label>
                        <RadioGroup
                          value={formData.jenis_kelamin}
                          onValueChange={(value) => {
                            setFormData(prev => ({...prev, jenis_kelamin: value}));
                          }}
                          className="flex items-center gap-4 pt-2"
                        >
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="Laki-laki" id="Laki-laki" />
                            <Label htmlFor="Laki-laki">Laki-laki</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="Perempuan" id="Perempuan" />
                            <Label htmlFor="Perempuan">Perempuan</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="NIK" className="text-sm font-medium">
                          NIK / Nomor KTP<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="NIK"
                          name="NIK"
                          placeholder="Masukkan nomor KTP"
                          value={formData.NIK}
                          onChange={handleInputChange}
                          className={formErrors.NIK ? "border-red-500" : ""}
                        />
                        {formErrors.NIK && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {formErrors.NIK}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">Nomor KTP harus 16 digit angka.</p>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="tempat_lahir" className="text-sm font-medium">
                          Tempat Lahir<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="tempat_lahir"
                          name="tempat_lahir"
                          placeholder="Masukkan tempat lahir"
                          value={formData.tempat_lahir}
                          onChange={handleInputChange}
                          className={formErrors.tempat_lahir ? "border-red-500" : ""}
                        />
                        {formErrors.tempat_lahir && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {formErrors.tempat_lahir}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="tanggal_lahir" className="text-sm font-medium">
                          Tanggal Lahir<span className="text-red-500">*</span>
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="tanggal_lahir"
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.tanggal_lahir && "text-muted-foreground",
                                formErrors.tanggal_lahir && "border-red-500",
                              )}
                            >
                              <Calendar size={16} className="mr-2" />
                              {formData.tanggal_lahir ? (
                                format(new Date(formData.tanggal_lahir), "dd MMMM yyyy", { locale: indonesianLocale })
                              ) : (
                                <span>Pilih tanggal</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={formData.tanggal_lahir ? new Date(formData.tanggal_lahir) : undefined}
                              onSelect={handleDateChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {formErrors.tanggal_lahir && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {formErrors.tanggal_lahir}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="status_pernikahan" className="text-sm font-medium">
                          Status Pernikahan<span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.status_pernikahan}
                          onValueChange={(value) => setFormData({...formData, status_pernikahan: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status pernikahan" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusPernikahanOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="agama" className="text-sm font-medium">
                          Agama<span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.agama} 
                          onValueChange={(value) => setFormData({...formData, agama: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih agama" />
                          </SelectTrigger>
                          <SelectContent>
                            {agamaOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="pendidikan_terakhir" className="text-sm font-medium">
                          Pendidikan Terakhir<span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.pendidikan_terakhir}
                          onValueChange={(value) => setFormData({...formData, pendidikan_terakhir: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih pendidikan terakhir" />
                          </SelectTrigger>
                          <SelectContent>
                            {pendidikanOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="pekerjaan" className="text-sm font-medium">
                          Pekerjaan<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="pekerjaan"
                          name="pekerjaan"
                          placeholder="Masukkan pekerjaan"
                          value={formData.pekerjaan}
                          onChange={handleInputChange}
                          className={formErrors.pekerjaan ? "border-red-500" : ""}
                        />
                        {formErrors.pekerjaan && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {formErrors.pekerjaan}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="jumlah_anggota_kk" className="text-sm font-medium">
                          Jumlah Anggota KK<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="jumlah_anggota_kk"
                          name="jumlah_anggota_kk"
                          type="number"
                          min="1"
                          placeholder="Masukkan jumlah anggota KK"
                          value={formData.jumlah_anggota_kk}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kategori Asnaf */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium text-lg mb-4">Kategori Asnaf</h3>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Kategori Asnaf<span className="text-red-500">*</span>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {asnafOptions.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleAsnafSelection(option.value)}
                            className={`px-3 py-2 rounded-md text-sm ${
                              isAsnafSelected(option.value)
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      {formErrors.asnaf && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.asnaf}
                        </p>
                      )}
                    </div>
                    
                    {/* Display selected categories */}
                    {formData.asnaf.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Kategori terpilih: {formData.asnaf.map(a => {
                            const option = asnafOptions.find(opt => opt.value === a);
                            return option ? option.label : a;
                          }).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Informasi Kontak */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium text-lg mb-4">Informasi Kontak</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="no_telepon" className="text-sm font-medium">
                          Nomor Telepon<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="no_telepon"
                          name="no_telepon"
                          placeholder="Masukkan nomor telepon"
                          value={formData.no_telepon}
                          onChange={handleInputChange}
                          className={formErrors.no_telepon ? "border-red-500" : ""}
                        />
                        {formErrors.no_telepon && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {formErrors.no_telepon}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">Nomor telepon harus 10-15 digit angka.</p>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Masukkan email (opsional)"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={formErrors.email ? "border-red-500" : ""}
                        />
                        {formErrors.email && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {formErrors.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informasi Alamat */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium text-lg mb-4">Informasi Alamat</h3>
                    <div className="space-y-4">
                      {/* GPS Coordinates and Map */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Lokasi</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Input
                              id="GPS_lat"
                              name="GPS_lat"
                              placeholder="Latitude"
                              value={formData.GPS_lat}
                              onChange={handleCoordinateChange}
                            />
                          </div>
                          <div>
                            <Input
                              id="GPS_long"
                              name="GPS_long"
                              placeholder="Longitude"
                              value={formData.GPS_long}
                              onChange={handleCoordinateChange}
                            />
                          </div>
                        </div>
                        <div className="h-80 w-full rounded-md overflow-hidden border mt-2">
                          <MapComponent 
                            position={formData.GPS_lat && formData.GPS_long 
                              ? [parseFloat(formData.GPS_lat), parseFloat(formData.GPS_long)] 
                              : undefined}
                            onPositionChange={handleMapPositionChange}
                          />
                        </div>
                        <Button type="button" variant="outline" className="gap-2 mt-1" onClick={getCurrentLocation}>
                          <MapPin size={16} />
                          Dapatkan Lokasi Saat Ini
                        </Button>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="alamat" className="text-sm font-medium">
                          Alamat Lengkap<span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="alamat"
                          name="alamat"
                          placeholder="Alamat akan terisi otomatis dari lokasi peta"
                          value={formData.alamat}
                          onChange={handleInputChange}
                          className={formErrors.alamat ? "border-red-500" : ""}
                          rows={4}
                        />
                        {formErrors.alamat && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {formErrors.alamat}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="provinsi" className="text-sm font-medium">
                            Provinsi<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="provinsi"
                            name="provinsi"
                            placeholder="Akan terisi otomatis dari peta"
                            value={formData.provinsi}
                            readOnly
                          />
                          {formErrors.provinsi && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {formErrors.provinsi}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="kabupaten_kota" className="text-sm font-medium">
                            Kabupaten/Kota<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="kabupaten_kota"
                            name="kabupaten_kota"
                            placeholder="Akan terisi otomatis dari peta"
                            value={formData.kabupaten_kota}
                            readOnly
                          />
                          {formErrors.kabupaten_kota && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {formErrors.kabupaten_kota}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="kecamatan" className="text-sm font-medium">
                            Kecamatan<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="kecamatan"
                            name="kecamatan"
                            placeholder="Akan terisi otomatis dari peta"
                            value={formData.kecamatan}
                            readOnly
                          />
                          {formErrors.kecamatan && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {formErrors.kecamatan}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="desa_kelurahan" className="text-sm font-medium">
                            Desa/Kelurahan<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="desa_kelurahan"
                            name="desa_kelurahan"
                            placeholder="Akan terisi otomatis dari peta"
                            value={formData.desa_kelurahan}
                            readOnly
                          />
                          {formErrors.desa_kelurahan && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {formErrors.desa_kelurahan}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="kode_pos" className="text-sm font-medium">
                            Kode Pos
                          </Label>
                          <Input
                            id="kode_pos"
                            name="kode_pos"
                            placeholder="Masukkan kode pos"
                            value={formData.kode_pos}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upload Dokumen */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium text-lg mb-4">Upload Dokumen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="foto_ktp" className="text-sm font-medium">
                          Foto KTP<span className="text-red-500">*</span>
                        </Label>
                        <div className="border-2 border-dashed rounded-md p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                          {fotoKTPPreview ? (
                            <div className="relative space-y-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFotoKTP(null);
                                  setFotoKTPPreview(null);
                                }}
                                className="absolute top-1 right-1 bg-white rounded-full shadow p-1 hover:bg-red-100 z-10"
                              >
                                <X size={14} className="text-red-500" />
                              </button>
                              <img
                                src={fotoKTPPreview}
                                alt="Preview KTP"
                                className="mx-auto h-40 object-cover rounded-md"
                              />
                              <p className="text-xs text-gray-500 truncate">KTP saat ini</p>
                            </div>
                          ) : (
                            <div
                              className="flex flex-col items-center justify-center py-4"
                              onClick={() => document.getElementById("foto_ktp_input")?.click()}
                            >
                              <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <AlertCircle size={32} className="text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500">Klik untuk upload</p>
                              <p className="text-xs text-gray-400">JPG, PNG atau PDF (max. 5MB)</p>
                            </div>
                          )}
                          <input
                            id="foto_ktp_input"
                            name="foto_ktp"
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, setFotoKTP)}
                            accept="image/jpeg,image/png,application/pdf"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="foto_kk" className="text-sm font-medium">
                          Foto Kartu Keluarga
                        </Label>
                        <div className="border-2 border-dashed rounded-md p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                          {fotoKKPreview ? (
                            <div className="relative space-y-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFotoKK(null);
                                  setFotoKKPreview(null);
                                }}
                                className="absolute top-1 right-1 bg-white rounded-full shadow p-1 hover:bg-red-100 z-10"
                              >
                                <X size={14} className="text-red-500" />
                              </button>
                              <img
                                src={fotoKKPreview}
                                alt="Preview KK"
                                className="mx-auto h-40 object-cover rounded-md"
                              />
                              <p className="text-xs text-gray-500 truncate">KK saat ini</p>
                            </div>
                          ) : (
                            <div
                              className="flex flex-col items-center justify-center py-4"
                              onClick={() => document.getElementById("foto_kk_input")?.click()}
                            >
                              <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <AlertCircle size={32} className="text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500">Klik untuk upload</p>
                              <p className="text-xs text-gray-400">JPG, PNG atau PDF (max. 5MB)</p>
                            </div>
                          )}
                          <input
                            id="foto_kk_input"
                            name="foto_kk"
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, setFotoKK)}
                            accept="image/jpeg,image/png,application/pdf"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="foto_mustahiq" className="text-sm font-medium">
                          Foto Mustahiq
                        </Label>
                        <div className="border-2 border-dashed rounded-md p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                          {fotoMustahiqPreview ? (
                            <div className="relative space-y-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFotoMustahiq(null);
                                  setFotoMustahiqPreview(null);
                                }}
                                className="absolute top-1 right-1 bg-white rounded-full shadow p-1 hover:bg-red-100 z-10"
                              >
                                <X size={14} className="text-red-500" />
                              </button>
                              <img
                                src={fotoMustahiqPreview}
                                alt="Preview Mustahiq"
                                className="mx-auto h-40 object-cover rounded-md"
                              />
                              <p className="text-xs text-gray-500 truncate">Foto saat ini</p>
                            </div>
                          ) : (
                            <div
                              className="flex flex-col items-center justify-center py-4"
                              onClick={() => document.getElementById("foto_mustahiq_input")?.click()}
                            >
                              <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <AlertCircle size={32} className="text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500">Klik untuk upload</p>
                              <p className="text-xs text-gray-400">JPG, PNG atau PDF (max. 5MB)</p>
                            </div>
                          )}
                          <input
                            id="foto_mustahiq_input"
                            name="foto_mustahiq"
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, setFotoMustahiq)}
                            accept="image/jpeg,image/png,application/pdf"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={handleBack}>
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#07B0C8] hover:bg-[#07B0C8]/90"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        "Simpan Perubahan"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}