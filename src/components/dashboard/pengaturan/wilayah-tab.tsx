"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import WilayahProvinsiSection from "@/components/dashboard/pengaturan/provinsi-section";
import WilayahKabupatenSection from "@/components/dashboard/pengaturan/kabupaten-section";
import WilayahKecamatanSection from "@/components/dashboard/pengaturan/kecamatan-section";
// import WilayahKabupatenSection from "./sections/wilayah-kabupaten-section";
// import WilayahKecamatanSection from "./sections/wilayah-kecamatan-section";
// import WilayahKelurahanSection from "./sections/wilayah-kelurahan-section";

export default function WilayahTabsPage() {
  const [tab, setTab] = useState("provinsi");

  return (
    <Card className="p-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-2 w-full overflow-auto">
          <TabsTrigger value="provinsi">Provinsi</TabsTrigger>
          <TabsTrigger value="kabupaten">Kabupaten</TabsTrigger>
          <TabsTrigger value="kecamatan">Kecamatan</TabsTrigger>
          <TabsTrigger value="kelurahan">Kelurahan</TabsTrigger>
        </TabsList>

        <TabsContent value="provinsi">
          <WilayahProvinsiSection />
        </TabsContent>
        <TabsContent value="kabupaten">
          <WilayahKabupatenSection />
        </TabsContent>
        <TabsContent value="kecamatan">
          <WilayahKecamatanSection />
        </TabsContent>
        <TabsContent value="kelurahan">
          {/* <WilayahKelurahanSection /> */}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
