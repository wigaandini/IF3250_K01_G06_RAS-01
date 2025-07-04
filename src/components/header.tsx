import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Adding a prop to determine which type of header to render
export default function Header({ dashboard = false }) {
  if (dashboard) {
    // Dashboard specific header
    return (
      <header className="w-full py-4 px-6 flex justify-between items-center border-b bg-white">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/images/logo-sekunder.svg"
            alt="Rumah Amal Salman Logo"
            width={150}
            height={50}
            className="object-contain"
          />
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/map" className="flex items-center">
            <Button className="bg-[#00b2c2] hover:bg-[#00a0b0] text-white rounded-lg px-4 py-2">
              <span className="font-semibold">PETA</span>
            </Button>
          </Link>
          
          <Link href="/profile">
            <div className="flex items-center gap-2">
              <Image
                src="/images/profile-pic.png" // Replace with actual path to user profile picture
                alt="User Profile"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="text-[#00b2c2] font-bold">Denise Felicia Tiowanni</span> 
            </div>
          </Link>
        </div>
      </header>
    );
  } else {
    // Default header
    return (
      <header className="w-full py-4 px-6 flex justify-between items-center border-b">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo-sekunder.svg"
            alt="Rumah Amal Salman Logo"
            width={150}
            height={50}
            className="object-contain"
          />
        </Link>

        <Link href="/login">
          <Button className="bg-[#00b2c2] hover:bg-[#00a0b0] text-white rounded-full px-6">
            Login
          </Button>
        </Link>
      </header>
    );
  }
}
