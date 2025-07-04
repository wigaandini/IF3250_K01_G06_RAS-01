"use client"

import React, { useEffect, useRef, useState } from "react"
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
})

interface ZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
}

interface DistributionPoint {
  id: number
  mustahiqId: number
  nama: string
  alamat: string
  program: string
  tanggal: string
  jumlah: number
  lat: number
  lng: number
}

function ZoomControls({ onZoomIn, onZoomOut }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-8 right-8 flex flex-col bg-[#00b2c2] rounded-lg shadow-lg overflow-hidden z-[1000]">
      <button
        onClick={onZoomIn}
        className="p-3 text-white hover:bg-[#00a0b0] transition-colors border-b border-[#00a0b0]"
        aria-label="Zoom in"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <button onClick={onZoomOut} className="p-3 text-white hover:bg-[#00a0b0] transition-colors" aria-label="Zoom out">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  )
}

function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const [distributionPoints, setDistributionPoints] = useState<DistributionPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch distribution data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/map-data')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const data = await response.json()
        setDistributionPoints(data)
      } catch (err) {
        console.error('Error fetching distribution points:', err)
        setError('Failed to load distribution data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Initialize map and add markers
  useEffect(() => {
    if (!mapRef.current || isLoading || distributionPoints.length === 0) return

    // Create map centered on Bandung, Indonesia
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([-6.914744, 107.609810], 13)

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current)
    }

    // Clear existing markers
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstance.current?.removeLayer(layer)
      }
    })

    // Add markers for each distribution point
    distributionPoints.forEach(point => {
      const marker = L.marker([point.lat, point.lng])
        .addTo(mapInstance.current!)
        .bindPopup(`
          <b>${point.nama}</b><br>
          <b>Program:</b> ${point.program}<br>
          <b>Tanggal:</b> ${new Date(point.tanggal).toLocaleDateString()}<br>
          <b>Jumlah:</b> ${new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(point.jumlah)}<br>
          <b>Alamat:</b> ${point.alamat}
        `)
    })

    // Fit map to bounds of all markers if there are multiple points
    if (distributionPoints.length > 1) {
      const bounds = L.latLngBounds(
        distributionPoints.map(point => [point.lat, point.lng])
      )
      mapInstance.current.fitBounds(bounds)
    }

  }, [distributionPoints, isLoading])

  const handleZoomIn = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomOut()
    }
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-[calc(100vh-64px-200px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b2c2]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative w-full h-[calc(100vh-64px-200px)] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[calc(100vh-64px-200px)]">
      <div 
        className="w-full h-full" 
        ref={mapRef}
        style={{ zIndex: 0 }}
      />
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
    </div>
  )
}

export default MapSection