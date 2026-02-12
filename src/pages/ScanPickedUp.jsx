import ScanPage from '../components/ScanPage'

const config = {
  countField: 'picked_up_today',
  screenParam: 'PICKED_UP',
  edgeFunction: 'warehouse_scan_picked_up',
  beepFrequency: 1000,
  themeColor: 'orange',
  icon: '\u{1F69A}',
  title: 'PICKED UP',
  subtitle: 'Mark parcels handed to courier',
  switchTo: {
    path: '/scan-ready',
    label: '\u2190 Switch to READY',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
}

export default function ScanPickedUp() {
  return <ScanPage config={config} />
}
