import { useState, useEffect } from 'react'

const STATUS_MESSAGES = [
  'Connecting to Heghizbah...',
  'Checking your session...',
  'Preparing your journey...',
  'Almost ready...'
]

export default function Splash() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setMessageIndex((i) => (i + 1) % STATUS_MESSAGES.length)
    }, 800)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className="min-h-screen relative flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a0e1f 0%, #0f1428 40%, #131a35 100%)' }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'url(/cbackground.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(40, 45, 73, 0.6) 0%, rgba(10,14,31,0.85) 70%, rgba(10,14,31,0.95) 100%)'
        }}
      />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '3px solid #d4af37',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 60px rgba(212,175,55,0.35)'
          }}
        >
          <img src="/icons/Rccg_logo.png" alt="RCCG Heghizbah Chapel" className="w-24 h-24" />
        </div>

        <h1
          className="text-center mt-8"
          style={{
            fontFamily: 'Playfair Display, serif',
            color: '#ffffff',
            fontSize: '28px',
            lineHeight: 1.2,
            letterSpacing: '0.5px'
          }}
        >
          RCCG Heghizbah Chapel
        </h1>

        <p
          className="text-center mt-3"
          style={{
            color: '#d4af37',
            fontSize: '11px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            fontWeight: 600
          }}
        >
          A Place of Grace
        </p>

        <div
          className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-4"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="relative w-8 h-8">
            <div
              className="absolute inset-0 rounded-full border-2 animate-spin"
              style={{
                borderColor: 'rgba(255,255,255,0.15)',
                borderTopColor: '#d4af37'
              }}
            />
          </div>

          <p
            className="text-xs tracking-wide"
            style={{ color: 'rgba(255,255,255,0.7)', minHeight: '16px' }}
          >
            {STATUS_MESSAGES[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  )
}