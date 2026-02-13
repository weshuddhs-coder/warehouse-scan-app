import ScanPage from '../components/ScanPage'

const config = {
  countField: 'ready_today',
  screenParam: 'READY',
  edgeFunction: 'warehouse_scan_ready',
  beepFrequency: 800,
  themeColor: 'blue',
  icon: '\u{1F4E6}',
  title: 'READY',
  subtitle: 'Mark parcels ready for pickup',
  switchTo: {
    path: '/scan-picked-up',
    label: 'Switch to PICKED UP \u2192',
    color: 'bg-orange-600 hover:bg-orange-700',
  },
}

export default function ScanReady() {
  return <ScanPage config={config} />
}
