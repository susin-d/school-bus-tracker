'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">SB</span>
          </div>
          <span className="text-lg font-bold text-foreground">SURAKSHA</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            About
          </a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" size="sm">
            <a href="#/login">Log In</a>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-foreground p-2"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <div className="space-y-3 px-4 py-4">
            <a href="#" className="block text-sm font-medium text-foreground hover:text-primary">
              Features
            </a>
            <a href="#" className="block text-sm font-medium text-foreground hover:text-primary">
              Pricing
            </a>
            <a href="#" className="block text-sm font-medium text-foreground hover:text-primary">
              About
            </a>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href="#/login">Log In</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
