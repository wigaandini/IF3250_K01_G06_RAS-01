import type React from "react"
import Link from "next/link"
import { Instagram, Globe } from "lucide-react"
import Image from "next/image"

interface FooterLinkProps {
  href: string
  children: React.ReactNode
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <Link href={href} className="text-white hover:underline block py-1">
      {children}
    </Link>
  )
}

export default function Footer() {
  return (
    <footer className="w-full">
      <div className="h-10 bg-[#ffc107]"></div>

      <div className="bg-[#00b2c2] text-white py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div>
                <Image
                  src="/images/logo-putih.svg"
                  alt="Rumah Amal Salman Logo"
                  width={150}
                  height={50}
                  className="object-contain brightness-100"
                />
              </div>

              <div className="text-sm">
                <p>Copyright © {new Date().getFullYear()} Rumah Amal Salman</p>
                <p>All rights reserved</p>
              </div>

              <div className="flex gap-4 pt-2">
                <Link href="https://instagram.com" className="text-white hover:text-gray-200">
                  <Instagram size={24} />
                </Link>
                <Link href="https://website.com" className="text-white hover:text-gray-200">
                  <Globe size={24} />
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-4">Learn More</h3>
              <nav className="space-y-1">
                <FooterLink href="/tentang">Tentang</FooterLink>
                <FooterLink href="/apa-itu-ziswaf">Apa Itu Ziswaf?</FooterLink>
                <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
                <FooterLink href="/syarat-dan-ketentuan">Syarat dan Ketentuan</FooterLink>
                <FooterLink href="/berita">Berita</FooterLink>
              </nav>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-4">Kontak</h3>
              <address className="not-italic space-y-1">
                <p>Jl. Gelap Nyawang No. 4 Bandung</p>
                <p>Kode Pos 40132</p>
                <p>Call Center : 0811 222 8333</p>
              </address>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

