import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function BarcodeScanner({ onScan, isActive }) {
  const html5QrCodeRef = useRef(null)
  const [lastScanned, setLastScanned] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isActive) return

    const html5QrCode = new Html5Qrcode("reader")
    html5QrCodeRef.current = html5QrCode

    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    }

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Prevent duplicate scans within 1 second
        if (decodedText === lastScanned) return
        
        setLastScanned(decodedText)
        onScan(decodedText)
        
        // Re-arm scanner after 1 second
        setTimeout(() => setLastScanned(null), 1000)
      },
      (errorMessage) => {
        // Ignore continuous scan errors (too verbose)
      }
    ).catch(err => {
      setError("📷 Camera access denied. Please enable camera permissions.")
      console.error(err)
    })

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error)
      }
    }
  }, [isActive, lastScanned, onScan])

  return (
    <div className="relative">
      <div id="reader" className="w-full max-w-md mx-auto rounded-lg overflow-hidden"></div>
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center">
          {error}
        </div>
      )}
    </div>
  )
}
