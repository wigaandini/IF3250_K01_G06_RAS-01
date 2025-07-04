"use client";

import { useEffect, useState } from "react";
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

interface Kecamatan {
  id: number;
  kode: string;
  nama: string;
  kabupaten_id: number;
  kabupaten?: {
    nama: string;
    provinsi?: {
      nama: string;
    };
  };
}

interface Kabupaten {
  id: number;
  nama: string;
  provinsi?: { nama: string };
}

export default function WilayahKecamatanSection() {
  const [items, setItems] = useState<Kecamatan[]>([]);
  const [filteredItems, setFilteredItems] = useState<Kecamatan[]>([]);
  const [kabupatens, setKabupatens] = useState<Kabupaten[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Kecamatan>>({});
  const [sortBy, setSortBy] = useState<"kode" | "nama">("nama");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const itemsPerPage = 5;

  const fetchData = async () => {
    setLoading(true);
    try {
      const kecRes = await fetch(
        `/api/wilayah/kecamatan?page=1&limit=1000&sortBy=${sortBy}`
      );
      const kecResult = await kecRes.json();
      setItems(kecResult.data || []);

      const kabRes = await fetch(`/api/wilayah/kabupaten?page=1&limit=1000`);
      const kabResult = await kabRes.json();
      setKabupatens(kabResult.data || []);
    } catch (err) {
      console.error("Gagal fetch data kecamatan", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sortBy]);

  useEffect(() => {
    const filtered = items.filter((item) => {
      const keyword = search.toLowerCase();
      return (
        item.nama.toLowerCase().includes(keyword) ||
        item.kode.toLowerCase().includes(keyword) ||
        item.kabupaten?.nama.toLowerCase().includes(keyword) ||
        item.kabupaten?.provinsi?.nama.toLowerCase().includes(keyword)
      );
    });
    setFilteredItems(filtered);
    setTotal(filtered.length);
    setCurrentPage(1);
  }, [items, search]);

  const handleSubmit = async () => {
    if (!form.kode || !form.nama || !form.kabupaten_id)
      return alert("Lengkapi semua field!");

    try {
      const res = await fetch(
        form.id
          ? `/api/wilayah/kecamatan/${form.id}`
          : "/api/wilayah/kecamatan",
        {
          method: form.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) throw new Error("Gagal menyimpan data");
      setForm({});
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan kecamatan.");
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus kecamatan ini?")) return;

    try {
      const res = await fetch(`/api/wilayah/kecamatan/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal hapus");
      fetchData();
    } catch (err) {
      alert("Gagal menghapus kecamatan");
      console.error(err);
    }
  };

  const handleEdit = (item: Kecamatan) => {
    setForm({
      id: item.id,
      kode: item.kode,
      nama: item.nama,
      kabupaten_id: item.kabupaten_id,
    });
    setShowForm(true);
  };

  const totalPages = Math.ceil(total / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPageButtons = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }

    return pages.map((p, i) =>
      typeof p === "string" ? (
        <span key={i} className="px-2 text-gray-500">
          {p}
        </span>
      ) : (
        <Button
          key={i}
          variant={p === currentPage ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setCurrentPage(p)}
        >
          {p}
        </Button>
      )
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg w-fit">Data Kecamatan</CardTitle>
            <Input
              placeholder="Cari kode/nama/kabupaten/provinsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
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
                  <TableHead>Kabupaten</TableHead>
                  <TableHead>Provinsi</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.kode}</TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell>{item.kabupaten?.nama || "-"}</TableCell>
                      <TableCell>{item.kabupaten?.provinsi?.nama || "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            className="text-blue-600"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
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
                Ditampilkan {paginatedItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} dari {total} data
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  &lt;
                </Button>
                {renderPageButtons()}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
                >
                  &gt;
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {showForm && (
        <div className="border-t p-4 space-y-3">
          <h3 className="font-semibold">
            {form.id ? "Edit Kecamatan" : "Tambah Kecamatan"}
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              placeholder="Kode Kecamatan"
              value={form.kode || ""}
              onChange={(e) => setForm({ ...form, kode: e.target.value })}
            />
            <Input
              placeholder="Nama Kecamatan"
              value={form.nama || ""}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
            <Select
              value={form.kabupaten_id?.toString() || ""}
              onValueChange={(v) => setForm({ ...form, kabupaten_id: parseInt(v) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Kabupaten" />
              </SelectTrigger>
              <SelectContent>
                {kabupatens.map((k) => (
                  <SelectItem key={k.id} value={k.id.toString()}>
                    {k.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#07B0C8] text-white hover:bg-[#07B0C8]/90"
            >
              Simpan
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
