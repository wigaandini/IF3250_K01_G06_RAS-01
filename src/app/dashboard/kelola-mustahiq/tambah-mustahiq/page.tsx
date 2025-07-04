"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { MainSidebar } from "@/components/main-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Calendar, MapPin, Loader2, Check, X } from "lucide-react";
import { TopNav } from "@/components/dashboard/top-nav"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { id } from "date-fns/locale"
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

import dynamic from "next/dynamic"

// Dynamically import the MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/ui/map-component"), {
  ssr: false,
  loading: () => <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">Loading map...</div>
})

// Fungsi untuk reverse geocode
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
      amenity: address.amenity || '',
      
      // Indonesian specific fields
      province: address.state || address.province || address.city || '',
      regency: address.city || address.town || address.village || address.county || address.municipality || '',
      district: address.suburb || address.district || address.neighbourhood || address.subdistrict || address.city  || '',
      village: address.residential || address.neighbourhood || address.village || address.hamlet || address.town || address.county || address.town || address.city ||''
    };
  } catch (error) {
    console.error('Error reverse geocode:', error);
    return null;
  }
};

type MustahiqFormData = {
  nama: string
  jenis_kelamin: string
  no_ktp: string
  tempat_lahir: string
  tanggal_lahir: string
  asnaf: string[]
  no_telepon: string
  email: string
  alamat: string
  provinsi: string
  kabupaten_kota: string
  kecamatan: string
  desa_kelurahan: string
  kode_pos: string
  GPS_lat: string
  GPS_long: string
  status_pernikahan: string
  pekerjaan: string
  agama: string
  pendidikan_terakhir: string
  jumlah_anggota_kk: string
  foto_kk: File | null
  foto_ktp: File | null
  foto_mustahiq: File | null
  foto_kondisi: File[] | null
  tanggal_input: string
  nama_penginput: string
}

export default function TambahMustahiq() {
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

  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [provinceData, setProvinceData] = useState<any[]>([])
  const [kabupatenData, setKabupatenData] = useState<any[]>([])
  const [kecamatanData, setKecamatanData] = useState<any[]>([])
  const [kelurahanData, setKelurahanData] = useState<any[]>([])

  const [newMustahiq, setNewMustahiq] = useState<MustahiqFormData>({
    nama: "",
    jenis_kelamin: "Laki-laki",
    no_ktp: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    asnaf: [],
    no_telepon: "",
    email: "",
    alamat: "",
    provinsi: "",
    kabupaten_kota: "",
    kecamatan: "",
    desa_kelurahan: "",
    kode_pos: "",
    GPS_lat: "",
    GPS_long: "",
    status_pernikahan: "belum_menikah",
    pekerjaan: "",
    agama: "islam",
    pendidikan_terakhir: "sd",
    jumlah_anggota_kk: "1",
    foto_kk: null,
    foto_ktp: null,
    foto_mustahiq: null,
    foto_kondisi: [],
    tanggal_input: new Date().toISOString().split("T")[0],
    nama_penginput: "",
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [filePreviews, setFilePreviews] = useState({
    foto_kk: "",
    foto_ktp: "",
    foto_mustahiq: "",
    foto_kondisi:[] as string[],
  })

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/user")

        if (!response.ok) {
          console.warn("User authentication failed, continuing as guest")
          setCurrentUser({ nama: "Guest User", role: "guest" })
          setNewMustahiq((prev) => ({
            ...prev,
            nama_penginput: "Guest User",
          }))
          return
        }

        const userData = await response.json()
        setCurrentUser(userData)

        if (userData?.nama) {
          setNewMustahiq((prev) => ({
            ...prev,
            nama_penginput: userData.nama,
          }))
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        // Set a fallback user to prevent the form from breaking
        setCurrentUser({ nama: "Guest User", role: "guest" })
        setNewMustahiq((prev) => ({
          ...prev,
          nama_penginput: "Guest User",
        }))
      }
    }

    const fetchProvinces = async () => {
      setLoading(true);
      try {
        console.log("Fetching provinces...");
        const response = await fetch("/api/wilayah/provinsi");
        if (!response.ok) {
          throw new Error(`Failed to fetch provinces: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Provinces data:", data);
        
        // Ensure data is an array before setting state
        if (!Array.isArray(data)) {
          console.error("Expected array but got:", data);
          setProvinceData([]);
        } else {
          setProvinceData(data);
        }
      } catch (error) {
        console.error("Error fetching provinces:", error);
        setProvinceData([]); // Ensure state remains an array even on error
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser()
    fetchProvinces()
  }, [])

  const fetchKabupaten = async (provinsiId: number) => {
    setLoading(true)
    try {
      console.log(`Fetching kabupaten for provinsi ID: ${provinsiId}`)
      const response = await fetch(`/api/wilayah/kabupaten?provinsi_id=${provinsiId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch kabupaten: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      console.log("Kabupaten data:", data)
      setKabupatenData(data)
    } catch (error) {
      console.error("Error fetching kabupaten:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchKecamatan = async (kabupatenId: number) => {
    setLoading(true)
    try {
      console.log(`Fetching kecamatan for kabupaten ID: ${kabupatenId}`)
      const response = await fetch(`/api/wilayah/kecamatan?kabupaten_id=${kabupatenId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch kecamatan: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      console.log("Kecamatan data:", data)
      setKecamatanData(data)
    } catch (error) {
      console.error("Error fetching kecamatan:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchKelurahan = async (kecamatanId: number) => {
    setLoading(true)
    try {
      console.log(`Fetching kelurahan for kecamatan ID: ${kecamatanId}`)
      const response = await fetch(`/api/wilayah/kelurahan?kecamatan_id=${kecamatanId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch kelurahan: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      console.log("Kelurahan data:", data)
      setKelurahanData(data)
    } catch (error) {
      console.error("Error fetching kelurahan:", error)
    } finally {
      setLoading(false)
    }
  }

  const validateKTP = (ktp: string) => {
    if (!ktp) return "Nomor KTP tidak boleh kosong"
    if (!/^\d+$/.test(ktp)) return "Nomor KTP hanya boleh angka"
    if (ktp.length !== 16) return "Nomor KTP harus 16 digit"
    return ""
  }

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return "Nomor telepon tidak boleh kosong"
    if (!/^\d+$/.test(phone)) return "Nomor telepon hanya boleh angka"
    if (phone.length < 10 || phone.length > 13) return "Nomor telepon harus 10-13 digit"
    return ""
  }

  const validateEmail = (email: string) => {
    if (!email) return "" // Email is optional
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email tidak valid"
    return ""
  }

  const validateForm = () => {
    const errors: Record<string, string> = {
      nama: newMustahiq.nama ? "" : "Nama tidak boleh kosong",
      no_ktp: validateKTP(newMustahiq.no_ktp),
      tempat_lahir: newMustahiq.tempat_lahir ? "" : "Tempat lahir tidak boleh kosong",
      tanggal_lahir: newMustahiq.tanggal_lahir ? "" : "Tanggal lahir tidak boleh kosong",
      alamat: newMustahiq.alamat ? "" : "Alamat tidak boleh kosong",
      no_telepon: validatePhoneNumber(newMustahiq.no_telepon),
      email: validateEmail(newMustahiq.email),
      provinsi: newMustahiq.provinsi ? "" : "Provinsi harus dipilih",
      kabupaten_kota: newMustahiq.kabupaten_kota ? "" : "Kabupaten/Kota harus dipilih",
      kecamatan: newMustahiq.kecamatan ? "" : "Kecamatan harus dipilih",
      desa_kelurahan: newMustahiq.desa_kelurahan ? "" : "Desa/Kelurahan harus dipilih",
      pekerjaan: newMustahiq.pekerjaan ? "" : "Pekerjaan tidak boleh kosong",
      foto_ktp: newMustahiq.foto_ktp ? "" : "Foto KTP harus diunggah",

      // Tambahan validasi:
      asnaf: newMustahiq.asnaf.length > 0 ? "" : "Kategori asnaf harus dipilih",
      jumlah_anggota_kk:
        !newMustahiq.jumlah_anggota_kk || parseInt(newMustahiq.jumlah_anggota_kk) < 1
          ? "Jumlah anggota KK harus minimal 1"
          : "",
      kode_pos:
        newMustahiq.kode_pos && !/^\d{5}$/.test(newMustahiq.kode_pos)
          ? "Kode pos harus 5 digit angka"
          : "",
      GPS_lat:
        newMustahiq.GPS_lat && isNaN(parseFloat(newMustahiq.GPS_lat))
          ? "Latitude harus berupa angka"
          : "",
      GPS_long:
        newMustahiq.GPS_long && isNaN(parseFloat(newMustahiq.GPS_long))
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewMustahiq((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "asnaf") {
      setNewMustahiq((prev) => {
        const currentAsnaf = Array.isArray(prev.asnaf) ? prev.asnaf : [];
        const updatedAsnaf = currentAsnaf.includes(value)
          ? currentAsnaf.filter(item => item !== value)
          : [...currentAsnaf, value];
        
        return {
          ...prev,
          asnaf: updatedAsnaf
        };
      });
    } else if (name === "provinsi") {
      // Find the province ID
      const selectedProvince = provinceData.find((p) => p.nama === value)
      if (selectedProvince) {
        fetchKabupaten(selectedProvince.id)
        setNewMustahiq((prev) => ({
          ...prev,
          [name]: value,
          provinsi_id: selectedProvince.id,
          kabupaten_kota: "",
          kabupaten_id: null,
          kecamatan: "",
          kecamatan_id: null,
          desa_kelurahan: "",
          kelurahan_id: null,
        }))
      }
    } else if (name === "kabupaten_kota") {
      // Find the kabupaten ID
      const selectedKabupaten = kabupatenData.find((k) => k.nama === value)
      if (selectedKabupaten) {
        fetchKecamatan(selectedKabupaten.id)
        setNewMustahiq((prev) => ({
          ...prev,
          [name]: value,
          kabupaten_id: selectedKabupaten.id,
          kecamatan: "",
          kecamatan_id: null,
          desa_kelurahan: "",
          kelurahan_id: null,
        }))
      }
    } else if (name === "kecamatan") {
      // Find the kecamatan ID
      const selectedKecamatan = kecamatanData.find((k) => k.nama === value)
      if (selectedKecamatan) {
        fetchKelurahan(selectedKecamatan.id)
        setNewMustahiq((prev) => ({
          ...prev,
          [name]: value,
          kecamatan_id: selectedKecamatan.id,
          desa_kelurahan: "",
          kelurahan_id: null,
        }))
      }
    } else if (name === "desa_kelurahan") {
      // Find the kelurahan ID
      const selectedKelurahan = kelurahanData.find((k) => k.nama === value)
      if (selectedKelurahan) {
        setNewMustahiq((prev) => ({
          ...prev,
          [name]: value,
          kelurahan_id: selectedKelurahan.id,
        }))
      }
    } else {
      setNewMustahiq({
        ...newMustahiq,
        [name]: value,
      })
    }

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      })
    }
  }

  const toggleAsnafSelection = (value: string) => {
    setNewMustahiq(prev => {
      const asnafArray = prev.asnaf.includes(value) ?
        prev.asnaf.filter(item => item !== value) : // Remove the item if it's already included
        [...prev.asnaf, value]; // Add the item if it's not included

      return { ...prev, asnaf: asnafArray };
    });
  };

  const isAsnafSelected = (value: string) => newMustahiq.asnaf.includes(value);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd")
      setNewMustahiq({
        ...newMustahiq,
        tanggal_lahir: formattedDate,
      })

      if (formErrors.tanggal_lahir) {
        setFormErrors({
          ...formErrors,
          tanggal_lahir: "",
        })
      }
    }
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isMultiple: boolean = false
  ) => {
    const { name, files } = e.target;
    if (!files) return;
  
    if (isMultiple && name === "foto_kondisi") {
      const newFiles = Array.from(files);
      const newPreviews = newFiles.map((file) =>
        file.type === "application/pdf"
          ? "/pdf-placeholder.svg"
          : URL.createObjectURL(file)
      );
  
      setNewMustahiq((prev) => ({
        ...prev,
        foto_kondisi: [...(prev.foto_kondisi || []), ...newFiles],
      }));
      setFilePreviews((prev) => ({
        ...prev,
        foto_kondisi: [...prev.foto_kondisi, ...newPreviews],
      }));
    } else {
      const file = files[0];
      const preview =
        file.type === "application/pdf"
          ? "/pdf-placeholder.svg"
          : URL.createObjectURL(file);
  
      setNewMustahiq((prev) => ({ ...prev, [name]: file }));
      setFilePreviews((prev) => ({ ...prev, [name]: preview }));
    }
  };
  

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Panggil handleMapPositionChange yang sudah dimodifikasi
          await handleMapPositionChange(lat, lng);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Gagal mendapatkan lokasi. Mohon izinkan akses lokasi atau masukkan secara manual.");
        },
      );
    } else {
      alert("Geolocation tidak didukung oleh browser ini.");
    }
  };

  const handleCoordinateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setNewMustahiq({
      ...newMustahiq,
      [name]: value,
    });
  
    // Jika kedua koordinat ada, lakukan reverse geocode
    if (name === 'GPS_lat' && newMustahiq.GPS_long) {
      const lat = parseFloat(value);
      const lng = parseFloat(newMustahiq.GPS_long);
      if (!isNaN(lat) && !isNaN(lng)) {
        await handleMapPositionChange(lat, lng);
      }
    } else if (name === 'GPS_long' && newMustahiq.GPS_lat) {
      const lat = parseFloat(newMustahiq.GPS_lat);
      const lng = parseFloat(value);
      if (!isNaN(lat) && !isNaN(lng)) {
        await handleMapPositionChange(lat, lng);
      }
    }
  };

  // Add a handler for map position updates
  const handleMapPositionChange = async (lat: number, lng: number) => {
    // Update coordinates first
    setNewMustahiq(prev => ({
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
      address.amenity,
      address.road,
      address.house_number ? `No. ${address.house_number}` : '',
      address.village,
      address.district,
      address.regency,
      address.province,
      address.postcode ? `Kode Pos: ${address.postcode}` : ''
    ].filter(Boolean).join(', ');

    // Update state with all address components
    setNewMustahiq(prev => ({
      ...prev,
      alamat: fullAddress,
      provinsi: address.province,
      kabupaten_kota: address.regency,
      kecamatan: address.district,
      desa_kelurahan: address.village,
      kode_pos: address.postcode || prev.kode_pos
    }));
  };

  // useEffect(() => {
  //   // Jika provinsi berubah dan ada provinsi_id, fetch kabupaten
  //   if (newMustahiq.provinsi_id && newMustahiq.provinsi) {
  //     fetchKabupaten(newMustahiq.provinsi_id);
  //   }
  // }, [newMustahiq.provinsi_id]);
  
  // useEffect(() => {
  //   // Jika kabupaten berubah dan ada kabupaten_id, fetch kecamatan
  //   if (newMustahiq.kabupaten_id && newMustahiq.kabupaten_kota) {
  //     fetchKecamatan(newMustahiq.kabupaten_id);
  //   }
  // }, [newMustahiq.kabupaten_id]);
  
  // useEffect(() => {
  //   // Jika kecamatan berubah dan ada kecamatan_id, fetch kelurahan
  //   if (newMustahiq.kecamatan_id && newMustahiq.kecamatan) {
  //     fetchKelurahan(newMustahiq.kecamatan_id);
  //   }
  // }, [newMustahiq.kecamatan_id]);

  // useEffect(() => {
  //   // Jika kelurahan berubah, update kelurahan_id
  //   if (newMustahiq.kelurahan_id && newMustahiq.desa_kelurahan) {
  //     const selectedKelurahan = kelurahanData.find(k => k.nama === newMustahiq.desa_kelurahan);
  //     if (selectedKelurahan) {
  //       setNewMustahiq(prev => ({
  //         ...prev,
  //         kelurahan_id: selectedKelurahan.id,
  //       }));
  //     }
  //   }
  // }, [newMustahiq.desa_kelurahan]);

  const handleRemoveFile = (type: string, index: number) => {
    if (type === "foto_kondisi") {
      setFilePreviews((prev) => ({
        ...prev,
        foto_kondisi: (prev.foto_kondisi || []).filter((_, i) => i !== index),
      }));
      setNewMustahiq((prev) => ({
        ...prev,
        foto_kondisi: (prev.foto_kondisi || []).filter((_, i) => i !== index),
      }));
    } else {
      setFilePreviews((prev) => ({ ...prev, [type]: "" }));
      setNewMustahiq((prev) => ({ ...prev, [type]: null }));
    }
  };
  

  const handleAddMustahiq = async () => {
    if (!validateForm()) {
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
  
    setLoading(true);
    console.log("Submitting form data:", newMustahiq);
    try {
      const formData = new FormData()

      formData.append("NIK", newMustahiq.no_ktp)
      formData.append("nama", newMustahiq.nama)
      formData.append("jenis_kelamin", newMustahiq.jenis_kelamin)
      formData.append("tempat_lahir", newMustahiq.tempat_lahir)
      formData.append("tanggal_lahir", newMustahiq.tanggal_lahir)

      formData.append("asnaf", JSON.stringify(newMustahiq.asnaf))

      formData.append("no_telepon", newMustahiq.no_telepon)
      formData.append("email", newMustahiq.email || "")
      formData.append("alamat", newMustahiq.alamat)

      formData.append("provinsi", String(newMustahiq.provinsi|| ""))
      formData.append("kabupaten", String(newMustahiq.kabupaten_kota || ""))
      formData.append("kecamatan", String(newMustahiq.kecamatan || ""))
      formData.append("kelurahan", String(newMustahiq.desa_kelurahan || ""))

      formData.append("kode_pos", newMustahiq.kode_pos || "")
      formData.append("GPS_lat", newMustahiq.GPS_lat || "")
      formData.append("GPS_long", newMustahiq.GPS_long || "")
      formData.append("status_pernikahan", newMustahiq.status_pernikahan)
      formData.append("pekerjaan", newMustahiq.pekerjaan)
      formData.append("agama", newMustahiq.agama)
      formData.append("pendidikan_terakhir", newMustahiq.pendidikan_terakhir)
      formData.append("jumlah_anggota_kk", newMustahiq.jumlah_anggota_kk)

      if (newMustahiq.foto_kk) formData.append("foto_kk", newMustahiq.foto_kk)
      if (newMustahiq.foto_ktp) formData.append("foto_ktp", newMustahiq.foto_ktp)
      if (newMustahiq.foto_mustahiq) formData.append("foto_mustahiq", newMustahiq.foto_mustahiq)
      if (newMustahiq.foto_kondisi && newMustahiq.foto_kondisi.length > 0) {
        newMustahiq.foto_kondisi.forEach((file) => {
          formData.append("foto_kondisi", file);
        });
      }

      formData.append("tanggal_input", new Date().toISOString().split("T")[0])
      formData.append("nama_penginput", currentUser?.nama || newMustahiq.nama_penginput || "Guest User")

      console.log("Form data being sent:")
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`)
      }

      const response = await fetch("/api/mustahiq", {
        method: "POST",
        body: formData,
      })

      const responseData = await response.json()
      console.log("API response:", responseData)

      if (response.ok) {
        showToast("Mustahiq berhasil ditambahkan!", "success");
        setTimeout(() => {
          router.push("/dashboard/kelola-mustahiq");
        }, 1000); 
      } else {
        let errorMessage = responseData.error || "Terjadi kesalahan";
        showToast(`Gagal menambah mustahiq: ${errorMessage}`, "error");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      showToast(`Terjadi kesalahan saat menambahkan mustahiq: ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/kelola-mustahiq")
  }


  return (
    <div className="flex h-screen bg-[#F5F7FB]">
      <MainSidebar userRole={currentUser?.role || "superadmin"} />
      <main className="flex-1 overflow-auto">
        <TopNav />
        <ToastPortal />

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
              <img src="/images/back-button-circled.svg" alt="Back" className="h-15 w-15" />
            </Button>
            <h1 className="text-3xl font-bold text-[#FCB182E]">Tambah Mustahiq</h1>
          </div> 

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Form Tambah Mustahiq</CardTitle>
            </CardHeader>
            <CardContent>
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
                        value={newMustahiq.nama}
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
                        value={newMustahiq.jenis_kelamin}
                        onValueChange={(value) => handleSelectChange("jenis_kelamin", value)}
                        className="flex items-center gap-4 pt-2"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="Laki-laki" id="Laki-laki" />
                          <Label htmlFor="Laki-laki">Laki-laki</Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="perempuan" id="perempuan" />
                          <Label htmlFor="perempuan">Perempuan</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="no_ktp" className="text-sm font-medium">
                        NIK / Nomor KTP<span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="no_ktp"
                        name="no_ktp"
                        placeholder="Masukkan nomor KTP"
                        value={newMustahiq.no_ktp}
                        onChange={handleInputChange}
                        className={formErrors.no_ktp ? "border-red-500" : ""}
                      />
                      {formErrors.no_ktp && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.no_ktp}
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
                        value={newMustahiq.tempat_lahir}
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
                              !newMustahiq.tanggal_lahir && "text-muted-foreground",
                              formErrors.tanggal_lahir && "border-red-500",
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {newMustahiq.tanggal_lahir ? (
                              format(new Date(newMustahiq.tanggal_lahir), "dd MMMM yyyy", { locale: id })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={newMustahiq.tanggal_lahir ? new Date(newMustahiq.tanggal_lahir) : undefined}
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
                        value={newMustahiq.status_pernikahan}
                        onValueChange={(value) => handleSelectChange("status_pernikahan", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status pernikahan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="belum_menikah">Belum Menikah</SelectItem>
                          <SelectItem value="menikah">Menikah</SelectItem>
                          <SelectItem value="cerai_hidup">Cerai Hidup</SelectItem>
                          <SelectItem value="cerai_mati">Cerai Mati</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="agama" className="text-sm font-medium">
                        Agama<span className="text-red-500">*</span>
                      </Label>
                      <Select value={newMustahiq.agama} onValueChange={(value) => handleSelectChange("agama", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih agama" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="islam">Islam</SelectItem>
                          <SelectItem value="kristen">Kristen</SelectItem>
                          <SelectItem value="katolik">Katolik</SelectItem>
                          <SelectItem value="hindu">Hindu</SelectItem>
                          <SelectItem value="buddha">Buddha</SelectItem>
                          <SelectItem value="konghucu">Konghucu</SelectItem>
                          <SelectItem value="lainnya">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pendidikan_terakhir" className="text-sm font-medium">
                        Pendidikan Terakhir<span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newMustahiq.pendidikan_terakhir}
                        onValueChange={(value) => handleSelectChange("pendidikan_terakhir", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pendidikan terakhir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tidak_sekolah">Tidak Sekolah</SelectItem>
                          <SelectItem value="sd">SD</SelectItem>
                          <SelectItem value="smp">SMP</SelectItem>
                          <SelectItem value="sma">SMA/SMK</SelectItem>
                          <SelectItem value="d1">D1</SelectItem>
                          <SelectItem value="d2">D2</SelectItem>
                          <SelectItem value="d3">D3</SelectItem>
                          <SelectItem value="s1">S1</SelectItem>
                          <SelectItem value="s2">S2</SelectItem>
                          <SelectItem value="s3">S3</SelectItem>
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
                        value={newMustahiq.pekerjaan}
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
                        value={newMustahiq.jumlah_anggota_kk}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Informasi Kategori */}
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
                      <p className="text-red-500 text-sm">{formErrors.asnaf}</p>
                    )}
                  </div>

                  {/* Display selected Asnaf categories */}
                  {newMustahiq.asnaf.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Kategori terpilih: {newMustahiq.asnaf.map(a => {
                          const option = asnafOptions.find(opt => opt.value === a);
                          return option ? option.label : a;
                        }).join(", ")}</p>
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
                        value={newMustahiq.no_telepon}
                        onChange={handleInputChange}
                        className={formErrors.no_telepon ? "border-red-500" : ""}
                      />
                      {formErrors.no_telepon && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.no_telepon}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Nomor telepon harus 10-13 digit angka.</p>
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
                        value={newMustahiq.email}
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

                {/* Informasi Alamat - Dipindahkan ke atas */}
                <div className="border p-4 rounded-md">
                  <h3 className="font-medium text-lg mb-4">Informasi Alamat</h3>
                  <div className="space-y-4">
                    {/* Bagian koordinat GPS dan peta dipindahkan ke atas */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Lokasi</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Input
                            id="GPS_lat"
                            name="GPS_lat"
                            placeholder="Latitude"
                            value={newMustahiq.GPS_lat}
                            onChange={handleCoordinateChange}
                          />
                        </div>
                        <div>
                          <Input
                            id="GPS_long"
                            name="GPS_long"
                            placeholder="Longitude"
                            value={newMustahiq.GPS_long}
                            onChange={handleCoordinateChange}
                          />
                        </div>
                      </div>
                      <div className="h-80 w-full rounded-md overflow-hidden border mt-2">
                        <MapComponent 
                          position={newMustahiq.GPS_lat && newMustahiq.GPS_long 
                            ? [parseFloat(newMustahiq.GPS_lat), parseFloat(newMustahiq.GPS_long)] 
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
                        value={newMustahiq.alamat}
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
                            value={newMustahiq.provinsi}
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
                          value={newMustahiq.kabupaten_kota}
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
                          value={newMustahiq.kecamatan}
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
                          value={newMustahiq.desa_kelurahan}
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
                          value={newMustahiq.kode_pos}
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
                        {filePreviews.foto_ktp ? (
                          <div className="relative space-y-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveFile("foto_ktp", 0)}
                              className="absolute top-1 right-1 bg-white rounded-full shadow p-1 hover:bg-red-100 z-10"
                            >
                              <X size={14} className="text-red-500" />
                            </button>
                            <img
                              src={filePreviews.foto_ktp || "/placeholder.svg"}
                              alt="Preview KTP"
                              className="mx-auto h-40 object-cover rounded-md"
                            />
                            <p className="text-xs text-gray-500 truncate">{newMustahiq.foto_ktp?.name}</p>
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
                          onChange={(e) => handleFileChange(e, true)}
                          accept="image/jpeg,image/png,application/pdf"
                        />
                      </div>
                      {formErrors.foto_ktp && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.foto_ktp}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="foto_kk" className="text-sm font-medium">
                        Foto Kartu Keluarga
                      </Label>
                      <div className="border-2 border-dashed rounded-md p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                        {filePreviews.foto_kk ? (
                          <div className="space-y-2">
                            <img
                              src={filePreviews.foto_kk || "/placeholder.svg"}
                              alt="Preview KK"
                              className="mx-auto h-40 object-cover rounded-md"
                            />
                            <p className="text-xs text-gray-500 truncate">{newMustahiq.foto_kk?.name}</p>
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
                          onChange={(e) => handleFileChange(e, true)}
                          accept="image/jpeg,image/png,application/pdf"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="foto_mustahiq" className="text-sm font-medium">
                        Foto Mustahiq
                      </Label>
                      <div className="border-2 border-dashed rounded-md p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                        {filePreviews.foto_mustahiq ? (
                          <div className="space-y-2">
                            <img
                              src={filePreviews.foto_mustahiq || "/placeholder.svg"}
                              alt="Preview Mustahiq"
                              className="mx-auto h-40 object-cover rounded-md"
                            />
                            <p className="text-xs text-gray-500 truncate">{newMustahiq.foto_mustahiq?.name}</p>
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
                          onChange={(e) => handleFileChange(e, false)}
                          accept="image/jpeg,image/png,application/pdf"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-3">
                      <Label htmlFor="foto_kondisi" className="text-sm font-medium">
                        Foto Kondisi Mustahiq
                      </Label>
                      <div
                        className="border-2 border-dashed rounded-md p-4 text-center hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => document.getElementById("foto_kondisi_input")?.click()}
                      >
                        {filePreviews.foto_kondisi && filePreviews.foto_kondisi.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {filePreviews.foto_kondisi.map((preview: string, index: number) => (
                              <div key={index} className="relative space-y-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile("foto_kondisi", index);
                                  }}
                                  className="absolute top-1 right-1 bg-white rounded-full shadow p-1 hover:bg-red-100"
                                >
                                  <X size={14} className="text-red-500" />
                                </button>
                                {preview.endsWith(".pdf") ? (
                                  <div className="flex flex-col items-center justify-center h-40 bg-gray-100 rounded-md">
                                    <p className="text-sm text-gray-600">PDF File</p>
                                  </div>
                                ) : (
                                  <img
                                    src={preview}
                                    alt={`Kondisi ${index + 1}`}
                                    className="h-40 object-cover rounded-md w-full"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                              <AlertCircle size={32} className="text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">Klik untuk upload</p>
                            <p className="text-xs text-gray-400">JPG, PNG atau PDF (beberapa file, max. 5MB per file)</p>
                          </div>
                        )}
                        <input
                          id="foto_kondisi_input"
                          name="foto_kondisi"
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, true)}
                          accept="image/jpeg,image/png,application/pdf"
                          multiple
                        />
                      </div>
                      {formErrors.foto_kondisi && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.foto_kondisi}
                        </p>
                      )}
                    </div>

                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={handleCancel}>
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#07B0C8] hover:bg-[#07B0C8]/90"
                    onClick={handleAddMustahiq}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      "Tambah Mustahiq"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}