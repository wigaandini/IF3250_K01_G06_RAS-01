"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { MainSidebar } from "@/components/main-sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToastStore } from "@/lib/toast-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParameterField {
  id: number;
  field_name: string;
  field_type: string;
  is_required: boolean;
  description?: string;
  value?: any;
}

interface MustahiqOption {
  id: number;
  nama: string;
  NIK: string;
}

export default function EditPenyaluranPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id; // Use route parameter instead of query parameter
  const { showToast } = useToastStore();

  const [mustahiqList, setMustahiqList] = useState<MustahiqOption[]>([]);
  const [programList, setProgramList] = useState<any[]>([]);
  const [fields, setFields] = useState<ParameterField[]>([]);
  const [selectedMustahiqId, setSelectedMustahiqId] = useState<number | null>(
    null
  );
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(
    null
  );
  const [tanggal, setTanggal] = useState("");
  const [jumlah, setJumlah] = useState<number>(0);
  const [catatan, setCatatan] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  const mustahiqRef = useRef<HTMLButtonElement>(null);
  const programRef = useRef<HTMLButtonElement>(null);
  const [mustahiqWidth, setMustahiqWidth] = useState(0);
  const [programWidth, setProgramWidth] = useState(0);
  const [mustahiqOpen, setMustahiqOpen] = useState(false);
  const [programOpen, setProgramOpen] = useState(false);
  const [coaList, setCoaList] = useState<
    { id: number; kode: string; jenis_transaksi: string }[]
  >([]);
  const [selectedCoaDebtId, setSelectedCoaDebtId] = useState<number | null>(null);
  const [selectedCoaCredId, setSelectedCoaCredId] = useState<number | null>(null);

  // Fetch mustahiq and program data
  useEffect(() => {
    Promise.all([
      fetch("/api/mustahiq").then((res) => res.json()),
      fetch("/api/program").then((res) => res.json()),
      fetch("/api/coa").then((res) => res.json()),
    ])
      .then(([mustahiqData, programData, coaData]) => {
        setMustahiqList(mustahiqData);
        setProgramList(programData);
        setCoaList(coaData);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        showToast("Gagal memuat data mustahiq atau program", "error");
      });
  }, [showToast]);

  // Fetch penyaluran data
  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetch(`/api/penyaluran/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch data");
          return res.json();
        })
        .then((data) => {
          console.log("API Response:", data);

          setSelectedMustahiqId(data.mustahiq_id);
          setSelectedProgramId(data.program_id);
          setSelectedCoaDebtId(data.coa_debt.id || null);
          setSelectedCoaCredId(data.coa_cred.id || null);
          console.log("Selected CoA ID:", data.coa);
          setTanggal(data.tanggal || "");
          setJumlah(data.jumlah || 0);
          setCatatan(data.catatan || "");

          if (Array.isArray(data.parameter_values)) {
            setFields(data.parameter_values);
          } else {
            console.warn(
              "parameter_values is not an array:",
              data.parameter_values
            );
            setFields([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching penyaluran:", err);
          showToast("Gagal memuat data penyaluran", "error");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, showToast]);

  useEffect(() => {
    if (programOpen && programRef.current) {
      setProgramWidth(programRef.current.offsetWidth);
    }
    if (mustahiqOpen && mustahiqRef.current) {
      setMustahiqWidth(mustahiqRef.current.offsetWidth);
    }
  }, [mustahiqOpen, programOpen]);

  const loadProgramParameters = async (programId: number) => {
    try {
      const res = await fetch(`/api/program/${programId}/parameters`);
      if (!res.ok) throw new Error("Failed to fetch program parameters");
      const { parameterFields } = await res.json();
      if (!Array.isArray(parameterFields)) {
        showToast("Data parameter tidak valid", "error");
        return;
      }

      const updatedFields = parameterFields.map((param: any) => {
        const existingField = fields.find((f) => f.id === param.id);
        return {
          ...param,
          value: existingField?.value || "",
        };
      });

      setFields(updatedFields);
    } catch (error) {
      console.error("Error loading program parameters:", error);
      showToast("Gagal memuat parameter program", "error");
    }
  };

  useEffect(() => {
    if (selectedProgramId) {
      loadProgramParameters(selectedProgramId);
    }
  }, [selectedProgramId]);

  const handleFieldChange = (index: number, value: string) => {
    const updated = [...fields];
    updated[index].value = value;
    setFields(updated);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!selectedMustahiqId) errors.push("Mustahiq harus dipilih");
    if (!selectedProgramId) errors.push("Program harus dipilih");
    if (!tanggal) errors.push("Tanggal penyaluran harus diisi");

    const missingRequiredFields = fields
      .filter((f) => f.is_required && !f.value)
      .map((f) => f.field_name);

    if (missingRequiredFields.length > 0) {
      errors.push(`Field wajib: ${missingRequiredFields.join(", ")}`);
    }

    const invalidNumberFields = fields
      .filter(
        (f) => f.field_type === "number" && f.value && isNaN(Number(f.value))
      )
      .map((f) => f.field_name);

    if (invalidNumberFields.length > 0) {
      errors.push(
        `Format angka tidak valid untuk: ${invalidNumberFields.join(", ")}`
      );
    }

    const invalidDateFields = fields
      .filter(
        (f) => f.field_type === "date" && f.value && isNaN(Date.parse(f.value))
      )
      .map((f) => f.field_name);

    if (invalidDateFields.length > 0) {
      errors.push(
        `Format tanggal tidak valid untuk: ${invalidDateFields.join(", ")}`
      );
    }

    if (errors.length > 0) {
      showToast(errors.join(". "), "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedMustahiqId || !selectedProgramId || !tanggal) {
      return showToast("Harap isi semua field wajib", "error");
    }

    if (!validateForm()) {
      showToast(
        "Terdapat kesalahan dalam form. Silakan periksa kembali.",
        "error"
      );
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/penyaluran/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mustahiq_id: selectedMustahiqId,
          program_id: selectedProgramId,
          tanggal,
          jumlah,
          catatan,
          coa_debt_id: selectedCoaDebtId,
          coa_cred_id: selectedCoaCredId,
          status: "delivered",
          parameterValues: fields.map((f) => ({
            field_id: f.id,
            value: f.value || "",
            program_id: selectedProgramId,
            mustahiq_id: selectedMustahiqId,
          })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal update");
      }

      showToast("Penyaluran berhasil diperbarui", "success");
      router.push("/dashboard/kelola-penyaluran");
    } catch (err) {
      console.error("Save error:", err);
      showToast("Gagal menyimpan data", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard/kelola-penyaluran");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#F5F7FB]">
        <MainSidebar userRole="superadmin" />
        <main className="flex-1">
          <TopNav />
          <div className="p-6 flex justify-center items-center h-[calc(100vh-64px)]">
            <p className="text-lg">Loading data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F7FB]">
      <MainSidebar userRole="superadmin" />
      <main className="flex-1">
        <TopNav />
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleBack}
            >
              <Image
                src="/images/back-button-circled.svg"
                alt="Back"
                width={30}
                height={30}
                className="h-8 w-8"
                priority
              />
            </Button>
            <h1 className="text-3xl font-bold text-[#FCB82E]">
              Edit Penyaluran
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700">
                Pilih Mustahiq
                <span className="text-red-500">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={mustahiqOpen} onOpenChange={setMustahiqOpen}>
                <PopoverTrigger asChild>
                  <Button
                    ref={mustahiqRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={mustahiqOpen}
                    className="w-full justify-between"
                  >
                    {selectedMustahiqId
                      ? mustahiqList.find((m) => m.id === selectedMustahiqId)
                          ?.nama || "Pilih Mustahiq"
                      : "Pilih Mustahiq"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  style={{ width: mustahiqWidth }}
                  className="p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Cari mustahiq..." />
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {mustahiqList.map((m) => (
                        <CommandItem
                          key={m.id}
                          value={`${m.nama} ${m.NIK}`}
                          onSelect={() => {
                            setSelectedMustahiqId(m.id);
                            setMustahiqOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedMustahiqId === m.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {m.nama} - {m.NIK}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700">
                Pilih Program
                <span className="text-red-500">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={programOpen} onOpenChange={setProgramOpen}>
                <PopoverTrigger asChild>
                  <Button
                    ref={programRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={programOpen}
                    className="w-full justify-between"
                  >
                    {selectedProgramId
                      ? programList.find((p) => p.id === selectedProgramId)
                          ?.nama_program || "Pilih Program"
                      : "Pilih Program"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  style={{ width: programWidth }}
                  className="p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Cari program..." />
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {programList.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.nama_program}
                          onSelect={() => {
                            setSelectedProgramId(p.id);
                            setProgramOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProgramId === p.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {p.nama_program}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700">
                Form Penyaluran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>
                  Tanggal Penyaluran <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Jumlah</Label>
                <Input
                  type="number"
                  value={jumlah}
                  onChange={(e) => setJumlah(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>
                  Chart of Accounts - CoA Debet{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={selectedCoaDebtId !== null ? String(selectedCoaDebtId) : ""}
                  onChange={(e) => setSelectedCoaDebtId(parseInt(e.target.value))}
                >
                  <option value="">Pilih CoA</option>
                  {coaList.length > 0 &&
                    coaList.map((coa) => (
                      <option key={coa.id} value={String(coa.id)}>
                        {coa.kode} - {coa.jenis_transaksi}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <Label>
                  Chart of Accounts - CoA Kredit{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={selectedCoaCredId !== null ? String(selectedCoaCredId) : ""}
                  onChange={(e) => setSelectedCoaCredId(parseInt(e.target.value))}
                >
                  <option value="">Pilih CoA</option>
                  {coaList.length > 0 &&
                    coaList.map((coa) => (
                      <option key={coa.id} value={String(coa.id)}>
                        {coa.kode} - {coa.jenis_transaksi}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <Label>Catatan</Label>
                <Textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
              {fields.map((f, i) => (
                <div key={f.id}>
                  <Label>
                    {f.field_name}
                    {f.is_required && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    value={f.value || ""}
                    onChange={(e) => handleFieldChange(i, e.target.value)}
                  />
                  {f.description && (
                    <p className="text-sm text-gray-500 italic">
                      {f.description}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-[#FCB82E]"
            >
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
