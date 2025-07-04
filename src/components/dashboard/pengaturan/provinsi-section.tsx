"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getPagination } from "@/lib/utils";
import { useToastStore } from "@/lib/toast-store";

interface Provinsi {
  id: number;
  kode: string;
  nama: string;
}

export default function WilayahProvinsiSection() {
  const [provinsis, setProvinsis] = useState<Provinsi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Provinsi>>({});
  const [sortBy, setSortBy] = useState<"kode" | "nama">("nama");
  const [search, setSearch] = useState("");
  const [toDeleteId, setToDeleteId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 5;

  const { showToast } = useToastStore();

  const fetchProvinsi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/wilayah/provinsi?page=${currentPage}&limit=${itemsPerPage}&sortBy=${sortBy}&search=${encodeURIComponent(
          search
        )}`
      );
      const result = await res.json();
      setProvinsis(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      showToast("Gagal memuat data provinsi", "error");
      console.error("Gagal fetch provinsi", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, search, showToast]);

  useEffect(() => {
    fetchProvinsi();
  }, [fetchProvinsi]);

  const handleSubmit = async () => {
    if (!form.kode || !form.nama) {
      showToast("Kode dan nama wajib diisi.", "error");
      return;
    }

    if (isNaN(Number(form.kode))) {
      showToast("Kode harus berupa angka.", "error");
      return;
    }

    try {
      const res = await fetch(
        form.id ? `/api/wilayah/provinsi/${form.id}` : "/api/wilayah/provinsi",
        {
          method: form.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode: form.kode, nama: form.nama }),
        }
      );

      if (res.status === 409) {
        showToast("Kode provinsi sudah ada.", "error");
        return;
      }

      if (!res.ok) throw new Error("Gagal menyimpan data");

      showToast("Data berhasil disimpan.", "success");
      setForm({});
      setShowForm(false);
      fetchProvinsi();
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan saat menyimpan.", "error");
    }
  };

  const handleDelete = async () => {
    if (!toDeleteId) return;
    try {
      const res = await fetch(`/api/wilayah/provinsi/${toDeleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal hapus");
      showToast("Provinsi berhasil dihapus", "success");
      fetchProvinsi();
    } catch (err) {
      console.error(err);
      showToast("Gagal menghapus provinsi", "error");
    } finally {
      setToDeleteId(null);
    }
  };

  const handleEdit = (provinsi: Provinsi) => {
    setForm(provinsi);
    setShowForm(true);
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-4 -mt-2">
              <CardTitle className="text-lg w-100">Data Provinsi</CardTitle>
              <Input
                placeholder="Cari nama/kode..."
                className="h-8 text-sm w-64"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <div className="flex items-center text-sm gap-2">
                <span>Urutkan:</span>
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as "kode" | "nama")}
                >
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kode">Kode</SelectItem>
                    <SelectItem value="nama">Abjad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => {
                setForm({});
                setShowForm(true);
              }}
              className="bg-[#07B0C8] hover:bg-[#07B0C8]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <div className="p-6 text-center">Memuat data...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {provinsis.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    provinsis.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.id}</TableCell>
                        <TableCell>{p.kode}</TableCell>
                        <TableCell>{p.nama}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(p)}
                              className="text-blue-600"
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setToDeleteId(p.id)}
                              className="text-red-600"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-600">
                <span>
                  Ditampilkan{" "}
                  {provinsis.length === 0
                    ? 0
                    : (currentPage - 1) * itemsPerPage + 1}{" "}
                  - {Math.min(currentPage * itemsPerPage, total)} dari {total}{" "}
                  data
                </span>
                <div className="flex justify-center gap-1 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </Button>

                  {getPagination(currentPage, totalPages).map((p, i) =>
                    typeof p === "string" ? (
                      <span key={i} className="px-2 text-gray-500">
                        {p}
                      </span>
                    ) : (
                      <Button
                        key={i}
                        variant={p === currentPage ? "default" : "ghost"}
                        className="h-8 w-8 px-0"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>

        {/* Form Tambah/Edit */}
      </Card>
      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {form.id ? "Edit Provinsi" : "Tambah Provinsi"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 pt-2">
              <Input
                placeholder="Kode Provinsi"
                value={form.kode || ""}
                onChange={(e) => setForm({ ...form, kode: e.target.value })}
              />
              <Input
                placeholder="Nama Provinsi"
                value={form.nama || ""}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.kode || !form.nama}
                className="bg-[#07B0C8] text-white hover:bg-[#07B0C8]/90"
              >
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <Dialog
        open={toDeleteId !== null}
        onOpenChange={() => setToDeleteId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menghapus provinsi ini?</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setToDeleteId(null)}>
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
