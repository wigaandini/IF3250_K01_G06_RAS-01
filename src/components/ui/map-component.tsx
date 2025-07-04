"use client"
import { useEffect, useState, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

interface MapComponentProps {
  position?: [number, number]
  onPositionChange?: (lat: number, lng: number) => void
  interactive?: boolean
}

const MapComponent = ({ 
  position, 
  onPositionChange = () => {}, 
  interactive = true 
}: MapComponentProps) => {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const defaultPosition: [number, number] = [-6.200000, 106.816666] // Jakarta, Indonesia by default

  useEffect(() => {
    // Initialize the map
    if (!mapRef.current) {
      const map = L.map('map', {
        dragging: interactive,
        touchZoom: true, // Selalu aktif
        scrollWheelZoom: true, // Selalu aktif
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        zoomControl: true // Selalu aktif
      }).setView(position || defaultPosition, 13)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)
      
      // Create a marker if we have an initial position
      if (position) {
        markerRef.current = L.marker(position, { 
          draggable: interactive 
        }).addTo(map)
        
        if (interactive) {
          markerRef.current.on('dragend', handleMarkerDragEnd)
        }
      }
      
      // Add click handler to the map if interactive
      if (interactive) {
        map.on('click', handleMapClick)
      }
      
      mapRef.current = map
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update marker position if props change
  useEffect(() => {
    if (mapRef.current && position) {
      // If we already have a marker, move it
      if (markerRef.current) {
        markerRef.current.setLatLng(position)
      } else {
        // Otherwise create a new one
        markerRef.current = L.marker(position, { 
          draggable: interactive 
        }).addTo(mapRef.current)
        
        if (interactive) {
          markerRef.current.on('dragend', handleMarkerDragEnd)
        }
      }
      
      // Pan the map to the marker position
      mapRef.current.setView(position, mapRef.current.getZoom())
    }
  }, [position])

  // Handle interactive changes
  useEffect(() => {
    if (mapRef.current) {
      if (interactive) {
        mapRef.current.dragging.enable()
        mapRef.current.touchZoom.enable()
        mapRef.current.doubleClickZoom.enable()
        mapRef.current.scrollWheelZoom.enable()
        mapRef.current.boxZoom.enable()
        mapRef.current.keyboard.enable()
        if (!mapRef.current.zoomControl) {
          mapRef.current.addControl(L.control.zoom())
        }
        
        if (markerRef.current) {
          markerRef.current.dragging?.enable()
          markerRef.current.on('dragend', handleMarkerDragEnd)
        }
        
        mapRef.current.on('click', handleMapClick)
      } else {
        mapRef.current.dragging.disable()
        // Tetap aktifkan zoom ketika interactive = false
        mapRef.current.touchZoom.enable()
        mapRef.current.scrollWheelZoom.enable()
        if (!mapRef.current.zoomControl) {
          mapRef.current.addControl(L.control.zoom())
        }
        
        // Nonaktifkan interaksi lain
        mapRef.current.doubleClickZoom.disable()
        mapRef.current.boxZoom.disable()
        mapRef.current.keyboard.disable()
        
        if (markerRef.current) {
          markerRef.current.dragging?.disable()
          markerRef.current.off('dragend', handleMarkerDragEnd)
        }
        
        mapRef.current.off('click', handleMapClick)
      }
    }
  }, [interactive])

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    
    // Update the marker position
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else if (mapRef.current) {
      markerRef.current = L.marker([lat, lng], { 
        draggable: interactive 
      }).addTo(mapRef.current)
      
      if (interactive) {
        markerRef.current.on('dragend', handleMarkerDragEnd)
      }
    }
    
    // Notify parent component about the position change
    onPositionChange(lat, lng)
  }

  const handleMarkerDragEnd = (e: L.DragEndEvent) => {
    const marker = e.target
    const position = marker.getLatLng()
    onPositionChange(position.lat, position.lng)
  }

  return <div id="map" style={{ height: '100%', width: '100%' }}></div>
}

export default MapComponent