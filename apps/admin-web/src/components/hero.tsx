'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-balance">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Manage School Transport in One Smart Command Center
              </h1>
              <p className="text-lg text-foreground/60 max-w-lg">
                Live maps, route planning, student visibility, and instant alerts. Everything your school needs to operate transportation safely and efficiently.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-base">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base">
                View Demo
              </Button>
            </div>

            {/* Trust Text */}
            <div className="pt-4 space-y-2">
              <p className="text-sm font-medium text-foreground/80">
                ✓ No setup hassle • Role-based access • Real-time updates
              </p>
              <p className="text-sm text-foreground/60">
                Join 500+ schools managing transportation seamlessly
              </p>
            </div>
          </div>

          {/* Right - Dashboard Mockup */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Gradient background for the mockup area */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 to-amber-100/60 blur-3xl" />
              
              {/* Mock Dashboard Card */}
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-border">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="h-6 w-32 bg-primary/20 rounded animate-pulse" />
                    <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        <div className="h-5 w-20 bg-primary/20 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>

                  {/* Map Area */}
                  <div className="flex h-40 items-center justify-center rounded-lg bg-gradient-to-br from-[#f5e8d8] to-[#fff8ef]">
                    <div className="text-center text-muted-foreground">
                      <div className="h-24 w-32 bg-muted/30 rounded-lg mx-auto" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-8 -right-8 bg-white rounded-xl shadow-lg p-4 border border-border max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent/20 rounded-lg flex items-center justify-center">
                    <div className="h-6 w-6 bg-accent rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Live Tracking</p>
                    <p className="text-xs text-foreground/60">Real-time bus locations</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-8 -left-8 bg-white rounded-xl shadow-lg p-4 border border-border max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">98%</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">On-time Rate</p>
                    <p className="text-xs text-foreground/60">Average performance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
