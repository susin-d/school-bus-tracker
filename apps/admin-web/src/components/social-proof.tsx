'use client'

import React from 'react'

const companies = [
  { name: 'Lincoln Public Schools', initials: 'LPS' },
  { name: 'Denver School District', initials: 'DSD' },
  { name: 'Austin ISD', initials: 'AIS' },
  { name: 'Seattle Schools', initials: 'SSc' },
  { name: 'Boston Academy', initials: 'BA' },
  { name: 'Chicago District', initials: 'CD' },
]

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Transportation Coordinator',
    company: 'Lincoln Public Schools',
    quote: 'SURAKSHA cut our coordination calls by 80%. We now have complete visibility into every trip.',
    avatar: 'SM',
  },
  {
    name: 'James Rodriguez',
    role: 'Operations Lead',
    company: 'Denver School District',
    quote: 'Real-time tracking has transformed how we manage our fleet. Response times to incidents dropped dramatically.',
    avatar: 'JR',
  },
  {
    name: 'Emily Chen',
    role: 'School Administrator',
    company: 'Austin ISD',
    quote: 'Our parents love the instant updates. It&apos;s given us peace of mind and reduced parent concerns significantly.',
    avatar: 'EC',
  },
]

export default function SocialProof() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Company Logos */}
        <div className="mb-20 space-y-8">
          <div className="text-center">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">Trusted by 500+ schools</p>
            <h2 className="mt-2 text-3xl font-bold text-foreground">
              Join schools transforming transportation
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
            {companies.map((company, index) => (
              <div
                key={index}
                className="flex items-center justify-center rounded-lg border border-border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-sm font-bold text-primary">{company.initials}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground/60">{company.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-foreground">What schools are saying</h3>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border bg-card p-8 hover:shadow-lg transition-shadow"
              >
                <div className="space-y-4">
                  {/* Quote */}
                  <p className="text-foreground/80 leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                      <span className="text-sm font-bold text-primary">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-foreground/60">{testimonial.role}</p>
                      <p className="text-xs text-foreground/50">{testimonial.company}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
