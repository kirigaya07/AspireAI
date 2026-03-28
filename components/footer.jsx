import Link from "next/link";
import { Sparkles, Shield, Zap, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 mt-12">
      {/* Main footer grid */}
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Col 1 — Brand + trust badges */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-xl bg-gradient-brand flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-base">AspireAI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered career intelligence platform — from resume to offer, faster.
            </p>
            {/* Trust badges */}
            <div className="space-y-2">
              {[
                { icon: Zap, text: "10,000 free tokens on signup" },
                { icon: Clock, text: "Tokens never expire" },
                { icon: Shield, text: "Secured by Razorpay" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Col 2 — Product */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Product</p>
            <ul className="space-y-2.5">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/resume", label: "Resume Builder" },
                { href: "/interview/agent", label: "AI Interview Agent" },
                { href: "/interview", label: "Mock Interviews" },
                { href: "/ai-cover-letter", label: "Cover Letters" },
                { href: "/#pricing", label: "Pricing" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Company */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Company</p>
            <ul className="space-y-2.5">
              {[
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AspireAI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for job seekers, by builders who&apos;ve been there.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
