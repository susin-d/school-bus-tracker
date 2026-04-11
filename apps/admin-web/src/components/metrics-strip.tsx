'use client'

import React, { useState, useEffect } from 'react'

interface Metric {
  label: string
  value: number
  suffix: string
  icon: string
}

const metrics: Metric[] = [
  { label: 'Active Trips', value: 1247, suffix: '', icon: '🚌' },
  { label: 'On-time %', value: 98, suffix: '%', icon: '⏱️' },
  { label: 'Open Alerts', value: 3, suffix: '', icon: '🔔' },
  { label: 'Drivers Online', value: 542, suffix: '', icon: '👤' },
]

const Counter: React.FC<{ target: number; suffix: string }> = ({ target, suffix }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const stepValue = target / steps
    let current = 0

    const timer = setInterval(() => {
      current += stepValue
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [target])

  return (
    <>
      {count}
      {suffix}
    </>
  )
}

export default function MetricsStrip() {
  return (
    <section className="border-t border-b border-border bg-card/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span className="text-3xl">{metric.icon}</span>
              <div className="text-2xl md:text-3xl font-bold text-primary">
                <Counter target={metric.value} suffix={metric.suffix} />
              </div>
              <p className="text-sm text-foreground/70 text-center">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
