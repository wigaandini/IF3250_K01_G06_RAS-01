"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useToastStore } from "@/lib/toast-store";
import { getPagination } from "@/lib/utils";

interface CoA {
  id: number;
  kode: string;
  jenis_transaksi: string;
}

export default function CoaSection() {
  const [list, setList] = useState<CoA[]>([]);
  const [form, setForm] = useState<Partial<CoA>>({});
  const [showForm, setShowForm] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"kode" | "jenis_transaksi">("kode");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 7;
  const { showToast } = useToastStore();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/coa`);
      const data = await res.json();
      const filtered = data.filter(
        (item: CoA) =>
          item.kode.includes(search) ||
          item.jenis_transaksi.toLowerCase().includes(search.toLowerCase())
      );
      const sorted = filtered.sort((a: { [x: string]: string; }, b: { [x: string]: unknown; }) =>
        String(a[sortBy]).localeCompare(String(b[sortBy]))
      );
      setTotal(sorted.length);
      const start = (currentPage - 1) * itemsPerPage;
      setList(sorted.slice(start, start + itemsPerPage));
    } catch (error) {
      console.error("Error fetching COA data:", error);
      showToast("Gagal memuat data COA", "error");
    }
  }, [currentPage, search, sortBy, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.kode || !form.jenis_transaksi) {
      showToast("Kode dan jenis transaksi wajib diisi", "error");
      return;
    }
    const regex = /^\d{3}\.\d{2}\.\d{3}\.\d{3}$/;
    if (!regex.test(form.kode)) {
      showToast("Format kode COA tidak valid (NNN.NN.NNN.NNN)", "error");
      return;
    }
    try {
      const res = await fetch(form.id ? `/api/coa/${form.id}` : "/api/coa", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: form.kode,
          jenis_transaksi: form.jenis_transaksi,
        }),
      });
      if (res.status === 409) {
        showToast("Kode COA sudah digunakan.", "error");
        return;
      }
      if (!res.ok) throw new Error("Gagal menyimpan");
      showToast("Berhasil disimpan", "success");
      setForm({});
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast("Gagal menyimpan COA", "error");
    }
  };

  const handleDelete = async () => {
    if (!toDeleteId) return;
    try {
      const res = await fetch(`/api/coa/${toDeleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus");
      showToast("Berhasil dihapus", "success");
      fetchData();
    } catch (error) {
      console.error("Error deleting COA:", error);
      showToast("Gagal menghapus", "error");
    } finally {
      setToDeleteId(null);
    }
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg">Chart of Accounts (CoA)</CardTitle>
              <Button
                onClick={() => {
                  setForm({});
                  setShowForm(true);
                }}
                className="h-8 bg-[#07B0C8] text-white hover:bg-[#07B0C8]/90 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Cari kode/jenis transaksi..."
                className="h-8 text-sm flex-1"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <div className="flex items-center gap-2 text-sm">
                <span className="whitespace-nowrap">Urutkan:</span>
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as never)}
                >
                  <SelectTrigger className="w-full sm:w-40 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kode">Kode</SelectItem>
                    <SelectItem value="jenis_transaksi">
                      Jenis Transaksi
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-sm text-gray-700">ID</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Kode</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Jenis Transaksi</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  list.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-sm">{item.id}</td>
                      <td className="p-4 text-sm font-mono">{item.kode}</td>
                      <td className="p-4 text-sm">{item.jenis_transaksi}</td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setForm(item);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToDeleteId(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4">
            {list.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada data
              </div>
            ) : (
              <div className="space-y-3">
                {list.map((item) => (
                  <Card key={item.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              ID: {item.id}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Kode:</span>
                              <p className="text-base font-mono">{item.kode}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Jenis Transaksi:</span>
                              <p className="text-base">{item.jenis_transaksi}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setForm(item);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToDeleteId(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-t text-sm text-gray-600 gap-3">
            <span className="text-center sm:text-left">
              Ditampilkan{" "}
              {list.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, total)} dari {total} data
            </span>
            <div className="flex justify-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                &lt;
              </Button>
              {getPagination(currentPage, totalPages).map((p, i) =>
                typeof p === "string" ? (
                  <span key={i} className="px-2 text-gray-500 hidden sm:inline">
                    {p}
                  </span>
                ) : (
                  <Button
                    key={i}
                    variant={p === currentPage ? "default" : "ghost"}
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                &gt;
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit CoA" : "Tambah CoA"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <Input
              placeholder="Kode CoA (NNN.NN.NNN.NNN)"
              value={form.kode || ""}
              onChange={(e) => setForm({ ...form, kode: e.target.value })}
            />
            <Input
              placeholder="Jenis Transaksi"
              value={form.jenis_transaksi || ""}
              onChange={(e) =>
                setForm({ ...form, jenis_transaksi: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#07B0C8] text-white hover:bg-[#07B0C8]/90 w-full sm:w-auto"
              disabled={!form.kode || !form.jenis_transaksi}
            >
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi Hapus */}
      <Dialog
        open={toDeleteId !== null}
        onOpenChange={() => setToDeleteId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menghapus COA ini?</p>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setToDeleteId(null)}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto"
            >
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}