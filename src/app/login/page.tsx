"use client"
import Image from "next/image"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="hidden md:block absolute inset-0 -z-10">
        <Image 
          src="/images/bg-desktop.svg" 
          alt="Background" 
          fill
          className="object-cover"
          priority 
        />
      </div>
      
      <div className="md:hidden absolute inset-0 -z-10">
        <Image 
          src="/images/bg-hp.svg" 
          alt="Background" 
          fill
          className="object-cover"
          priority 
        />
      </div>
      
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6">
        <Image 
          src="/images/logo-sekunder.svg" 
          alt="Rumah Amal Salman" 
          width={100} 
          height={33} 
          className="w-24 sm:w-32 md:w-40 h-auto"
          priority 
        />
      </div>
      
      <main className="flex flex-col items-center justify-center h-screen p-4 sm:p-6">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg p-4 sm:p-6 md:p-8 rounded-xl">
          <LoginForm />
        </div>
      </main>
    </div>
  )
}