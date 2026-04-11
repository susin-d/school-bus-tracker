'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Connect Your Schools',
    description: 'Add your school information, import student rosters, and register bus fleets. Takes just 15 minutes with our guided setup.',
    icon: '🏫',
  },
  {
    number: '02',
    title: 'Run Daily Operations',
    description: 'Assign routes, track buses in real-time, manage pickup/dropoff, and communicate with parents automatically.',
    icon: '🚌',
  },
  {
    number: '03',
    title: 'Improve Weekly',
    description: 'Review performance metrics, optimize routes, analyze incidents, and make data-driven decisions for next week.',
    icon: '📊',
  },
]

export default function HowItWorks() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 space-y-4 text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Simple workflow</p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Get started in 3 easy steps
          </h2>
        </div>

        <div className="grid gap-y-12 md:grid-cols-2 md:gap-x-20 lg:gap-x-28">
          <div className="relative rounded-2xl border border-border bg-card p-8 hover:shadow-lg transition-all">
            <div className="absolute -top-4 -left-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg">
              {steps[0].number}
            </div>

            <div className="space-y-4 pt-4">
              <div className="text-4xl">{steps[0].icon}</div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">{steps[0].title}</h3>
                <p className="text-foreground/70">{steps[0].description}</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl border border-border bg-card p-8 hover:shadow-lg transition-all md:mt-0">
            <div className="absolute -top-4 -left-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg">
              {steps[1].number}
            </div>

            <div className="space-y-4 pt-4">
              <div className="text-4xl">{steps[1].icon}</div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">{steps[1].title}</h3>
                <p className="text-foreground/70">{steps[1].description}</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center md:col-span-2 md:-my-2">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="md:col-span-2 md:grid md:grid-cols-[1fr_minmax(0,520px)_1fr]">
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="relative rounded-2xl border border-border bg-card p-8 hover:shadow-lg transition-all">
              <div className="absolute -top-4 -left-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg">
                {steps[2].number}
              </div>

              <div className="space-y-4 pt-4">
                <div className="text-4xl">{steps[2].icon}</div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">{steps[2].title}</h3>
                  <p className="text-foreground/70">{steps[2].description}</p>
                </div>
              </div>
            </div>
            <div />
          </div>
        </div>
      </div>
    </section>
  )
}
