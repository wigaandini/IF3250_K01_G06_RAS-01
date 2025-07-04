"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useRouter, useParams } from "next/navigation"
import { MainSidebar } from "@/components/main-sidebar"
import { TopNav } from "@/components/dashboard/top-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2 } from "lucide-react"
import { useToastStore } from "@/lib/toast-store"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

interface ParameterField {
  id?: number
  field_name: string
  field_type: string
  is_required?: boolean
  options?: string[]
  description?: string
  value?: any
}

interface ProgramSumberDana {
  id?: number
  sumber_dana: string
  nominal: number
  catatan_sumber_dana?: string
}

interface Program {
  id: number
  nama_program: string
  bidang_kategori: string
  status: boolean
  ParameterField?: ParameterField[]
  unit_penyalur?: string
  kepala_program?: string
  nama_mitra?: string
  kategori_mitra?: string
  catatan_mitra?: string
  deskripsi?: string
  kriteria?: string
  jumlah_bantuan?: number
  tanggal_mulai?: string
  tanggal_selesai?: string
  program_sumber_dana?: ProgramSumberDana[]
}

// interface Program {
//   id: number;
//   nama: string;
//   kategori: string;
//   sumber_dana: string;
//   aktif: boolean;
//   additionalAttributes?: Record<string, any>;
// }

export default function EditProgramPage() {
  const router = useRouter()
  const params = useParams()
  const programId = params.id
  const { showToast } = useToastStore()

  const [programData, setProgramData] = useState<Program>({
    id: 0,
    nama_program: "",
    bidang_kategori: "",
    status: false,
  })

  const [attributes, setAttributes] = useState<ParameterField[]>([])
  const [newAttribute, setNewAttribute] = useState<ParameterField>({ field_name: "", field_type: "text" })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [sumberDanaList, setSumberDanaList] = useState<
    { sumber_dana: string; nominal: number; catatan_sumber_dana: string }[]
  >([])

  const updateSumberDana = (index: number, updatedItem: { sumber_dana: string; nominal: number; catatan_sumber_dana: string }) => {
    const updatedList = [...sumberDanaList]
    updatedList[index] = updatedItem
    setSumberDanaList(updatedList)
  }

  const removeSumberDana = (index: number) => {
    const updatedList = [...sumberDanaList]
    updatedList.splice(index, 1)
    setSumberDanaList(updatedList)
  }
  
  useEffect(() => {
    const fetchProgramData = async () => {
      if (!programId) return
      setIsLoading(true)

      try {
        const response = await fetch(`/api/program/${programId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch program data")
        }

        const program = await response.json()
        setProgramData({
          id: program.id,
          nama_program: program.nama_program,
          bidang_kategori: program.bidang_kategori,
          status: program.status === "active",
          unit_penyalur: program.unit_penyalur,
          kepala_program: program.kepala_program,
          nama_mitra: program.nama_mitra,
          kategori_mitra: program.kategori_mitra,
          catatan_mitra: program.catatan_mitra,
          deskripsi: program.deskripsi,
          kriteria: program.kriteria,
          jumlah_bantuan: program.jumlah_bantuan,
          tanggal_mulai: program.tanggal_mulai,
          tanggal_selesai: program.tanggal_selesai,
        })

        if (program.program_sumber_dana && program.program_sumber_dana.length > 0) {
          setSumberDanaList(program.program_sumber_dana)
        }        

        if (program.ParameterField && program.ParameterField.length > 0) {
          setAttributes(
            program.ParameterField.map((field: ParameterField) => ({
              id: field.id,
              field_name: field.field_name,
              field_type: field.field_type,
              is_required: field.is_required,
              options: field.options,
              description: field.description,
            })),
          )
        }
      } catch (error) {
        console.error("Error fetching program data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgramData()
  }, [programId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProgramData({
      ...programData,
      [name]: value,
    })
  }

  const handleSelectChange = <K extends keyof Program>(key: K, value: Program[K]) => {
    setProgramData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const addAttribute = () => {
    if (!newAttribute.field_name.trim()) {
      showToast("Nama atribut tidak boleh kosong", "error")
      return
    }

    if (attributes.some(attr => attr.field_name === newAttribute.field_name)) {
      showToast("Nama atribut harus unik", "error")
      return
    }

    setAttributes([...attributes, newAttribute])
    setNewAttribute({ field_name: "", field_type: "text", is_required: false, description: "" })
  }

  const removeAttribute = (index: number) => {
    const updatedAttributes = [...attributes]
    updatedAttributes.splice(index, 1)
    setAttributes(updatedAttributes)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields validation
    const requiredFields = [
      { field: 'nama_program', message: 'Nama program harus diisi' },
      { field: 'bidang_kategori', message: 'Kategori program harus dipilih' }
    ]

    requiredFields.forEach(({ field, message }) => {
      if (!programData[field as keyof typeof programData]) {
        newErrors[field] = message
      }
    })

    // Sumber dana validation
    sumberDanaList.forEach((item, index) => {
      if (!item.sumber_dana) {
        newErrors[`sumber_dana_${index}`] = 'Sumber dana harus dipilih'
      }
      if (item.nominal <= 0) {
        newErrors[`nominal_${index}`] = 'Nominal harus lebih dari 0'
      }
    })

    // Deskripsi length validation
    if (programData.deskripsi && programData.deskripsi.length > 1000) {
      newErrors['deskripsi'] = 'Deskripsi maksimal 1000 karakter'
    }

    if (programData.deskripsi == "") {
      newErrors['deskripsi'] = 'Deskripsi program harus diisi'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showToast("Terdapat kesalahan dalam form. Silakan periksa kembali.", "error")
      return
    }
    
    setIsSaving(true)

    try {
      const payload = {
        nama_program: programData.nama_program,
        bidang_kategori: programData.bidang_kategori,
        status: programData.status ? "active" : "inactive",
        unit_penyalur: programData.unit_penyalur || "",
        kepala_program: programData.kepala_program ? Number.parseInt(programData.kepala_program) : "1",
        nama_mitra: programData.nama_mitra || "",
        kategori_mitra: programData.kategori_mitra || "",
        catatan_mitra: programData.catatan_mitra || "",
        deskripsi: programData.deskripsi || "",
        kriteria: programData.kriteria || "",
        jumlah_bantuan: programData.jumlah_bantuan || 0,
        tanggal_mulai: programData.tanggal_mulai || null,
        tanggal_selesai: programData.tanggal_selesai || null,
        parameterFields: attributes.map((attr) => ({
          field_name: attr.field_name,
          field_type: attr.field_type,
          is_required: attr.is_required || false,
          description: attr.description || "",
        })),
        program_sumber_dana: sumberDanaList,
      }

      const response = await fetch(`/api/program/${programId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to update program")
      }

      showToast("Program berhasil diperbarui!", "success")

      router.push("/dashboard/kelola-program")
    } catch (error) {
      console.error("Error updating program:", error)
      showToast("Gagal memperbarui program. Silakan coba lagi.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    router.push("/dashboard/kelola-program")
  }

  const renderAttributeInput = (attribute: ParameterField, index: number) => {
    switch (attribute.field_type) {
      case "text":
        return (
          <Input
            id={`preview-${attribute.field_name}`}
            value={attribute.value || ""}
            onChange={(e) => handleAttributeValueChange(index, e.target.value)}
            className="w-full"
            placeholder={`Masukkan ${attribute.field_name.toLowerCase()}`}
          />
        )
      case "number":
        return (
          <Input
            id={`preview-${attribute.field_name}`}
            type="number"
            value={attribute.value || ""}
            onChange={(e) => handleAttributeValueChange(index, Number.parseFloat(e.target.value) || 0)}
            className="w-full"
            placeholder={`Masukkan ${attribute.field_name.toLowerCase()}`}
          />
        )
      case "textarea":
        return (
          <Textarea
            id={`preview-${attribute.field_name}`}
            value={attribute.value || ""}
            onChange={(e) => handleAttributeValueChange(index, e.target.value)}
            className="w-full min-h-24"
            placeholder={`Masukkan ${attribute.field_name.toLowerCase()}`}
          />
        )
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`preview-${attribute.field_name}`}
              checked={attribute.value || false}
              onCheckedChange={(checked) => handleAttributeValueChange(index, !!checked)}
            />
            <Label htmlFor={`preview-${attribute.field_name}`}>Ya</Label>
          </div>
        )
      case "date":
        return (
          <Input
            id={`preview-${attribute.field_name}`}
            type="date"
            value={attribute.value || ""}
            onChange={(e) => handleAttributeValueChange(index, e.target.value)}
            className="w-full"
          />
        )
      default:
        return (
          <Input
            id={`preview-${attribute.field_name}`}
            value={attribute.value || ""}
            onChange={(e) => handleAttributeValueChange(index, e.target.value)}
            className="w-full"
            placeholder={`Masukkan ${attribute.field_name.toLowerCase()}`}
          />
        )
    }
  }

  const handleAttributeValueChange = (index: number, value: any) => {
    const updatedAttributes = [...attributes]
    updatedAttributes[index] = { ...updatedAttributes[index], value }
    setAttributes(updatedAttributes)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#F5F7FB]">
        <MainSidebar userRole="superadmin" />
        <main className="flex-1 flex items-center justify-center">
          <div className="relative w-full h-[calc(100vh-64px-200px)] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b2c2]"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F5F7FB]">
      <MainSidebar userRole="superadmin" />
      <main className="flex-1">
        <TopNav />
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" className="mr-2 p-0 h-auto" onClick={handleBack}>
              <img src="/images/back-button-circled.svg" alt="Back" className="h-8 w-8" />
            </Button>
            <h1 className="text-3xl font-bold text-[#FCB82E]">Edit Program</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Informasi Dasar Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Program<span className="text-red-500">*</span></Label>
                    <Input
                      id="nama_program"
                      name="nama_program"
                      value={programData.nama_program}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama program"
                      className={errors.nama_program ? 'border-red-500' : ''}
                    />
                    {errors.nama_program && <p className="text-red-500 text-sm">{errors.nama_program}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kategori">Kategori<span className="text-red-500">*</span></Label>
                    <Select
                      value={programData.bidang_kategori}
                      onValueChange={(value) => handleSelectChange("bidang_kategori", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendidikan">Pendidikan</SelectItem>
                        <SelectItem value="Kesehatan">Kesehatan</SelectItem>
                        <SelectItem value="Ekonomi">Ekonomi</SelectItem>
                        <SelectItem value="Dakwah-Advokasi">Dakwah-Advokasi</SelectItem>
                        <SelectItem value="Kemanusiaan">Kemanusiaan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deskripsi">Deskripsi Program<span className="text-red-500">*</span></Label>
                    <Textarea
                      id="deskripsi"
                      name="deskripsi"
                      value={programData.deskripsi || ""}
                      onChange={(e) => handleInputChange(e)}
                      placeholder="Masukkan deskripsi program"
                      className="min-h-[100px]"
                    />
                    {errors.deskripsi && (
                      <p className="text-red-500 text-xs mt-1">{errors.deskripsi}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="aktif"
                      name="aktif"
                      checked={programData.status}
                      onCheckedChange={(checked) => handleSelectChange("status", checked)}
                    />
                    <Label htmlFor="aktif">Program Aktif</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Sumber Dana<span className="text-red-500">*</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sumberDanaList.map((item, index) => (
                  <div className="grid grid-cols-12 gap-4" key={index}>
                    <div className="col-span-3">
                      <Label>Sumber Dana</Label>
                      <Select
                        value={item.sumber_dana}
                        onValueChange={(value) =>
                          updateSumberDana(index, { ...item, sumber_dana: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih sumber dana" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Zakat">Zakat</SelectItem>
                          <SelectItem value="Infaq">Infaq</SelectItem>
                          <SelectItem value="Sedekah">Sedekah</SelectItem>
                          <SelectItem value="CSR">CSR</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors[`sumber_dana_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`sumber_dana_${index}`]}</p>
                      )}
                    </div>
                    <div className="col-span-3">
                      <Label>Nominal</Label>
                      <Input
                        type="number"
                        value={item.nominal}
                        onChange={(e) =>
                          updateSumberDana(index, {
                            ...item,
                            nominal: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      {errors[`nominal_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`nominal_${index}`]}</p>
                      )}
                    </div>
                    <div className="col-span-4">
                      <Label>Catatan</Label>
                      <Input
                        value={item.catatan_sumber_dana}
                        onChange={(e) =>
                          updateSumberDana(index, {
                            ...item,
                            catatan_sumber_dana: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2 flex items-end justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeSumberDana(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  className="bg-[#07B0C8] hover:bg-[#07B0C8]/90"
                  onClick={() =>
                    setSumberDanaList([
                      ...sumberDanaList,
                      { sumber_dana: "", nominal: 0, catatan_sumber_dana: "" },
                    ])
                  }
                >
                  <Plus className="mr-2" size={16} /> Tambah Sumber Dana
                </Button>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Atribut Program</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {attributes.length > 0 ? (
                    <>
                      <div className="grid grid-cols-12 gap-4 px-3 py-2 bg-gray-100 rounded-t-lg font-medium text-sm">
                        <div className="col-span-4">Nama Atribut</div>
                        <div className="col-span-3">Tipe Data</div>
                        <div className="col-span-3">Status</div>
                        <div className="col-span-2 text-right">Aksi</div>
                      </div>
                      {attributes.map((attr, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-4 items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                        >
                          <div className="col-span-4 font-medium">{attr.field_name}</div>
                          <div className="col-span-3 text-sm text-gray-600 capitalize">
                            {attr.field_type === "textarea"
                              ? "Text Panjang"
                              : attr.field_type === "number"
                                ? "Number"
                                : attr.field_type === "checkbox"
                                  ? "Checkbox"
                                  : attr.field_type === "date"
                                    ? "Tanggal"
                                    : "Text"}
                          </div>
                          <div className="col-span-3">
                            {attr.is_required ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Wajib</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Opsional</span>
                            )}
                          </div>
                          <div className="col-span-2 flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAttribute(index)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                      Belum ada atribut tambahan. Tambahkan atribut untuk mengumpulkan data spesifik program.
                    </div>
                  )}

                  <div className="border-t pt-4 mt-2 space-y-4">
                    <h3 className="font-medium text-sm text-gray-700">Tambah Atribut Baru</h3>
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-4">
                        <Label htmlFor="field_name">Nama Atribut</Label>
                        <Input
                          id="field_name"
                          value={newAttribute.field_name}
                          onChange={(e) => setNewAttribute({ ...newAttribute, field_name: e.target.value })}
                          placeholder="Contoh: BB Awal"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor="field_type">Tipe Data</Label>
                        <Select
                          value={newAttribute.field_type}
                          onValueChange={(value) => setNewAttribute({ ...newAttribute, field_type: value })}
                        >
                          <SelectTrigger id="field_type">
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="textarea">Text Panjang</SelectItem>
                            {/* <SelectItem value="checkbox">Checkbox</SelectItem> */}
                            <SelectItem value="date">Tanggal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 flex items-end">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_required"
                            checked={newAttribute.is_required}
                            onCheckedChange={(checked) => setNewAttribute({ ...newAttribute, is_required: !!checked })}
                          />
                          <Label htmlFor="is_required">Wajib diisi</Label>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-end">
                        <Button
                          type="button"
                          onClick={addAttribute}
                          className="bg-[#07B0C8] hover:bg-[#07B0C8]/90 w-full"
                          disabled={!newAttribute.field_name.trim()}
                        >
                          <Plus className="mr-2" size={16} /> Tambah
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12">
                        <Label htmlFor="description">Deskripsi Atribut (Opsional)</Label>
                        <Input
                          id="description"
                          value={newAttribute.description || ""}
                          onChange={(e) => setNewAttribute({ ...newAttribute, description: e.target.value })}
                          placeholder="Deskripsi bantuan untuk pengisian atribut ini"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {attributes.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Preview Atribut</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attributes.map((attr, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`preview-${attr.field_name}`}>
                            {attr.field_name}
                            {attr.is_required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {attr.description && <span className="text-xs text-gray-500 italic">{attr.description}</span>}
                        </div>
                        {renderAttributeInput(attr, index)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#FCB82E] hover:bg-[#FCB82E]/90" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
