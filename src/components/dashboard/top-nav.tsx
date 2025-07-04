"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { UserProfile } from "./user-profile";
import { useRouter } from "next/navigation";

interface User {
  nama: string;
  role: string;
}

export function TopNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/auth/user");
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        setUser({ nama: data.nama, role: data.role });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleMapClick = () => {
    router.push("/map");
  };

  return (
    <div className="flex justify-between items-center p-6 border-b bg-white">
      <Button 
        className="bg-[#07B0C8] hover:bg-[#07B0C8]/90 text-white rounded-md flex items-center gap-2"
        onClick={handleMapClick}
      >
        <MapPin size={18} />
        PETA
      </Button>
      <div className="flex items-center gap-3">
        <UserProfile name={loading ? "Loading..." : user?.nama || "User"} role={loading ? "..." : user?.role || "Role"} />
      </div>
    </div>
  );
}