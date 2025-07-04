"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { MainSidebar } from "@/components/main-sidebar"
import { TopNav } from "@/components/dashboard/top-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AlertCircle, BookOpen, Coins, List, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToastStore } from "@/lib/toast-store"
import { ta } from "date-fns/locale"

interface ProgramDetail {
  id: number
  nama_program: string
  bidang_kategori: string
  status: string
  deskripsi?: string
  kriteria?: string
  tanggal_mulai?: string | null
  tanggal_selesai?: string | null
  unit_penyalur?: string
  kepala_program?: number
  nama_mitra?: string
  kategori_mitra?: string
  catatan_mitra?: string
  jumlah_bantuan?: number
  created_at?: string
  updated_at?: string
  created_by?: number | null
  ParameterField?: ParameterField[]
  program_sumber_dana?: {
    sumber_dana: string
    nominal: number
    catatan_sumber_dana?: string | null
  }[]
}

interface ParameterField {
  id: number
  program_id: number
  field_name: string
  field_type: string
  is_required: boolean
  options: string[] | string | null
  description: string | null
  created_at: string
}

interface Mustahiq {
  id: number
  nama: string
  NIK: string
  alamat: string
  jenis_kelamin: string | null
  no_telepon: string
  created_at: string | null
  creator: {
    id: number
    nama: string
  }
  tanggal_input: string | null
}

export default function DetailProgramPage() {
  const router = useRouter()
  const params = useParams()
  const programId = Number(params.id)
  const [program, setProgram] = useState<ProgramDetail | null>(null)
  const [mustahiqs, setMustahiqs] = useState<Mustahiq[]>([])
  const { showToast } = useToastStore()

  useEffect(() => {
    const fetchProgramData = async () => {
      try {
        const response = await fetch(`/api/program/${programId}`)
        if (!response.ok) throw new Error("Failed to fetch program data")
        const programData = await response.json()
        setProgram(programData)
      } catch (error) {
        console.error("Error fetching program data:", error)
      }
    }

    const fetchMustahiqData = async () => {
      try {
        const response = await fetch(`/api/mustahiq/by-program/${programId}`);
        if (!response.ok) throw new Error("Failed to fetch mustahiq data");
        const data = await response.json();
        const mapped = data.map((m: any) => ({
          id: m.id,
          nama: m.nama,
          NIK: m.NIK,
          alamat: m.alamat,
          jenis_kelamin: m.jenis_kelamin ?? null,
          no_telepon: m.no_telepon,
          created_at: m.created_at,
          tanggal_penyaluran: m.tanggal_penyaluran, // Use the penyaluran date
          creator: {
            id: m.creator?.id ?? 0,
            nama: m.creator?.nama ?? "Tidak diketahui",
          },
        }));
        setMustahiqs(mapped);
      } catch (error) {
        console.error("Error fetching mustahiq data:", error);
      }
    };

    fetchProgramData()
    fetchMustahiqData()
  }, [programId])

  const updateProgramStatus = async (status: "active" | "inactive") => {
    try {
      const res = await fetch(`/api/program/${programId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error("Failed to update program")

      const updated = await res.json()
      setProgram(updated.program)

      showToast(
        `Program "${updated.program.nama_program}" berhasil ${status === "active" ? "diaktifkan" : "dinonaktifkan"}.`,
        status === "active" ? "success" : "error"
      )
    } catch (error) {
      showToast("Terjadi kesalahan saat memperbarui status program.", "error")
    }
  }

  const isProgramActive = program?.status === "active"

  // Format date function
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("id-ID")
  }

  // Function to get the badge color based on field type
  const getFieldTypeBadge = (fieldType: string) => {
    const types: Record<string, string> = {
      "text": "bg-blue-100 text-blue-800",
      "number": "bg-purple-100 text-purple-800",
      "date": "bg-green-100 text-green-800",
      "select": "bg-orange-100 text-orange-800",
      "checkbox": "bg-yellow-100 text-yellow-800",
      "file": "bg-red-100 text-red-800"
    }
    return types[fieldType] || "bg-gray-100 text-gray-800"
  }

  // Helper function to safely parse options
  const parseOptions = (options: string[] | string | null): string[] => {
    if (!options) return []
    
    if (Array.isArray(options)) {
      return options
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof options === 'string') {
      try {
        const parsed = JSON.parse(options)
        return Array.isArray(parsed) ? parsed : []
      } catch (e) {
        // If parsing fails, split by comma as fallback
        return options.split(',').map(opt => opt.trim())
      }
    }
    
    return []
  }

  return (
    <div className="flex h-screen bg-[#F5F7FB]">
      <MainSidebar userRole="superadmin" />
      <main className="flex-1 overflow-auto">
        <TopNav />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => router.back()}
            >
              <img
                src="/images/back-button-circled.svg"
                alt="Back"
                className="h-15 w-15"
              />
            </Button>
            <h1 className="text-3xl font-bold text-[#FCB82E]">
              {program?.nama_program || "-"}
            </h1>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100">
                <Tag className="h-5 w-5 text-[#FCB82E] mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Kategori</p>
                  <p className="font-medium">
                    {program?.bidang_kategori
                      ? program.bidang_kategori.charAt(0).toUpperCase() + program.bidang_kategori.slice(1)
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100">
                <Coins className="h-5 w-5 text-[#FCB82E] mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Sumber Dana</p>
                  {program?.program_sumber_dana && program.program_sumber_dana.length > 0 ? (
                    <ul className="text-sm space-y-1 font-medium">
                      {program.program_sumber_dana.map((dana, idx) => (
                        <li key={idx}>
                          {dana.sumber_dana} — Rp{dana.nominal.toLocaleString("id-ID")}{" "}
                          {dana.catatan_sumber_dana && <span className="text-gray-500">({dana.catatan_sumber_dana})</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-medium text-gray-500">-</p>
                  )}
                </div>
              </div>


              <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100">
                <BookOpen className="h-5 w-5 text-[#FCB82E] mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge
                    className={
                      isProgramActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }
                  >
                    {isProgramActive ? "Aktif" : "Non-aktif"}
                  </Badge>
                </div>
              </div>
              
              {program?.tanggal_mulai && (
                <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Periode</p>
                    <p className="font-medium">
                      {formatDate(program.tanggal_mulai)} - {formatDate(program.tanggal_selesai)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end mb-4">
            {isProgramActive ? (
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => updateProgramStatus("inactive")}
              >
                Nonaktifkan Program
              </Button>
            ) : (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => updateProgramStatus("active")}
              >
                Aktifkan Program
              </Button>
            )}
          </div>

          {/* Program Description */}
          {program?.deskripsi && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Deskripsi Program</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{program.deskripsi}</p>
                
                {program.kriteria && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-1">Kriteria:</h3>
                    <p className="text-sm text-gray-700">{program.kriteria}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Parameter Fields */}
          {program?.ParameterField && program.ParameterField.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Parameter Program</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Field</TableHead>
                      <TableHead>Tipe Field</TableHead>
                      <TableHead>Wajib</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Opsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {program.ParameterField.map((field) => {
                      const optionsList = parseOptions(field.options)
                      
                      return (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">{field.field_name}</TableCell>
                          <TableCell>
                            <Badge className={getFieldTypeBadge(field.field_type)}>
                              {field.field_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {field.is_required ? (
                              <Badge className="bg-green-100 text-green-800">Ya</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">Tidak</Badge>
                            )}
                          </TableCell>
                          <TableCell>{field.description || "-"}</TableCell>
                          <TableCell>
                            {optionsList.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {optionsList.map((option, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {option}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Mustahiq Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Mustahiq Terdaftar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>NAMA</TableHead>
                    <TableHead>NO KTP</TableHead>
                    <TableHead>ALAMAT</TableHead>
                    <TableHead>NO HP</TableHead>
                    <TableHead>TANGGAL PENYALURAN</TableHead>
                    <TableHead>PENGINPUT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mustahiqs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <AlertCircle size={24} className="mb-2" />
                          <p>Tidak ada mustahiq terdaftar pada program ini.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    mustahiqs.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.id}</TableCell>
                        <TableCell className="font-medium">{m.nama}</TableCell>
                        <TableCell>{m.NIK}</TableCell>
                        <TableCell>{m.alamat}</TableCell>
                        <TableCell>{m.no_telepon}</TableCell>
                        <TableCell>{formatDate(m.tanggal_penyaluran)}</TableCell>
                        <TableCell>{m.creator?.nama || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}