import React, { useState } from 'react';
import { 
  ArrowLeft, ShieldCheck, Award, Box, FileText, Calendar, Compass, 
  MapPin, Clock, HelpCircle, Sparkles, MessageSquare, ChevronRight, Check
} from 'lucide-react';
import { Watch } from '../types';
import { motion } from 'motion/react';

interface WatchDetailProps {
  watch: Watch;
  onBack: () => void;
  onAcquire: (watch: Watch) => void;
  onEnquire: (watch: Watch) => void;
}

export default function WatchDetail({ watch, onBack, onAcquire, onEnquire }: WatchDetailProps) {
  // Preset alternative photo perspectives generated using sophisticated cropping & CSS styling 
  // on the high-res original photograph for a truly premium horology detail catalog.
  const galleryViews = [
    {
      id: 'full',
      name: 'Primary Studio Card',
      style: {},
      description: 'Full-frame front presentation of the watch asset.'
    },
    {
      id: 'macro-dial',
      name: 'Macro Dial Detail',
      style: { transform: 'scale(1.8)', transformOrigin: 'center' },
      description: 'Zoomed macro inspection of the dial, indices, and bezel alignment.'
    },
    {
      id: 'crown-curves',
      name: 'Chronomaster Profile',
      style: { transform: 'scale(1.4) capitalize', filter: 'contrast(1.1) brightness(0.95)' },
      description: 'Angled study showcasing case curves, bezel design, and crown shape.'
    },
    {
      id: 'monochrome',
      name: 'Monochrome Facet Study',
      style: { filter: 'grayscale(1) contrast(1.15)' },
      description: 'Artistic high-contrast study showcasing the steel metalwork and luxury shadows.'
    }
  ];

  const [activeView, setActiveView] = useState(galleryViews[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[80vh] space-y-12">
      
      {/* Back Button and Navigation Path */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-100">
        <button
          onClick={onBack}
          className="flex items-center gap-2 group text-xs text-zinc-550 hover:text-black font-mono uppercase tracking-widest font-bold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#C5A880] group-hover:-translate-x-1 transition-transform" />
          <span>Return to Showroom Catalog</span>
        </button>

        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono uppercase font-semibold">
          <span>Showroom</span>
          <ChevronRight className="w-3 h-3" />
          <span>{watch.brand}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-700">{watch.model}</span>
        </div>
      </div>

      {/* Main Two-Column Interactive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
        
        {/* Left Column: Premium Image Gallery (Showcasing all photos & details) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Main Visual Frame */}
          <div className="aspect-[4/3] w-full border border-zinc-200/60 bg-zinc-100 rounded-sm overflow-hidden relative shadow-xs">
            <div className="w-full h-full overflow-hidden flex items-center justify-center bg-zinc-50">
              <img
                src={watch.image}
                alt={`${watch.brand} ${watch.model} - ${activeView.name}`}
                className="w-full h-full object-cover transition-all duration-700"
                style={activeView.style}
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Premium Badging Overlay */}
            <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-md px-3 py-1 text-[9px] text-[#C5A880] font-mono rounded-xs uppercase tracking-widest font-bold border border-[#C5A880]/20">
              {watch.condition} Condition
            </div>

            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xs border border-zinc-200/60 px-3 py-1.5 text-[9px] text-zinc-500 font-mono rounded-sm uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{activeView.name}</span>
            </div>
          </div>

          {/* Interactive Thumbnails Selector for "All Photos" */}
          <div className="space-y-2">
            <span className="block text-[9px] tracking-widest font-mono text-zinc-400 uppercase font-bold">
              MULTI-ANGLE APPRAISAL VIEWS ({galleryViews.length})
            </span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {galleryViews.map((view) => {
                const isActive = activeView.id === view.id;
                return (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view)}
                    className={`border p-1.5 rounded-sm transition-all text-left bg-zinc-50 hover:bg-zinc-100 flex flex-col justify-between group h-20 relative overflow-hidden cursor-pointer ${
                      isActive 
                        ? 'border-[#C5A880] ring-1 ring-[#C5A880]/20 bg-white shadow-xs' 
                        : 'border-zinc-200 hover:border-zinc-350'
                    }`}
                  >
                    <div className="w-full h-10 overflow-hidden rounded bg-zinc-100 border border-zinc-200/40 relative">
                      <img
                        src={watch.image}
                        alt={view.name}
                        className="w-full h-full object-cover"
                        style={view.style}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className={`text-[8.5px] font-mono tracking-wide uppercase font-bold truncate mt-1 ${
                      isActive ? 'text-[#C5A880]' : 'text-zinc-500 group-hover:text-zinc-850'
                    }`}>
                      {view.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Perspective Description Box */}
          <div className="p-4 bg-zinc-50 rounded border border-zinc-150 text-xs text-zinc-550 leading-relaxed font-sans">
            <span className="text-[9px] font-mono font-bold text-[#C5A880] block mb-0.5 uppercase">Appraisal Detail Notes</span>
            "{activeView.description}" Every micro-facet of this timepiece has been thoroughly cataloged by our Sheffield house horologist.
          </div>

          {/* Premium Verification / Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-150">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h5 className="text-[10.5px] font-bold uppercase tracking-wide text-zinc-800 font-sans">100% Guaranteed</h5>
                <p className="text-[9.5px] text-zinc-500 leading-normal">Full horological provenance and ownership certs audited.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Award className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h5 className="text-[10.5px] font-bold uppercase tracking-wide text-zinc-800 font-sans">Sheffield Studio Checked</h5>
                <p className="text-[9.5px] text-zinc-500 leading-normal">Serviced in-house with diagnostics records.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h5 className="text-[10.5px] font-bold uppercase tracking-wide text-zinc-800 font-sans">Secure Dispatch</h5>
                <p className="text-[9.5px] text-zinc-500 leading-normal">Shipped via secured courier with direct door-to-door escort.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Premium Specifications and Sourcing Actions */}
        <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-zinc-200/60 lg:pl-10 xl:pl-14">
          
          {/* Header Specifications */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-bold block">
              Luxury Asset Ledger
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold block">{watch.brand}</span>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-zinc-900 font-bold uppercase leading-tight">
              {watch.model}
            </h1>
            
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-mono text-zinc-500">Ref: <b className="text-zinc-800 font-bold">{watch.reference}</b></span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-350"></span>
              <span className="text-xs font-mono text-zinc-500">Year: <b className="text-zinc-800 font-bold">{watch.year}</b></span>
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="p-5 bg-[#FAF6F0]/40 border border-[#C5A880]/15 rounded-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono tracking-wider text-zinc-405 uppercase font-bold block">Indicated Value</span>
              <span className="font-serif text-3xl text-[#C5A880] font-semibold tracking-wide">
                £{watch.price.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[8.5px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-500/10 px-2 py-0.5 rounded uppercase font-bold">
                Available now
              </span>
              <p className="text-[9px] text-zinc-400 font-mono uppercase mt-1">Sheffield Office Vaults</p>
            </div>
          </div>

          {/* Technical Spec Matrix Grid */}
          <div className="space-y-2.5">
            <span className="block text-[9px] tracking-widest font-mono text-zinc-400 uppercase font-bold">
              SECURE SPECIFICATION GRID
            </span>

            <div className="grid grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 rounded-sm overflow-hidden text-xs">
              <div className="bg-zinc-50/50 p-3 flex flex-col justify-center">
                <span className="text-[9px] font-mono uppercase text-zinc-400 font-semibold block">Manufacturer</span>
                <span className="font-bold text-zinc-800 uppercase">{watch.brand}</span>
              </div>
              <div className="bg-zinc-50/50 p-3 flex flex-col justify-center">
                <span className="text-[9px] font-mono uppercase text-zinc-400 font-semibold block">Model Code</span>
                <span className="font-bold text-zinc-800">{watch.model}</span>
              </div>
              <div className="bg-zinc-50/50 p-3 flex flex-col justify-center">
                <span className="text-[9px] font-mono uppercase text-zinc-400 font-semibold block">Official Reference</span>
                <span className="font-mono font-bold text-zinc-800">{watch.reference}</span>
              </div>
              <div className="bg-zinc-50/50 p-3 flex flex-col justify-center">
                <span className="text-[9px] font-mono uppercase text-zinc-400 font-semibold block">Condition Level</span>
                <span className="font-bold text-[#C5A880] uppercase">{watch.condition}</span>
              </div>
              <div className="bg-zinc-50/50 p-3 flex flex-col justify-center">
                <span className="text-[9px] font-mono uppercase text-zinc-400 font-semibold block">Original Presentation Box</span>
                <span className="flex items-center gap-1 font-bold text-zinc-800">
                  <Box className="w-3.5 h-3.5 text-zinc-450" />
                  {watch.box === 'Yes' ? 'Present / Genuine' : 'Not Included'}
                </span>
              </div>
              <div className="bg-zinc-50/50 p-3 flex flex-col justify-center">
                <span className="text-[9px] font-mono uppercase text-zinc-400 font-semibold block">Provenance Papers</span>
                <span className="flex items-center gap-1 font-bold text-zinc-800">
                  <FileText className="w-3.5 h-3.5 text-zinc-450" />
                  {watch.papers === 'Yes' ? 'Present / Sealed' : 'Not Included'}
                </span>
              </div>
              <div className="bg-zinc-50/50 p-3 flex flex-col justify-center">
                <span className="text-[9px] font-mono uppercase text-zinc-400 font-semibold block">Year of Assembly</span>
                <span className="font-bold text-zinc-800">{watch.year}</span>
              </div>
              <div className="bg-zinc-50/50 p-3 flex flex-col justify-center">
                <span className="text-[9px] font-mono uppercase text-zinc-400 font-semibold block">Certified Registry status</span>
                <span className="font-bold text-zinc-800 uppercase">Clear Ledger ID</span>
              </div>
            </div>
          </div>

          {/* Description narrative text block */}
          <div className="space-y-2">
            <span className="block text-[9px] tracking-widest font-mono text-zinc-400 uppercase font-bold">
              timepiece pedigree &amp; narrative
            </span>
            <div className="p-4 border border-zinc-150 rounded-sm bg-zinc-50/50 text-[11px] text-zinc-650 leading-relaxed font-sans space-y-3">
              <p className="whitespace-pre-line font-medium text-zinc-700">
                {watch.description || `This custom-referenced ${watch.brand} ${watch.model} showcases pristine craftsmanship and represents a masterpiece in timekeeping design. It has survived strict horological vetting with certified authentication protocols.`}
              </p>
              <div className="pt-2 border-t border-zinc-200/50 flex items-center justify-between text-[10px] text-zinc-400 font-mono uppercase">
                <span>Vetted by Aleksander Hatton</span>
                <span>Audit No: #{watch.id.substring(watch.id.length - 8)}</span>
              </div>
            </div>
          </div>

          {/* Buyout and enquiry Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onAcquire(watch)}
              className="w-full bg-zinc-950 hover:bg-[#C5A880] text-white hover:text-black border border-transparent font-bold text-xs tracking-widest uppercase py-3.5 rounded-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              Acquire Timepiece Now
            </button>

            <button
              onClick={() => onEnquire(watch)}
              className="w-full border border-zinc-205 hover:border-zinc-450 text-zinc-750 hover:text-black bg-white hover:bg-zinc-50 text-xs font-bold tracking-widest uppercase py-3.5 rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#C5A880]" />
              Enquire / Request Private Counsel
            </button>
          </div>

          {/* Guarantee stamp */}
          <div className="text-center p-3 border border-dashed border-[#C5A880]/20 bg-[#FAF6F0]/20 rounded-sm text-[9px] text-[#A28F70] font-mono uppercase max-w-sm mx-auto font-bold flex items-center justify-center gap-1.5">
            <Award className="w-4 h-4 text-[#C5A880] shrink-0" />
            <span>Includes 24-Month Aleksander Hatton horology certification</span>
          </div>

        </div>

      </div>

    </div>
  );
}
