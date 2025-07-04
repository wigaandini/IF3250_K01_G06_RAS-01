"use client"
import { useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { MainSidebar } from "@/components/main-sidebar"
import { TopNav } from "@/components/dashboard/top-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { useToastStore } from "@/lib/toast-store"

interface ParameterField {
  field_name: string
  field_type: string
  is_required?: boolean
  options?: string[]
  description?: string
  value?: any
}

interface SumberDana {
  sumber_dana: string
  nominal: number
  catatan_sumber_dana: string
}

export default function ProgramPage() {
  const router = useRouter()
  const { showToast } = useToastStore()

  // Base program data
  const [programData, setProgramData] = useState({
    nama_program: "",
    bidang_kategori: "",
    sumber_dana: "",
    status: "active",
    unit_penyalur: "",
    kepala_program: "",
    nama_mitra: "",
    kategori_mitra: "",
    catatan_mitra: "",
    deskripsi: "",
    kriteria: "",
    jumlah_bantuan: 0,
    tanggal_mulai: "",
    tanggal_selesai: "",
  })

  // Dynamic attributes
  const [attributes, setAttributes] = useState<ParameterField[]>([])
  const [newAttribute, setNewAttribute] = useState<ParameterField>({ field_name: "", field_type: "text" })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sumberDanaList, setSumberDanaList] = useState<SumberDana[]>([
    { sumber_dana: "", nominal: 0, catatan_sumber_dana: "" }
  ])

  // Handle program input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProgramData({
      ...programData,
      [name]: value,
    })
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle select change
  const handleSelectChange = (name: string, value: string | number | boolean) => {
    setProgramData({
      ...programData,
      [name]: value,
    })
    // Clear error when user selects
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
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
    const newAttributes = [...attributes]
    newAttributes.splice(index, 1)
    setAttributes(newAttributes)
  }

  const handleAttributeValueChange = (index: number, value: any) => {
    const newAttributes = [...attributes]
    newAttributes[index] = { ...newAttributes[index], value }
    setAttributes(newAttributes)
  }

  const updateSumberDana = (index: number, key: keyof SumberDana, value: any) => {
    const newList = [...sumberDanaList]
    newList[index] = { ...newList[index], [key]: value }
    setSumberDanaList(newList)

    // Clear error when user updates
    if (errors[`sumber_dana_${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`sumber_dana_${index}`]
        return newErrors
      })
    }
  }

  const addSumberDana = () => {
    setSumberDanaList([...sumberDanaList, { sumber_dana: "", nominal: 0, catatan_sumber_dana: "" }])
  }

  const removeSumberDana = (index: number) => {
    const newList = [...sumberDanaList]
    newList.splice(index, 1)
    setSumberDanaList(newList)
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
    if (programData.deskripsi.length > 1000) {
      newErrors['deskripsi'] = 'Deskripsi maksimal 1000 karakter'
    }

    if (programData.deskripsi == "") {
      newErrors['deskripsi'] = 'Deskripsi program harus diisi'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        status: programData.status,
        unit_penyalur: programData.unit_penyalur,
        kepala_program: programData.kepala_program ? parseInt(programData.kepala_program) : 1,
        nama_mitra: programData.nama_mitra,
        kategori_mitra: programData.kategori_mitra,
        catatan_mitra: programData.catatan_mitra,
        deskripsi: programData.deskripsi,
        kriteria: programData.kriteria,
        jumlah_bantuan: programData.jumlah_bantuan,
        tanggal_mulai: programData.tanggal_mulai || null,
        tanggal_selesai: programData.tanggal_selesai || null,
        parameterFields: attributes.map((attr) => ({
          field_name: attr.field_name,
          field_type: attr.field_type,
          is_required: attr.is_required || false,
          description: attr.description || "",
        })),
        sumber_dana_list: sumberDanaList
      }

      const response = await fetch("/api/program", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to create program")
      }

      showToast("Program berhasil ditambahkan!", "success")
      router.push("/dashboard/kelola-program")
    } catch (error) {
      console.error("Error creating program:", error)
      showToast("Gagal menambahkan program. Silakan coba lagi.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Back navigation
  const handleBack = () => {
    router.push("/dashboard/kelola-program")
  }

  // Render input field based on attribute type
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
            <h1 className="text-3xl font-bold text-[#FCB82E]">Tambah Program</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Informasi Dasar Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama_program">Nama Program<span className="text-red-500">*</span></Label>
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
                    <Label htmlFor="bidang_kategori">Kategori<span className="text-red-500">*</span></Label>
                    <Select
                      value={programData.bidang_kategori}
                      onValueChange={(value) => handleSelectChange("bidang_kategori", value)}
                    >
                      <SelectTrigger className={errors.bidang_kategori ? 'border-red-500' : ''}>
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
                    {errors.bidang_kategori && <p className="text-red-500 text-sm">{errors.bidang_kategori}</p>}
                  </div>
                  

                  <div className="space-y-4">
                    <Label className="block text-sm font-medium">Sumber Dana (Multi)<span className="text-red-500">*</span></Label>
                    {sumberDanaList.map((entry, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3">
                          <Select
                            value={entry.sumber_dana}
                            onValueChange={(value) => updateSumberDana(index, "sumber_dana", value)}
                          >
                            <SelectTrigger className={errors[`sumber_dana_${index}`] ? 'border-red-500' : ''}>
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
                            <p className="text-red-500 text-sm">{errors[`sumber_dana_${index}`]}</p>
                          )}
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="Nominal"
                            value={entry.nominal}
                            onChange={(e) => updateSumberDana(index, "nominal", Number(e.target.value))}
                            className={errors[`nominal_${index}`] ? 'border-red-500' : ''}
                          />
                          {errors[`nominal_${index}`] && (
                            <p className="text-red-500 text-sm">{errors[`nominal_${index}`]}</p>
                          )}
                        </div>
                        <div className="col-span-5">
                          <Input
                            placeholder="Catatan (mis. PT Paragon)"
                            value={entry.catatan_sumber_dana}
                            onChange={(e) => updateSumberDana(index, "catatan_sumber_dana", e.target.value)}
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {index > 0 && (
                            <Button variant="ghost" size="icon" onClick={() => removeSumberDana(index)}>
                              <Trash2 size={16} className="text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addSumberDana} className="mt-2">
                      <Plus className="mr-2" size={16} /> Tambah Sumber Dana
                    </Button>
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
                      id="status"
                      name="status"
                      checked={programData.status === "active"}
                      onCheckedChange={(checked) => {
                        setProgramData({
                          ...programData,
                          status: checked ? "active" : "inactive"
                        });
                      }}
                    />
                    <Label htmlFor="status">Program Aktif</Label>
                  </div>
                </div>
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
                {isSaving ? "Menyimpan..." : "Simpan Program"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}