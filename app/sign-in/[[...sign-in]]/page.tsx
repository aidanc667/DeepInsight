'use client'

import { useEffect } from 'react'
import { SignIn } from '@clerk/nextjs'
import { Brain } from 'lucide-react'

export default function SignInPage() {
  // Mark the session as active so the main page doesn't auto-sign-out
  // after Clerk redirects back here following a successful sign-in.
  useEffect(() => {
    sessionStorage.setItem('deepinsight-session', '1')
  }, [])
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: 'linear-gradient(160deg, #070d1a 0%, #040910 100%)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)' }}
        >
          <Brain className="h-4 w-4 text-cyan-400" />
        </div>
        <span className="font-mono text-[15px] font-bold text-slate-100 tracking-[0.12em]">
          DeepInsight
        </span>
      </div>

      <SignIn />
    </div>
  )
}
