'use client'

import React from 'react'
import { MapPin, Route, Users, AlertCircle, Lock, Send } from 'lucide-react'

const features = [
  {
    icon: MapPin,
    title: 'Live Map Control',
    description: 'Real-time GPS tracking of all buses with interactive route visualization and traffic updates.',
  },
  {
    icon: Route,
    title: 'Route Planning',
    description: 'Intelligent route optimization with automated stop sequencing and distance minimization.',
  },
  {
    icon: Users,
    title: 'Student Management',
    description: 'Comprehensive student profiles with parent contacts, special needs, and pickup/dropoff preferences.',
  },
  {
    icon: AlertCircle,
    title: 'Alert Workflows',
    description: 'Instant notifications for delays, incidents, and emergency situations to all stakeholders.',
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    description: 'Granular permissions for admins, drivers, parents, and dispatchers with complete audit logs.',
  },
  {
    icon: Send,
    title: 'Mass Notifications',
    description: 'Broadcast messages via SMS, email, and in-app notifications to parents and staff instantly.',
  },
]

export default function FeaturesGrid() {
  return (
    <section className="border-t border-border bg-gradient-to-b from-card/30 to-transparent px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Powerful features for modern transportation
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Everything you need to manage SURAKSHA buses, coordinate routes, and keep parents informed—all in one platform.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div
                key={index}
                className="group rounded-2xl border border-border bg-card p-8 hover:shadow-lg hover:border-primary/50 transition-all duration-300"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-foreground/70">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
