'use client'

import React from 'react'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-4 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">SB</span>
              </div>
              <span className="font-bold text-foreground">SURAKSHA</span>
            </div>
            <p className="text-sm text-foreground/60">
              Smart school transport management for the modern era.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Product</h3>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Security', 'Updates'].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Company</h3>
            <ul className="space-y-2">
              {['About', 'Blog', 'Contact', 'Partners'].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Compliance'].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-8">
          <p className="text-sm text-foreground/60">
            © 2024 SURAKSHA. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {[
              { label: 'X' },
              { label: 'IN' },
              { label: 'GH' },
              { label: 'M' },
            ].map(({ label }) => (
              <a
                key={label}
                href="#"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors"
                aria-label={label}
              >
                <span className="text-xs font-semibold text-foreground/60 hover:text-primary transition-colors">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
