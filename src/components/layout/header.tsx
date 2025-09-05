'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { AuthModal } from '@/components/auth/auth-modal'
import { UserMenu } from '@/components/auth/user-menu'
import { Button } from '@/components/ui/button'
import { Brain, LogIn, Home, BarChart3, Target } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Header() {
  const { user, loading } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Analyze', icon: Brain },
    { href: '/compare', label: 'Compare', icon: Target },
  ]

  if (user) {
    navItems.push({ href: '/dashboard', label: 'Dashboard', icon: BarChart3 })
  }

  return (
    <>
      <header 
        className="sticky top-0 z-40 w-full border-b"
        style={{ 
          backgroundColor: 'rgba(76, 29, 149, 0.95)',
          backdropFilter: 'blur(10px)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <Brain className="h-6 w-6" style={{ color: '#67e8f9' }} />
            </div>
            <span className="text-xl font-bold" style={{ color: 'white' }}>
              VibeScope
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === item.href ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
                style={{ color: pathname === item.href ? 'white' : 'rgba(255, 255, 255, 0.7)' }}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-10 w-20 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            ) : user ? (
              <UserMenu />
            ) : (
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2"
                style={{
                  background: 'linear-gradient(to right, #8b5cf6, #9333ea)',
                  color: 'white'
                }}
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  )
}