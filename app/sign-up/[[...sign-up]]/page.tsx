'use client'

import { SignUp } from '@clerk/nextjs'
import { Brain } from 'lucide-react'

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: '#f8f5f0' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center"
          style={{ background: '#1e3a5f' }}
        >
          <Brain className="h-4 w-4" style={{ color: '#7aaccc' }} />
        </div>
        <span className="text-[15px] font-bold tracking-[0.06em]" style={{ color: '#1e3a5f' }}>
          DeepInsight
        </span>
      </div>

      <SignUp
        fallbackRedirectUrl="/"
        appearance={{
          variables: {
            colorPrimary: '#1e3a5f',
            colorBackground: '#ffffff',
            colorText: '#1e293b',
            colorTextSecondary: '#64748b',
            colorInputBackground: '#faf9f7',
            colorInputText: '#1e293b',
            borderRadius: '10px',
            fontFamily: 'var(--font-geist-sans), sans-serif',
          },
          elements: {
            card: { boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e8e2d9' },
            formButtonPrimary: { backgroundColor: '#1e3a5f' },
          },
        }}
      />
    </div>
  )
}
