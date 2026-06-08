import React from 'react';
import { Mail, Phone, MapPin, ShieldAlert, Award, Compass, Instagram, Linkedin, Clock } from 'lucide-react';

interface FooterProps {
  setView: (view: string) => void;
  openPolicies: (tab: string) => void;
}

export default function Footer({ setView, openPolicies }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (viewId: string) => {
    setView(viewId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePolicyClick = (tabId: string) => {
    openPolicies(tabId);
  };

  return (
    <footer id="footer" className="bg-zinc-100 border-t border-zinc-200 text-zinc-600">
      
      {/* Top Footer Segment */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Identity Card */}
          <div className="space-y-6">
            <div className="flex flex-col">
              <h2 className="font-serif text-lg tracking-[0.2em] text-[#C5A880] uppercase font-bold">
                Aleksander Hatton
              </h2>
              <span className="text-[10px] font-mono tracking-widest text-[#9A8F80] uppercase mt-0.5">
                DISCREET HOROLOGISTS &amp; VALUERS
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
              Established in Sheffield in 2025. Aleksander Hatton helps clients buy, sell, value, and source premium timepieces. Our operations reside strictly within digital and physical bounds of trust and discretion.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://www.instagram.com/aleksander.h.watches/" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full border border-zinc-300 hover:border-[#C5A880] hover:text-[#C5A880] flex items-center justify-center transition-colors text-zinc-500 bg-white"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://www.linkedin.com/company/aleksander-hatton/?viewAsMember=true" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full border border-zinc-300 hover:border-[#C5A880] hover:text-[#C5A880] flex items-center justify-center transition-colors text-zinc-500 bg-white"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Nav Directory */}
          <div className="space-y-6">
            <h3 className="font-serif text-xs tracking-widest text-zinc-900 uppercase font-bold flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
              Directory
            </h3>
            <ul className="space-y-3.5 text-xs text-zinc-600">
              <li>
                <button onClick={() => handleLinkClick('home')} className="hover:text-zinc-950 font-medium transition-colors duration-200 cursor-pointer">
                  Homepage
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('shop')} className="hover:text-zinc-950 font-medium transition-colors duration-200 cursor-pointer">
                  Shop Stock
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('valuation')} className="hover:text-zinc-950 font-medium transition-colors duration-200 cursor-pointer">
                  Sell Your Watch / Valuations
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('source')} className="hover:text-zinc-950 font-medium transition-colors duration-200 cursor-pointer">
                  Source a Timepiece
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('contact')} className="hover:text-zinc-950 font-medium transition-colors duration-200 cursor-pointer">
                  Contact Coordinates
                </button>
              </li>
            </ul>
          </div>

          {/* Services & Core Policies */}
          <div className="space-y-6">
            <h3 className="font-serif text-xs tracking-widest text-zinc-900 uppercase font-bold flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-[#C5A880]" />
              Assurance &amp; Terms
            </h3>
            <ul className="space-y-3.5 text-xs text-zinc-600">
              <li>
                <button onClick={() => handlePolicyClick('privacy')} className="hover:text-zinc-950 font-medium transition-colors duration-200 cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => handlePolicyClick('terms')} className="hover:text-zinc-950 font-medium transition-colors duration-200 cursor-pointer">
                  Terms &amp; Conditions
                </button>
              </li>
              <li>
                <button onClick={() => handlePolicyClick('shipping')} className="hover:text-zinc-950 font-medium transition-colors duration-200 cursor-pointer">
                  Shipping Policy
                </button>
              </li>
              <li>
                <button onClick={() => handlePolicyClick('returns')} className="hover:text-zinc-950 font-medium transition-colors duration-200 cursor-pointer">
                  Returns Policy
                </button>
              </li>
              <li>
                <button onClick={() => handlePolicyClick('cookie')} className="hover:text-zinc-950 font-medium transition-colors duration-200 cursor-pointer">
                  Cookie Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Coordinates Card */}
          <div className="space-y-6">
            <h3 className="font-serif text-xs tracking-widest text-zinc-900 uppercase font-bold flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
              Sheffield Office
            </h3>
            <div className="space-y-4 text-xs text-zinc-650">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                <span>
                  Sheffield, South Yorkshire<br />
                  United Kingdom
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#C5A880] shrink-0" />
                <span className="font-semibold text-zinc-700">Phone line temporarily unavailable — landline being updated</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#C5A880] shrink-0" />
                <a href="mailto:inquiries@ahwatches.com" className="hover:text-zinc-950 transition-colors font-semibold">inquiries@ahwatches.com</a>
              </div>
              <div className="pt-3 border-t border-zinc-200 text-[10px] text-zinc-500 leading-relaxed font-mono">
                BY APPOINTMENT ONLY<br />
                Mon – Fri: 09:00 – 18:00 BST<br />
                Saturday: Private viewings only.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Ground-line Footer segment */}
      <div className="bg-zinc-200/50 py-8 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-mono text-zinc-550">
          <div>
            &copy; {currentYear !== 2026 ? "2025 – " + currentYear : "2025 – 2026"} Aleksander Hatton Ltd. All international rights reserved.
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Market values depend heavily on authentic trade verification.</span>
          </div>
          <div>
            Registered in England &amp; Wales | Est. 2025
          </div>
        </div>
      </div>

    </footer>
  );
}
