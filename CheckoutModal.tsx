import React, { useState } from 'react';
import { X, CreditCard, Ship, ShoppingBag, Eye, ShieldCheck, CheckCircle } from 'lucide-react';
import { Watch } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
import { getWatchCoverImage } from '../lib/images';

interface CheckoutModalProps {
  watch: Watch | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export default function CheckoutModal({ watch, isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientCity: '',
    clientPostcode: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState<any>(null);

  if (!isOpen || !watch) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.clientName || !formData.clientEmail || !formData.clientPhone || !formData.clientAddress || !formData.clientCity || !formData.clientPostcode) {
      setError('Please double-check and fill all mandatory delivery information fields.');
      setLoading(false);
      return;
    }

    try {
      const result = await apiFetch<{ url: string; orderId: string; order?: any }>('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          watchId: watch.id,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          clientAddress: formData.clientAddress,
          clientCity: formData.clientCity,
          clientPostcode: formData.clientPostcode,
        })
      });

      if (!result.url) {
        throw new Error('Stripe checkout URL was not returned.');
      }

      setSuccessInfo({ ...result.order, id: result.orderId, checkoutUrl: result.url, ...formData });
      onSuccess(result.orderId);
      window.location.assign(result.url);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during secure authorization. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start md:items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white border border-zinc-250 rounded-sm shadow-2xl flex flex-col md:flex-row my-4 md:my-0 md:max-h-[90dvh] md:overflow-hidden">
        
        {/* Left Side: Product Breakdown Summary & Branding (Fixed, no scroll or scrollable inside) */}
        <div className="w-full md:w-2/5 bg-zinc-50/75 p-6 sm:p-8 flex flex-col justify-between border-r border-zinc-200">
          <div>
            <div className="flex items-center gap-2 text-[10px] tracking-widest text-[#C5A880] font-mono uppercase mb-6">
              <ShoppingBag className="w-4 h-4" />
              <span>Investment Summary</span>
            </div>
            
            <div className="space-y-4">
              <div className="aspect-square w-full rounded-sm overflow-hidden bg-[#F3EFE6] border border-[#D8CBB8]">
                <img 
                  src={getWatchCoverImage(watch)} 
                  alt={`${watch.brand} ${watch.model}`}
                  className="w-full h-full object-contain p-4"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">{watch.brand}</span>
                <h3 className="font-serif text-lg tracking-tight text-zinc-900 font-bold mt-0.5">{watch.model}</h3>
                <p className="text-xs text-zinc-550 font-mono mt-1 font-semibold">Ref: {watch.reference} | Year: {watch.year}</p>
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-zinc-650">
                  <span>Declared Condition</span>
                  <span className="font-mono text-zinc-950">{watch.condition}</span>
                </div>
                <div className="flex justify-between text-zinc-650">
                  <span>Box / Papers Status</span>
                  <span className="font-mono text-zinc-950">Box: {watch.box} / Papers: {watch.papers}</span>
                </div>
                <div className="flex justify-between text-zinc-650">
                  <span>Secured Shipping</span>
                  <span className="text-[#C5A880] font-mono uppercase font-bold">Complementary Covered</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-200 space-y-3 mt-4 md:mt-0">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-zinc-500 font-semibold">Total Purchase Value</span>
              <span className="font-serif text-2xl text-[#C5A880] font-bold">£{watch.price.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 leading-tight font-mono font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0" />
              <span>Guaranteed Authenticated and Insured Overnight Escort. Saved Bank Transfers Secured.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Secure Checkout Form Fields */}
        <div className="w-full md:w-3/5 p-6 sm:p-8 bg-white min-h-0 md:overflow-y-auto">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {!successInfo ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-zinc-900 tracking-wide font-bold">SECURE ACQUISITION</h2>
                <p className="text-xs text-zinc-550 mt-1 font-semibold">Bespoke luxury gateway backed by encrypted bank routing networks.</p>
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm font-semibold">
                  {error}
                </div>
              )}

              {/* Delivery Coordinates Segment */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-[#C5A880] font-bold border-b border-zinc-100 pb-1 flex items-center gap-1.5 font-sans">
                  <Ship className="w-3.5 h-3.5" />
                  Delivery details
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1 font-bold">Full legal Name</label>
                    <input 
                      type="text" 
                      name="clientName" 
                      required
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="e.g. Leo Hatton" 
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1 font-bold">Email Address</label>
                      <input 
                        type="email" 
                        name="clientEmail" 
                        required
                        value={formData.clientEmail}
                        onChange={handleChange}
                        placeholder="e.g. yourname@example.com" 
                        className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1 font-bold">Contact Phone Number</label>
                      <input 
                        type="tel" 
                        name="clientPhone" 
                        required
                        value={formData.clientPhone}
                        onChange={handleChange}
                        placeholder="e.g. +44 7123 456789" 
                        className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1 font-bold">Delivery Street Address</label>
                    <input 
                      type="text" 
                      name="clientAddress" 
                      required
                      value={formData.clientAddress}
                      onChange={handleChange}
                      placeholder="Street number, name, apartment" 
                      className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1 font-bold">City / Town</label>
                      <input 
                        type="text" 
                        name="clientCity" 
                        required
                        value={formData.clientCity}
                        onChange={handleChange}
                        placeholder="e.g. Sheffield" 
                        className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-3.5 py-2 text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1 font-bold">Postcode</label>
                      <input 
                        type="text" 
                        name="clientPostcode" 
                        required
                        value={formData.clientPostcode}
                        onChange={handleChange}
                        placeholder="e.g. S1 1AA" 
                        className="w-full bg-zinc-50 border border-zinc-250 rounded-sm px-3.5 py-2 text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-[#C5A880] focus:bg-white transition-all font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Billing Info Step */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-[#C5A880] font-bold border-b border-zinc-100 pb-1 flex items-center gap-1.5 font-sans">
                  <CreditCard className="w-3.5 h-3.5" />
                  Billing &amp; Settlement Step
                </h3>

                <div className="p-4 bg-[#FAF6F0] border border-[#C5A880]/20 rounded-sm space-y-2 text-xs">
                  <p className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]"></span>
                    Direct Stripe Settlement Gateway
                  </p>
                  <p className="text-zinc-550 leading-relaxed font-sans text-[11.5px]">
                    Click <b className="text-zinc-900 font-bold">"CONTINUE TO BILLING"</b>. The website creates a one-off Stripe Checkout session using the price saved in the database, then redirects you to Stripe. The watch is only marked as sold after Stripe confirms payment.
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-200 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-zinc-200 text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#C5A880] hover:bg-[#D5B890] disabled:bg-[#FAF6F0] disabled:text-zinc-300 text-black font-bold text-xs uppercase tracking-widest py-3.5 rounded-sm transition-colors duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'CREATING STRIPE CHECKOUT...' : `CONTINUE TO BILLING / PAY VIA STRIPE`}
                </button>
              </div>
            </form>
          ) : (
            // Success State / Redirection Advice
            <div className="h-full flex flex-col justify-center items-center py-12 text-center space-y-6 bg-white overflow-y-auto w-full">
              <CheckCircle className="w-14 h-14 text-emerald-500 shrink-0" />
              <div>
                <h3 className="font-serif text-2xl text-zinc-900 uppercase tracking-wider font-bold">Order Registered</h3>
                <p className="text-[#C5A880] text-xs mt-1 font-mono uppercase font-bold">Reference ID: {successInfo.id}</p>
              </div>

              <div className="bg-zinc-50 p-6 rounded-sm border border-zinc-200 text-left max-w-md w-full space-y-4 shadow-xs">
                <h4 className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase pb-2 border-b border-zinc-200 font-bold">Delivery Registry Receipt</h4>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-650">
                    <span>Investment Piece</span>
                    <span className="text-zinc-950 font-bold text-right">{watch.brand} {watch.model}</span>
                  </div>
                  <div className="flex justify-between text-zinc-650">
                    <span>Client Name</span>
                    <span className="text-zinc-950 font-semibold">{successInfo.clientName}</span>
                  </div>
                  <div className="flex justify-between text-zinc-650">
                    <span>Registered Destination</span>
                    <span className="text-zinc-950 font-mono text-right max-w-[200px] truncate">{successInfo.clientCity}, {successInfo.clientPostcode}</span>
                  </div>
                  <div className="flex justify-between text-zinc-650">
                    <span>Escrow Amount</span>
                    <span className="text-[#C5A880] font-sans font-bold text-sm">£{watch.price.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-sm border border-zinc-200 text-[10px] text-zinc-500 leading-normal font-sans">
                  Your details have been locked into the live dashboard registry system. To finalize, click the direct button below to pay via the secure Stripe custom link created for this timepiece asset.
                </div>
              </div>

              {successInfo?.checkoutUrl ? (
                <div className="w-full max-w-sm flex flex-col items-center gap-3 px-6">
                  <a
                    href={successInfo.checkoutUrl}
                    className="w-full bg-[#C5A880] hover:bg-[#D5B890] text-black font-bold text-center text-xs uppercase tracking-widest py-3.5 rounded-sm transition-all duration-300 block shadow-md shadow-[#C5A880]/20 hover:-translate-y-0.5"
                  >
                    Proceed to Stripe Payment Portal
                  </a>
                  <p className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider">
                    Use this button only if the automatic redirect was blocked.
                  </p>
                  <button
                    onClick={onClose}
                    className="text-xs text-zinc-500 hover:text-zinc-900 uppercase font-semibold tracking-wider hover:underline mt-2 cursor-pointer"
                  >
                    Close Receipt &amp; Return
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-sm flex flex-col items-center gap-2 px-6">
                  <button
                    onClick={onClose}
                    className="bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-semibold uppercase tracking-widest px-8 py-3 rounded-sm transition-colors duration-200 cursor-pointer"
                  >
                    Close Receipt
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
