import Footer from "@/components/footer"
import Header from "@/components/header"
import MapSection from "@/components/map-section"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-grow">
        <MapSection />
      </div>
      <Footer />
    </main>
  )
}
