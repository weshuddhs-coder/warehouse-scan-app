import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BarcodeScanner from '../components/BarcodeScanner'
import { supabase } from '../lib/supabase'

export default function ScanReady() {
  const navigate = useNavigate()
  const [operator, setOperator] = useState(localStorage.getItem('operator') || '')
  const [isScanning, setIsScanning] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [batchCount, setBatchCount] = useState(0)
  const [recentScans, setRecentScans] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('soundEnabled') === 'true'
  )

  useEffect(() => {
    if (isScanning) {
      loadCounts()
      loadRecentScans()
    }
  }, [isScanning])

  const loadCounts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('warehouse_get_counts')
      if (error) throw error
      if (data) setTodayCount(data.ready_today || 0)
    } catch (err) {
      console.error('Failed to load counts:', err)
    }
  }

  const loadRecentScans = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('warehouse_recent_scans', {
        body: { operator, screen: 'READY', limit: 5 }
      })
      if (error) throw error
      if (data?.scans) setRecentScans(data.scans)
    } catch (err) {
      console.error('Failed to load recent scans:', err)
    }
  }

  const handleScan = async (awb) => {
    if (!operator) {
      alert('⚠️ Please enter operator name first')
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('warehouse_scan_ready', {
        body: { awb, operator }
      })

      if (error) throw error

      if (data.result === 'ACCEPTED') {
        setFeedback({ type: 'success', message: data.message, awb })
        setTodayCount(prev => prev + 1)
        setBatchCount(data.batch_count || batchCount + 1)
        
        if (soundEnabled) {
          playBeep()
          if (navigator.vibrate) navigator.vibrate(200)
        }
        
        setTimeout(() => setFeedback(null), 1500)
        loadRecentScans()
      } else {
        alert(data.message || 'Scan rejected')
      }
    } catch (err) {
      alert('❌ Network error. Check your connection and try again.')
      console.error(err)
    }
  }

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (err) {
      console.error('Audio not supported')
    }
  }

  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem('soundEnabled', newValue.toString())
  }

  const startScanning = () => {
    const trimmedOperator = operator.trim()
    if (!trimmedOperator) {
      alert('⚠️ Please enter your name')
      return
    }
    localStorage.setItem('operator', trimmedOperator)
    setOperator(trimmedOperator)
    setIsScanning(true)
  }

  if (!isScanning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-3xl font-bold text-gray-800">Scan READY</h1>
            <p className="text-gray-600 mt-2">Mark parcels ready for pickup</p>
          </div>
          
          <input
            type="text"
            placeholder="Enter your name"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && startScanning()}
            className="w-full p-4 border-2 border-gray-300 rounded-lg mb-4 text-lg focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          
          <button
            onClick={startScanning}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Start Scanning
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-blue-600 text-white p-4 sticky top-0 shadow-lg z-10">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-2xl font-bold">📦 READY Scan</h1>
            <button
              onClick={toggleSound}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                soundEnabled 
                  ? 'bg-white text-blue-600' 
                  : 'bg-blue-700 text-white'
              }`}
            >
              {soundEnabled ? '🔊 ON' : '🔇 OFF'}
            </button>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1 bg-blue-500 p-3 rounded-lg">
              <div className="text-sm opacity-90">Today Total</div>
              <div className="text-3xl font-bold">{todayCount}</div>
            </div>
            <div className="flex-1 bg-blue-500 p-3 rounded-lg">
              <div className="text-sm opacity-90">Your Batch</div>
              <div className="text-3xl font-bold">{batchCount}</div>
            </div>
          </div>
        </div>
      </div>

      {feedback?.type === 'success' && (
        <div className="fixed top-32 left-0 right-0 z-50 px-4">
          <div className="max-w-md mx-auto bg-green-500 text-white p-4 rounded-lg shadow-2xl animate-pulse">
            <div className="flex items-center">
              <span className="text-3xl mr-3">✓</span>
              <div className="flex-1">
                <div className="font-bold text-lg">{feedback.message}</div>
                <div className="text-sm opacity-90">{feedback.awb}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 mt-4">
        <BarcodeScanner onScan={handleScan} isActive={isScanning} />
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        <h3 className="font-bold text-lg mb-3 text-gray-700">Recent Scans</h3>
        <div className="bg-white rounded-lg shadow-md divide-y">
          {recentScans.length === 0 && (
            <div className="p-6 text-gray-400 text-center">
              No scans yet. Start scanning! 👆
            </div>
          )}
          {recentScans.map((scan, i) => (
            <div key={i} className="p-4 flex items-center">
              <span className={`w-4 h-4 rounded-full mr-3 flex-shrink-0 ${
                scan.result === 'ACCEPTED' ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <div className="flex-1 min-w-0">
                <div className="font-mono font-semibold">{scan.awb}</div>
                <div className="text-xs text-gray-500">
                  {new Date(scan.created_at).toLocaleTimeString()}
                </div>
              </div>
              {scan.result === 'ACCEPTED' && (
                <span className="text-green-600 text-xl">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-md mx-auto flex gap-3">
          <button
            onClick={() => {
              setIsScanning(false)
              setOperator('')
              localStorage.removeItem('operator')
            }}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 rounded-lg font-semibold transition-colors"
          >
            🚪 Logout
          </button>
          <button
            onClick={() => navigate('/scan-picked-up')}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-lg font-semibold transition-colors"
          >
            Switch to PICKED UP →
          </button>
        </div>
      </div>
    </div>
  )
}
