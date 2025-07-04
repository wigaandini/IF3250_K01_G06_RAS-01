"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MainSidebar } from "@/components/main-sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToastStore } from "@/lib/toast-store";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";

interface MustahiqOption {
  id: number;
  nama: string;
  NIK: string;
}

interface ParameterField {
  id: number;
  field_name: string;
  field_type: string;
  is_required: boolean;
  description?: string;
  value?: any;
}

export default function CreatePenyaluranPage() {
  const [mustahiqList, setMustahiqList] = useState<MustahiqOption[]>([]);
  const [selectedMustahiqId, setSelectedMustahiqId] = useState<number | null>(
    null
  );
  const [mustahiqOpen, setMustahiqOpen] = useState(false);
  const [programList, setProgramList] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(
    null
  );
  const [programOpen, setProgramOpen] = useState(false);
  const [fields, setFields] = useState<ParameterField[]>([]);
  const [jumlah, setJumlah] = useState(0);
  const [tanggal, setTanggal] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToastStore();
  const router = useRouter();
  const [coaList, setCoaList] = useState<
    { id: number; kode: string; jenis_transaksi: string }[]
  >([]);
  const [selectedCoaDebtId, setSelectedCoaDebtId] = useState<number | null>(null);
  const [selectedCoaCredId, setSelectedCoaCredId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1500);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    fetch("/api/coa")
      .then((res) => res.json())
      .then((data) => setCoaList(data));
  }, []);

  useEffect(() => {
    fetch("/api/mustahiq")
      .then((res) => res.json())
      .then((data) => setMustahiqList(data));
  }, []);

  useEffect(() => {
    fetch("/api/program")
      .then((res) => res.json())
      .then((data) => setProgramList(data));
  }, []);

  useEffect(() => {
    if (selectedProgramId) {
      fetch(`/api/program/${selectedProgramId}`)
        .then((res) => res.json())
        .then((data) =>
          setFields(
            (data?.ParameterField || []).map((f: ParameterField) => ({
              ...f,
              value: "",
            }))
          )
        );
    }
  }, [selectedProgramId]);

  const handleFieldChange = (index: number, value: any) => {
    const updated = [...fields];
    updated[index].value = value;
    setFields(updated);
  };

  const handleBack = () => {
    router.push("/dashboard/kelola-penyaluran");
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

    // Validasi format number
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

    // Validasi format date
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
      return showToast("Isi semua field wajib", "error");
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
      const response = await fetch("/api/penyaluran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mustahiq_id: selectedMustahiqId,
          program_id: selectedProgramId,
          coa_debt_id: selectedCoaDebtId,
          coa_cred_id: selectedCoaCredId,
          tanggal,
          jumlah,
          catatan,
          status: "delivered",
          parameterValues: fields.map((f) => ({
            field_id: f.id,
            value: f.value,
          })),
        }),
      });

      if (!response.ok) throw new Error("Gagal menyimpan penyaluran");
      showToast("Penyaluran berhasil disimpan", "success");
      router.push("/dashboard/kelola-penyaluran");
    } catch (err) {
      showToast(`Gagal menyimpan data: ${err} `, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const mustahiqButtonRef = useRef<HTMLButtonElement>(null);
  const programButtonRef = useRef<HTMLButtonElement>(null);
  const [mustahiqWidth, setMustahiqWidth] = useState(0);
  const [programWidth, setProgramWidth] = useState(0);

  useEffect(() => {
    if (mustahiqOpen && mustahiqButtonRef.current) {
      setMustahiqWidth(mustahiqButtonRef.current.offsetWidth);
    }
  }, [mustahiqOpen]);

  useEffect(() => {
    if (programOpen && programButtonRef.current) {
      setProgramWidth(programButtonRef.current.offsetWidth);
    }
  }, [programOpen]);

  return (
    <div className="flex h-screen bg-[#F5F7FB]">
      <MobileSidebar isOpen={isMobileMenuOpen} closeMenu={() => {}} />
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
              className="h-15 w-15"
              priority
              />
            </Button>
            <h1 className="text-3xl font-bold text-[#FCB82E]">
              Tambah Penyaluran
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
                    ref={mustahiqButtonRef}
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
                    <CommandInput
                      placeholder="Cari mustahiq..."
                      className="w-full"
                    />
                    <CommandEmpty>
                      Tidak ada mustahiq yang ditemukan.
                    </CommandEmpty>
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
                    ref={programButtonRef}
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
                    <CommandInput
                      placeholder="Cari program..."
                      className="w-full"
                    />
                    <CommandEmpty>
                      Tidak ada program yang ditemukan.
                    </CommandEmpty>
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

          {selectedProgramId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700">
                  Form Penyaluran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tanggal Penyaluran</Label>
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
                    onChange={(e) => setJumlah(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Chart of Accounts - CoA Debet</Label>
                  <Select
                    onValueChange={(val) => setSelectedCoaDebtId(parseInt(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih CoA" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaList.map((coa) => (
                        <SelectItem key={coa.id} value={coa.id.toString()}>
                          {coa.kode} - {coa.jenis_transaksi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Chart of Accounts - CoA Kredit</Label>
                  <Select
                    onValueChange={(val) => setSelectedCoaCredId(parseInt(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih CoA" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaList.map((coa) => (
                        <SelectItem key={coa.id} value={coa.id.toString()}>
                          {coa.kode} - {coa.jenis_transaksi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                    {f.field_type === "textarea" ? (
                      <Textarea
                        value={f.value}
                        onChange={(e) => handleFieldChange(i, e.target.value)}
                        className={
                          f.is_required && !f.value ? "border-red-500" : ""
                        }
                      />
                    ) : f.field_type === "number" ? (
                      <Input
                        type="number"
                        value={f.value}
                        onChange={(e) => handleFieldChange(i, e.target.value)}
                        className={
                          f.is_required && !f.value ? "border-red-500" : ""
                        }
                      />
                    ) : f.field_type === "date" ? (
                      <Input
                        type="date"
                        value={f.value}
                        onChange={(e) => handleFieldChange(i, e.target.value)}
                        className={
                          f.is_required && !f.value ? "border-red-500" : ""
                        }
                      />
                    ) : (
                      <Input
                        value={f.value}
                        onChange={(e) => handleFieldChange(i, e.target.value)}
                        className={
                          f.is_required && !f.value ? "border-red-500" : ""
                        }
                      />
                    )}

                    {f.description && (
                      <p className="text-sm text-gray-500 italic">
                        {f.description}
                      </p>
                    )}

                    {f.is_required && !f.value && (
                      <p className="text-sm text-red-500">
                        Field ini wajib diisi
                      </p>
                    )}

                    {f.field_type === "number" &&
                      isNaN(Number(f.value)) &&
                      f.value && (
                        <p className="text-sm text-red-500">
                          Harus berupa angka
                        </p>
                      )}

                    {f.field_type === "date" &&
                      isNaN(Date.parse(f.value)) &&
                      f.value && (
                        <p className="text-sm text-red-500">
                          Format tanggal tidak valid
                        </p>
                      )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-[#FCB82E]"
            >
              {isSaving ? "Menyimpan..." : "Simpan Penyaluran"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
