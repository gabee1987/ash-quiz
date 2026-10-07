import { QRCodeSVG } from 'qrcode.react'

/** Join QR code, as large as `className` allows: phones scan it from across a room. */
export function QrCode({ value, className = '' }: { value: string; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white p-4 ${className}`}>
      <QRCodeSVG value={value} size={512} marginSize={2} className="block h-auto w-full" />
    </div>
  )
}
