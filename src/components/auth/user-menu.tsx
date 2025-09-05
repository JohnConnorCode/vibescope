'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from './auth-provider'
import { User, History, Settings, LogOut, BarChart3, Heart, FolderOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: History, label: 'History', onClick: () => router.push('/history') },
    { icon: Heart, label: 'Favorites', onClick: () => router.push('/favorites') },
    { icon: FolderOpen, label: 'Collections', onClick: () => router.push('/collections') },
    { icon: Settings, label: 'Settings', onClick: () => router.push('/settings') },
    { icon: LogOut, label: 'Sign Out', onClick: signOut, className: 'text-red-600 hover:bg-red-50' },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg transition-colors"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div 
          className="h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          {user.email?.split('@')[0]}
        </span>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-1 z-50"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-500">Member since {new Date(user.created_at || '').toLocaleDateString()}</p>
          </div>

          <div className="py-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick()
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors hover:bg-gray-100 ${item.className || 'text-gray-700'}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}