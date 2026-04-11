'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      setEmail('')
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  return (
    <section className="border-t border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-gradient-to-b from-primary/10 to-accent/5 border border-primary/20 p-12 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Bring Clarity to Every School Route
            </h2>
            <p className="text-lg text-foreground/70 mx-auto max-w-lg">
              Join hundreds of schools already transforming their transportation operations. Start your free trial today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="your.email@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white"
            />
            <Button
              type="submit"
              size="lg"
              className="bg-primary hover:bg-primary/90 whitespace-nowrap flex items-center gap-2"
            >
              {submitted ? 'Sent!' : 'Get Started'}
              {!submitted && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="text-sm text-foreground/60">
            No credit card required. 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
