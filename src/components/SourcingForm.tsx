import React, { useState } from 'react';
import { Compass, ShieldAlert, Sparkles, Send, CheckCircle, Award } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function SourcingForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    brand: '',
    model: '',
    reference: '',
    year: '',
    condition: 'Mint',
    boxPapers: 'Full Box & Papers',
    budget: '',
    timeframe: 'Within 1 Month',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check mandatory
    if (!formData.name || !formData.email || !formData.phone || !formData.brand || !formData.model) {
      setError('Please fill in your name, contact information, and brand/model requirements.');
      setLoading(false);
      return;
    }

    try {
      await apiFetch('/api/sourcing', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError('Submitting sourcing brief failed. Check connectivity and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Header & Sourcing Network Intro */}
          <div className="space-y-6 text-center max-w-3xl mx-auto">
            <h1 className="font-serif text-3xl sm:text-4xl text-zinc-900 tracking-widest uppercase font-bold">SOURCE A TIMEPIECE</h1>
            <p className="text-xs text-[#C5A880] font-mono tracking-wider uppercase font-semibold">Bespoke Acquisition &amp; Global Wholesaler Access</p>
            <div className="w-12 h-[1.5px] bg-[#C5A880] mx-auto"></div>
            
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-sans text-left sm:text-center font-medium">
              Looking for a specific watch? Through our network of 50+ trusted watch wholesalers and dealers, Aleksander Hatton can help source sought-after timepieces at competitive market prices. Where possible, we use our relationships to secure favourable pricing, allowing clients to access watches efficiently while benefiting from our sourcing expertise.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Form Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Form Card */}
              <div className="bg-white border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-6">
                <h2 className="text-[#C5A880] font-serif text-sm tracking-widest uppercase pb-2 border-b border-zinc-100 flex items-center gap-2 font-bold">
                  <Compass className="w-4 h-4" />
                  Acquisition briefing brief
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Your Full Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Leo Hatton" 
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Email Address *</label>
                    <input 
                      type="email" 
                      name="email" 
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. leohatton28@gmail.com" 
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Phone Number *</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +44 7123 456789" 
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Brand Wanted *</label>
                    <input 
                      type="text" 
                      name="brand" 
                      required
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="e.g. Patek Philippe" 
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Model Wanted *</label>
                    <input 
                      type="text" 
                      name="model" 
                      required
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="e.g. Nautilus 5711" 
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Reference Number (if known)</label>
                    <input 
                      type="text" 
                      name="reference" 
                      value={formData.reference}
                      onChange={handleChange}
                      placeholder="e.g. 5711/1A-010" 
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Preferred Year Code</label>
                    <input 
                      type="text" 
                      name="year" 
                      value={formData.year}
                      onChange={handleChange}
                      placeholder="e.g. 2021 or 2024" 
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Desired condition</label>
                    <select 
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    >
                      <option value="Unworn" className="text-zinc-800 bg-white">Unworn (Factory condition)</option>
                      <option value="Mint" className="text-zinc-800 bg-white">Mint (Like-new)</option>
                      <option value="Excellent" className="text-zinc-800 bg-white">Excellent</option>
                      <option value="Any" className="text-zinc-800 bg-white">Any verified condition acceptable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Box &amp; Papers Preference</label>
                    <select 
                      name="boxPapers"
                      value={formData.boxPapers}
                      onChange={handleChange}
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    >
                      <option value="Full Box & Papers" className="text-zinc-800 bg-white">Full Box &amp; Papers (Required)</option>
                      <option value="Watch Only Fine" className="text-zinc-800 bg-white">Watch Only (Acceptable)</option>
                      <option value="Any Box & Papers" className="text-zinc-800 bg-white">Any configuration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Target Budget (£)</label>
                    <input 
                      type="text" 
                      name="budget" 
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="e.g. £15,000 - £18,000" 
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Acquisition Timeframe</label>
                    <select 
                      name="timeframe"
                      value={formData.timeframe}
                      onChange={handleChange}
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    >
                      <option value="Immediate" className="text-zinc-800 bg-white">Immediate allocation (In stock or quick source)</option>
                      <option value="Within 1 Month" className="text-zinc-800 bg-white">Within 1 Month</option>
                      <option value="Flexible" className="text-zinc-800 bg-white">Flexible / Right watch at right value</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">Additional Client specifications</label>
                    <textarea 
                      name="notes" 
                      rows={4}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="e.g. Sourcing dial preferences, bezel configurations, or specific serial years..." 
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Sourcing Disclaimer */}
                <div className="flex gap-3 p-4 bg-[#FAF7F2] border border-[#EBE3D5] rounded-sm text-left">
                  <ShieldAlert className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#8A714E] leading-relaxed font-mono uppercase font-bold">
                    <strong>SOURCING GUARANTEE DISCLAIMER:</strong> Availability, pricing, and delivery times are not guaranteed and depend on current market conditions and supplier availability.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#C5A880] hover:bg-[#D5B890] disabled:bg-[#FAF6F0] disabled:text-zinc-300 text-black font-semibold text-xs uppercase tracking-widest px-8 py-3.5 rounded-sm transition-all duration-300 w-full cursor-pointer font-bold"
                  >
                    {loading ? 'DISPATCHING TO DEALER SYSTEM...' : 'CONFIRM ACQUISITION INSTRUCTIONS'}
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Sourcing Protocol details */}
            <div className="space-y-6">
              
              <div className="bg-white border border-zinc-250 p-6 space-y-4 shadow-xs">
                <h3 className="font-serif text-xs tracking-widest text-zinc-900 uppercase font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#C5A880]" />
                  Sourcing Protocol
                </h3>
                <p className="text-xs text-zinc-550 leading-relaxed font-sans font-medium">
                  The bespoke sourcing pathway ensures clients unlock difficult allocations:
                </p>
                
                <ul className="space-y-4 text-xs font-mono text-zinc-500">
                  <li className="flex gap-2.5">
                    <span className="text-[#C5A880] font-bold">01.</span>
                    <span>Broker review of request details within 24 business hours.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="text-[#C5A880] font-bold">02.</span>
                    <span>Engagement of 50+ European watch wholesale brokers across secure communication protocols.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="text-[#C5A880] font-bold">03.</span>
                    <span>Formulation of competitive options indicating authenticity proofs, box states, and dealer costs.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="text-[#C5A880] font-bold">04.</span>
                    <span>Secure client closing with handcarry options within the UK.</span>
                  </li>
                </ul>
              </div>

              <div className="border border-zinc-200 p-6 text-center space-y-2 bg-zinc-50">
                <h4 className="text-[11px] font-mono tracking-widest text-[#9A8F80] uppercase font-bold">DISCREET COMMUNICATIONS</h4>
                <p className="text-[10px] text-zinc-500 font-mono leading-relaxed uppercase">
                  All sourcing histories are completely shielded and not indexed. Assets transacted under full broker confidentiality agreements.
                </p>
              </div>

            </div>

          </div>

        </form>
      ) : (
        // Successful Sourcing card
        <div className="max-w-2xl mx-auto py-12 px-6 bg-white border border-zinc-200 shadow-md rounded-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#FAF6F0] flex items-center justify-center mx-auto border border-[#C5A880]">
            <Sparkles className="w-8 h-8 text-[#C5A880] animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-[#C5A880] uppercase tracking-wider font-bold">ACQUISITION DISPATCHED</h2>
            <p className="text-zinc-500 text-[11px] font-mono uppercase font-bold">SOURCING SYSTEM REGISTERED</p>
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-sans max-w-md mx-auto font-medium">
            Thank you. Your sourcing request has been received. Aleksander Hatton will review your request and contact you if suitable options become available.
          </p>

          <div className="p-4 bg-zinc-50 rounded-sm text-left border border-zinc-200 space-y-2 text-xs">
            <div className="flex gap-2 text-[10px] uppercase font-mono tracking-wider text-emerald-700 font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Dealer alerts dispatched successfully</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono leading-relaxed mt-1 uppercase font-semibold">
              • Direct email with client specifications transmitted securely to: <strong>leohatton28@gmail.com</strong>.<br />
              • Auto-conf email sent to client details.
            </p>
          </div>

          <button
            onClick={() => {
              setSuccess(false);
              setFormData({
                name: '',
                email: '',
                phone: '',
                brand: '',
                model: '',
                reference: '',
                year: '',
                condition: 'Mint',
                boxPapers: 'Full Box & Papers',
                budget: '',
                timeframe: 'Within 1 Month',
                notes: ''
              });
            }}
            className="border border-zinc-250 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold uppercase tracking-widest px-8 py-3.5 rounded-sm transition-all cursor-pointer"
          >
            Submit Another Sourcing Brief
          </button>
        </div>
      )}

    </div>
  );
}
