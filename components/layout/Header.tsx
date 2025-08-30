import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">MockupGen</span>
            </Link>
            
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="/catalog" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Catalog
              </Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                How It Works
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Pricing
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/admin/login">
              <Button variant="ghost" size="sm">
                Admin
              </Button>
            </Link>
            <Link href="/create">
              <Button size="sm">
                Start Creating
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}