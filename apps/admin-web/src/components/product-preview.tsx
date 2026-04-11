'use client'

import React from 'react'

interface PreviewCard {
  icon: string
  title: string
  description: string
}

const previewCards: PreviewCard[] = [
  {
    icon: '📍',
    title: 'Operations Dashboard',
    description: 'Central hub showing all trips, driver status, student assignments, and system health at a glance.',
  },
  {
    icon: '👥',
    title: 'Real-time Driver Feed',
    description: 'Live stream of driver locations, route progress, pickup confirmations, and alert notifications.',
  },
  {
    icon: '📋',
    title: 'Resource Management',
    description: 'Track vehicle maintenance, driver certifications, fuel consumption, and fleet utilization metrics.',
  },
]

export default function ProductPreview() {
  return (
    <section className="border-t border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left - Description */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                See the platform in action
              </h2>
              <p className="text-lg text-foreground/60">
                SchoolBus Bridge provides a unified interface for managing every aspect of your transportation operations. From dispatch to delivery, everything is one click away.
              </p>
            </div>

            <div className="space-y-4">
              {previewCards.map((card, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">{card.title}</h4>
                    <p className="text-sm text-foreground/70">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Mock UI */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 to-amber-100/60 blur-3xl" />
            
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-border">
              {/* Mock Header */}
              <div className="border-b border-border bg-gradient-to-r from-primary/10 to-amber-100/60 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-primary/20 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-8 w-8 bg-muted/50 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Mock Content */}
              <div className="p-6 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                      <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-16 bg-primary/20 rounded animate-pulse" />
                    </div>
                  ))}
                </div>

                {/* Chart Area */}
                <div className="h-40 rounded-lg bg-gradient-to-br from-[#f5e8d8] to-[#fff8ef]" />

                {/* Activity Feed */}
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <div className="h-8 w-8 bg-muted rounded-full" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-2 w-32 bg-muted/50 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
