"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MainSidebar } from "@/components/main-sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToastStore } from "@/lib/toast-store";

interface ParameterField {
  id: number;
  field_name: string;
  field_type: string;
  is_required: boolean;
  description?: string;
  value?: any;
}

interface Penyaluran {
  id: number;
  mustahiq_id: number;
  program_id: number;
  tanggal: string;
  jumlah: number;
  catatan: string;
  status: string;
  parameter_values: ParameterField[];
  mustahiq?: {
    id: number;
    nama: string;
    NIK: string;
    alamat?: string;
  };
  program?: {
    id: number;
    nama_program: string;
  };
  coa_cred?: {
    id: number;
    kode: string;
    jenis_transaksi: string;
  };
  coa_debt?: {
    id: number;
    kode: string;
    jenis_transaksi: string;
  };
  creator?: {
    id: number;
    nama: string;
  };
}

export default function DetailPenyaluranPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const { showToast } = useToastStore();

  const [penyaluran, setPenyaluran] = useState<Penyaluran | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          setPenyaluran(data);
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

  const handleBack = () => {
    router.push("/dashboard/kelola-penyaluran");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
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

  if (!penyaluran) {
    return (
      <div className="flex h-screen bg-[#F5F7FB]">
        <MainSidebar userRole="superadmin" />
        <main className="flex-1">
          <TopNav />
          <div className="p-6 flex justify-center items-center h-[calc(100vh-64px)]">
            <p className="text-lg">Data penyaluran tidak ditemukan</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F7FB]">
      <MainSidebar userRole="superadmin" />
      <main className="flex-1 overflow-auto">
        <TopNav />
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
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
              Detail Penyaluran
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700">
                Data Mustahiq
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Nama Mustahiq</Label>
                  <p className="font-medium">
                    {penyaluran.mustahiq?.nama || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">NIK</Label>
                  <p className="font-medium">
                    {penyaluran.mustahiq?.NIK || "-"}
                  </p>
                </div>
                {penyaluran.mustahiq?.alamat && (
                  <div className="col-span-2">
                    <Label className="text-sm text-gray-500">Alamat</Label>
                    <p className="font-medium">{penyaluran.mustahiq.alamat}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700">
                Data Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-sm text-gray-500">Nama Program</Label>
                <p className="font-medium">
                  {penyaluran.program?.nama_program || "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700">
                Detail Penyaluran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">
                    Tanggal Penyaluran
                  </Label>
                  <p className="font-medium">
                    {formatDate(penyaluran.tanggal)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Jumlah</Label>
                  <p className="font-medium">
                    {penyaluran.jumlah?.toLocaleString("id-ID") || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">COA Debet</Label>
                  <p className="font-medium">
                    {penyaluran.coa_debt?.kode || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">COA Kredit</Label>
                  <p className="font-medium">
                    {penyaluran.coa_cred?.kode || "-"}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Status</Label>
                <p className="font-medium">{penyaluran.status || "-"}</p>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Catatan</Label>
                <p className="font-medium whitespace-pre-wrap">
                  {penyaluran.catatan || "-"}
                </p>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Penginput</Label>
                <p className="font-medium">{penyaluran.creator?.nama || "-"}</p>
              </div>
            </CardContent>
          </Card>

          {penyaluran.parameter_values &&
            penyaluran.parameter_values.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-700">
                    Parameter Program
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {penyaluran.parameter_values.map((field) => (
                    <div key={field.id}>
                      <Label className="text-sm text-gray-500">
                        {field.field_name}
                      </Label>
                      <p className="font-medium">{field.value || "-"}</p>
                      {field.description && (
                        <p className="text-xs text-gray-500 italic">
                          {field.description}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={handleBack}>
              Kembali
            </Button>
            <Button
              className="bg-[#07B0C8] hover:bg-[#07B0C8]/90"
              onClick={() =>
                router.push(
                  `/dashboard/kelola-penyaluran/edit-penyaluran/${id}`
                )
              }
            >
              Edit Penyaluran
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
