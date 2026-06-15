import React from 'react';
import { X, ShieldCheck, MapPin, Scale, HelpCircle, FileText } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: string;
}

export default function PolicyModal({ isOpen, onClose, initialTab }: PolicyModalProps) {
  const [activeTab, setActiveTab] = React.useState(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'terms', label: 'Terms & Conditions', icon: Scale },
    { id: 'shipping', label: 'Shipping Policy', icon: MapPin },
    { id: 'returns', label: 'Returns Policy', icon: HelpCircle },
    { id: 'cookie', label: 'Cookie Policy', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'privacy':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-zinc-650 leading-relaxed font-sans">
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">1. Security &amp; Data Control Protocols</h4>
            <p>
              Aleksander Hatton Ltd operates on strict digital privacy principles. We collect client names, email credentials, contact coordinates, location city keys, and horology specifications strictly for the purposes of performing custom horology appraisals, valuing assets, or securing direct sourcing agreements.
            </p>
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">2. Information Sharing Limits</h4>
            <p>
              We NEVER lease, exchange, sell, or disseminate client information to secondary marketing syndicates. Data uploaded to our appraisals or sourcing portals remain stored on encrypted database containers behind server security firewalls, and are accessed only by qualified horologists affiliated with Aleksander Hatton operations.
            </p>
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">3. Digital Rights &amp; Deletion</h4>
            <p>
              Clients retain structural rights over their personal coordinates in alignment with UK GDPR frameworks. You may request total purge of your transaction logs, valuation files, or messaging timelines at any moment. For compliance, please mail credentials with your formal instructions to our Sheffield privacy compliance officer.
            </p>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-zinc-650 leading-relaxed font-sans">
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">1. Scope of Luxury Brokering Service</h4>
            <p>
              Aleksander Hatton is an independent high-end watch brokerage based in Sheffield. We are NOT authorized brand distributors or affiliate dealers for Rolex, Patek Philippe, Audemars Piguet, Cartier, or other mentioned marques. All trademarks, brand names, and logos displayed are strictly the intellectual assets of their respective legal manufacturers.
            </p>
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">2. Appraisal Inaccuracies &amp; Dynamic Pricing</h4>
            <p>
              All valuations issued through our portals are non-binding estimates based on current UK trading conditions and do not represent formal buying contracts. Final prices are determined strictly upon hands-on, high-resolution horology analysis and formal contract execution. Sourced quotes remain subject to dynamic third-party seller volatility.
            </p>
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">3. Purchase Authorization &amp; Escrow Payments</h4>
            <p>
              Online orders completed through our checkout require immediate secure payment authorization. If stock is determined to be reserved or sold under simultaneous physical trades, Aleksander Hatton reserves the right to immediately refund client balances in full and void transaction invoices.
            </p>
          </div>
        );
      case 'shipping':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-zinc-650 leading-relaxed font-sans">
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">1. Over-Value Royal Mail &amp; Courier Escort</h4>
            <p>
              All luxury horological listings dispatched by Aleksander Hatton are transported exclusively via high-value insured courier services (such as Royal Mail Special Delivery Guaranteed by 1pm or global security services) with complete coverage protection. Delivery packages require physical adult signature with government identity verification on hand.
            </p>
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">2. Shipping Windows</h4>
            <p>
              Timepieces held in stock are dispatched within 24 business hours of full secure payment settlement. Bespoke sourced timepieces are subject to customized distributor logistics plans, generally transacting within 7 to 10 trading business days.
            </p>
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">3. Geographic Bounds</h4>
            <p>
              Currently, online checkouts support secure transit directly inside the United Kingdom, Guernsey, and Jersey. International consignments require custom pre-authorization from our Sheffield desk.
            </p>
          </div>
        );
      case 'returns':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-zinc-650 leading-relaxed font-sans">
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">1. 14-Day Private Return Rights</h4>
            <p>
              In alignment with UK Consumer Contracts Regulations, online acquisitions of in-stock watches are eligible for full returns or exchanges within 14 calendar days from delivery receipt. Bespoke sourced timepieces or watches custom-configured for clients do not carry standard return policies.
            </p>
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">2. Restrictional Condition Constraints</h4>
            <p>
              Returns are strictly rejected if a watch shows signs of physical wear, casing adjustments, links removal, or caseback tampering. All original luxury boxes, warranty booklets, serial tags, and certificates of authenticity must remain complete, unmarked, and returned in their exact original states.
            </p>
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">3. Inspection Over-rules</h4>
            <p>
              Refund payouts are initiated only after our Sheffield horologists execute detailed physical authentication to ensure internal calibres, gaskets, dials, and hands match the original dispatched photographs. Complete refunds will process to client bank cards within 5 business days following successful horology audit.
            </p>
          </div>
        );
      case 'cookie':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-zinc-650 leading-relaxed font-sans">
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">1. Functional Cookies</h4>
            <p>
              Our luxury ecommerce portals use functional cookies strictly to retain inventory navigation settings, brand filtration states, current active administrative dashboards, and shopping cart details.
            </p>
            <h4 className="font-serif text-[#C5A880] text-sm uppercase tracking-wider font-bold">2. Consent Options</h4>
            <p>
              We do not track client behaviors on external platforms or target advertising networks. By continuing your browsing sessions on our Sheffield platform, you authorize the deployment of standard temporary session cookies required to safely authenticate payments.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start md:items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white border border-zinc-250 rounded-sm shadow-2xl flex flex-col md:flex-row my-4 md:my-0 md:max-h-[85dvh] md:overflow-hidden">
        
        {/* Left Hand Navigation Sidebar (Policies list) */}
        <div className="w-full md:w-1/3 bg-zinc-50 border-r border-zinc-200 p-4 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="p-3">
              <h2 className="font-serif text-sm tracking-widest text-[#C5A880] uppercase font-bold">Legal &amp; Assurance</h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase font-semibold">Aleksander Hatton Ltd</p>
            </div>

            <nav className="space-y-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-[#FAF6F0] text-[#C5A880] border-l-2 border-[#C5A880]' 
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-zinc-200 text-[10px] text-zinc-400 font-mono leading-relaxed mt-4 uppercase font-semibold">
            ESTABLISHED IN 2025<br />
            SHEFFIELD, UNITED KINGDOM<br />
            COMPANY REF: AH2025-TRUSTED
          </div>
        </div>

        {/* Right Hand Policy Content Container */}
        <div className="w-full md:w-2/3 p-6 sm:p-8 flex flex-col justify-between bg-white min-h-0 md:overflow-y-auto">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="space-y-6 pb-6 bg-white">
            <h3 className="font-serif text-xl text-zinc-900 tracking-wide uppercase border-b border-zinc-100 pb-3 font-bold">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            
            {renderContent()}
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-semibold uppercase">
            <span>Last Updated: June 2026</span>
            <button
              onClick={onClose}
              className="bg-zinc-950 text-white hover:bg-zinc-850 text-xs px-5 py-2 uppercase tracking-wider font-semibold font-sans rounded-sm transition-colors cursor-pointer"
            >
              Acknowledge
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
