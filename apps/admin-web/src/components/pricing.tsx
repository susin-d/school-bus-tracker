'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

interface PricingPlan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  highlighted: boolean
}

const plans: PricingPlan[] = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    description: 'Perfect for small schools getting started',
    features: [
      'Single school support',
      'Basic route planning',
      'Up to 5 buses',
      'Parent app access',
      'Email support',
      'Monthly reports',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'Most popular for growing districts',
    features: [
      'Multi-school support',
      'Live GPS tracking',
      'Unlimited buses',
      'Advanced alerts',
      'Real-time analytics',
      'Priority support',
      'Custom integrations',
      'API access',
      'Weekly reports',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large districts with advanced needs',
    features: [
      'District-wide deployment',
      'White-label solution',
      'Advanced security',
      'Dedicated account manager',
      'Custom workflows',
      '24/7 phone support',
      'Training & onboarding',
      'SLA guarantee',
      'Custom reporting',
    ],
    highlighted: false,
  },
]

export default function Pricing() {
  return (
    <section className="border-t border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center space-y-4 mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Pricing</p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Plans for every school size
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Transparent pricing with no hidden fees. Scale as your needs grow.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl border transition-all duration-300 ${
                plan.highlighted
                  ? 'border-primary bg-gradient-to-b from-primary/5 to-transparent shadow-2xl scale-100 md:scale-105'
                  : 'border-border bg-card hover:shadow-lg'
              } p-8`}
            >
              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                </div>
              )}

              <div className="space-y-6 h-full flex flex-col">
                {/* Header */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-foreground/60">{plan.description}</p>
                  <div className="pt-2">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-foreground/60 ml-2">{plan.period}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {plan.highlighted ? 'Start Free Trial' : 'Get Started'}
                </Button>

                {/* Features */}
                <div className="space-y-4 flex-1">
                  <p className="text-sm font-semibold text-foreground">Included:</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 border-t border-border pt-16">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Frequently asked questions
          </h3>
          <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
            {[
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
              },
              {
                q: 'Is there a setup fee?',
                a: 'No setup fees! Just sign up, configure your schools, and start managing routes immediately.',
              },
              {
                q: 'Do you offer discounts for annual billing?',
                a: 'Yes! Switch to annual billing and save 20% on Pro and Enterprise plans.',
              },
              {
                q: 'What kind of support do I get?',
                a: 'All plans include email support. Pro plans get priority support, and Enterprise includes a dedicated account manager.',
              },
            ].map((item, i) => (
              <div key={i} className="space-y-3">
                <h4 className="font-semibold text-foreground">{item.q}</h4>
                <p className="text-foreground/70 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
