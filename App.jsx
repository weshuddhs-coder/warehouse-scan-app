import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ScanReady from './pages/ScanReady'
import ScanPickedUp from './pages/ScanPickedUp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/scan-ready" replace />} />
        <Route path="/scan-ready" element={<ScanReady />} />
        <Route path="/scan-picked-up" element={<ScanPickedUp />} />
      </Routes>
    </BrowserRouter>
  )
}
