import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, EyeOff, Award, Compass, Heart, ArrowRight, Shield, Clock, Phone, Mail, MapPin, 
  ChevronRight, Sparkles, AlertCircle, Eye, RefreshCw, ShoppingCart, Lock, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Footer from './components/Footer';
import SourcingForm from './components/SourcingForm';
import ValuationForm from './components/ValuationForm';
import CheckoutModal from './components/CheckoutModal';
import PolicyModal from './components/PolicyModal';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import AuthModal from './components/AuthModal';
import WatchDetail from './components/WatchDetail';
import { Watch } from './types';
import { apiFetch } from './lib/api';
import { getCurrentUserProfile, supabase } from './lib/supabase';
import { SHOP_BRANDS } from './lib/brands';
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL, WHATSAPP_URL, pathFromView, viewFromPath } from './lib/contact';
import { FALLBACK_WATCH_IMAGE, getWatchCoverImage } from './lib/images';

export default function App() {
  const [currentView, setCurrentView] = useState<string>(() => viewFromPath(window.location.pathname));

  const setView = (view: string) => {
    setCurrentView(view);
    const nextPath = pathFromView(view);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => setCurrentView(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);
  const [stock, setStock] = useState<Watch[]>([]);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('All');
  const [loadingStock, setLoadingStock] = useState(false);
  
  // Checkout & Policies modals
  const [checkoutWatch, setCheckoutWatch] = useState<Watch | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [policyType, setPolicyType] = useState<string>('');
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<'success' | 'cancelled' | null>(null);

  // User Authentication & Broker Cabinet Session
  const [session, setSession] = useState<{ role: 'customer' | 'dealer'; user: any } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const profile = await getCurrentUserProfile();
      if (!mounted || !profile) return;
      setSession({
        role: profile.role === 'admin' || profile.role === 'dealer' ? 'dealer' : 'customer',
        user: profile,
      });
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
      if (!mounted) return;
      if (!authSession?.user) {
        setSession(null);
        return;
      }
      const profile = await getCurrentUserProfile();
      if (!profile) return;
      setSession({
        role: profile.role === 'admin' || profile.role === 'dealer' ? 'dealer' : 'customer',
        user: profile,
      });
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setView('home');
  };

  const handleAuthSuccess = (newSession: { role: 'customer' | 'dealer'; user: any }) => {
    setSession(newSession);
    if (newSession.role === 'dealer') {
      setView('admin');
    } else {
      setView('account');
    }
  };

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactHp, setContactHp] = useState(''); // honeypot, stays empty for real users
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  const brandCategories = SHOP_BRANDS;

  // Load stock immediately
  const fetchStock = async () => {
    setLoadingStock(true);
    try {
      const data = await apiFetch<Watch[]>('/api/stock');
      setStock(data);
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []); // Fetch catalog once on mount instead of on every navigation

  // Handle the return from Stripe Checkout: show a confirmation, then strip the
  // query string so a refresh does not re-trigger the banner.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success' || payment === 'cancelled') {
      setPaymentNotice(payment);
      window.history.replaceState({}, '', pathFromView(viewFromPath(window.location.pathname)));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchStock(); // refresh availability after a purchase
    }
  }, []);

  // Keep the tab title in sync with the current view for SEO and orientation.
  useEffect(() => {
    const base = 'Aleksander Hatton';
    const titles: Record<string, string> = {
      home: `${base} | Sell, Buy & Source Watches in Sheffield`,
      shop: `Watches for Sale | ${base}`,
      valuation: `Sell Your Watch | ${base}`,
      source: `Source a Watch | ${base}`,
      contact: `Contact | ${base}`,
      account: `Your Account | ${base}`,
      admin: `Dealer Dashboard | ${base}`,
    };
    document.title = selectedWatch
      ? `${selectedWatch.brand} ${selectedWatch.model} | ${base}`
      : titles[currentView] || titles.home;
  }, [currentView, selectedWatch]);

  // Filter watch utility
  const filteredStock = stock.filter(watch => {
    if (selectedBrandFilter === 'All') return watch.status === 'Available';
    return watch.brand === selectedBrandFilter && watch.status === 'Available';
  });

  const checkBrandSoldOut = (brandName: string) => {
    const brandInDb = stock.filter(w => w.brand === brandName && w.status === 'Available');
    return brandInDb.length === 0;
  };

  // Verification handles are streamlined via Cabinet Portal AuthModal.

  // General contact submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    setContactSending(true);
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ ...contactForm, company: contactHp })
      });
      setContactSuccess(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
      setContactHp('');
    } catch (err: any) {
      setContactError(err?.message || 'Could not send your message. Please try again, or email us directly.');
    } finally {
      setContactSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-800 font-sans flex flex-col justify-between selection:bg-[#C5A880] selection:text-white">
      
      {/* 1. Header Navigation */}
      <Header 
        currentView={selectedWatch ? 'shop' : currentView} 
        setView={(v) => {
          setSelectedWatch(null);
          setView(v);
        }} 
        session={session}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        openPolicies={(t) => {
          setSelectedWatch(null);
          setPolicyType(t);
          setIsPolicyOpen(true);
        }}
      />

      {/* Stripe return banner */}
      {paymentNotice && (
        <div
          role="status"
          className={`px-4 py-3 text-center text-xs sm:text-sm font-medium ${
            paymentNotice === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-b border-amber-200'
          }`}
        >
          {paymentNotice === 'success'
            ? 'Payment received, thank you. A confirmation has been emailed to you and we will be in touch about insured delivery.'
            : 'Checkout was cancelled. The watch is still available if you would like to try again.'}
          <button
            onClick={() => setPaymentNotice(null)}
            className="ml-3 underline opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Primary Views (Switched dynamically with smooth transitions) */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">

          {/* VIEW: WATCH DETAIL CONTAINER */}
          {selectedWatch && (
            <motion.div
              key="watch-detail-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
            >
              <WatchDetail 
                watch={selectedWatch}
                onBack={() => {
                  setSelectedWatch(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onAcquire={(w) => {
                  setCheckoutWatch(w);
                  setIsCheckoutOpen(true);
                }}
                onEnquire={(w) => {
                  setSelectedWatch(null);
                  setView('contact');
                  setContactForm({
                    name: '',
                    email: '',
                    phone: '',
                    message: `Enquiry Details:\nManufacturer: ${w.brand}\nModel: ${w.model}\nReference: ${w.reference}\nYear: ${w.year}\n\nI am interested in acquiring this fine timepiece. Please contact me with availability and details at your earliest convenience.`
                  });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </motion.div>
          )}
          
          {/* VIEW: HOME VIEW */}
          {currentView === 'home' && !selectedWatch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-24 pb-20"
            >
              {/* HERO SECTION */}
              <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-zinc-100">
                {/* Hero Overlay and backdrop */}
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-50 via-white to-white opacity-95"></div>
                
                {/* Background luxury photo */}
                <div 
                  className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-10 z-0"
                  style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1600")' }}
                ></div>

                {/* Aesthetic framing markers (Chess grid alignment) */}
                <div className="absolute top-10 left-10 hidden sm:flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-[#C5A880] uppercase">
                  <span>AH.STORY.2025</span>
                </div>
                <div className="absolute bottom-10 right-10 hidden sm:flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-zinc-400 uppercase">
                  <span>DISCREET • SECURE • CERTIFIED</span>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8 select-none">
                  
                  {/* Visual crown symbol */}
                  <div className="flex justify-center mb-2">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-10 h-10 border border-[#C5A880]/30 rounded-full flex items-center justify-center bg-white shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 text-[#C5A880]" />
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    <motion.h1 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="font-serif text-4xl sm:text-6xl md:text-7xl tracking-[0.3em] text-[#C5A880] uppercase font-semibold text-center select-none"
                    >
                      Aleksander Hatton
                    </motion.h1>
                    
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex justify-center items-center gap-2 max-w-md mx-auto"
                    >
                      <div className="w-6 h-[1px] bg-[#C5A880]/50"></div>
                      <span className="text-[10px] sm:text-xs font-mono tracking-widest uppercase text-zinc-500">
                        Independent watch dealer
                      </span>
                      <div className="w-6 h-[1px] bg-[#C5A880]/50"></div>
                    </motion.div>
                    
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="font-serif text-lg sm:text-xl text-zinc-800 italic max-w-2xl mx-auto tracking-wide mt-2"
                    >
                      Buy, sell, value and source watches across all price ranges.
                    </motion.p>
                  </div>

                  {/* Buttons requested in Home section 1: Shop, Sell, Source */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                  >
                    <button
                      onClick={() => { setView('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="w-full sm:w-auto bg-[#C5A880] hover:bg-[#D5B890] text-black font-semibold text-xs tracking-widest uppercase px-8 py-4 rounded-sm transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      Shop Watches
                    </button>
                    <button
                      onClick={() => { setView('valuation'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="w-full sm:w-auto border border-[#C5A880] hover:bg-[#C5A880]/10 text-[#C5A880] font-semibold text-xs tracking-widest uppercase px-8 py-4 rounded-sm transition-all"
                    >
                      Sell Your Watch
                    </button>
                    <button
                      onClick={() => { setView('source'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="w-full sm:w-auto border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold text-xs tracking-widest uppercase px-8 py-4 rounded-sm transition-all"
                    >
                      Source a Watch
                    </button>
                  </motion.div>

                </div>
              </section>

              {/* CORE SERVICE VALUE PROPOSITION (Section about Discretion, market knowledge) */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-zinc-100">
                  <div className="p-6 space-y-3.5 text-center sm:text-left">
                    <div className="w-10 h-10 border border-[#C5A880]/30 rounded flex items-center justify-center bg-zinc-50 text-[#C5A880] mx-auto sm:mx-0 shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-sm tracking-widest text-[#C5A880] uppercase font-bold">ALL WATCHES CONSIDERED</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                      We welcome valuation requests for working, broken, damaged and non-running watches across both premium and everyday brands.
                    </p>
                  </div>

                  <div className="p-6 space-y-3.5 text-center sm:text-left border-y sm:border-y-0 sm:border-x border-zinc-100">
                    <div className="w-10 h-10 border border-[#C5A880]/30 rounded flex items-center justify-center bg-zinc-50 text-[#C5A880] mx-auto sm:mx-0 shadow-sm">
                      <Compass className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-sm tracking-widest text-[#C5A880] uppercase font-bold">LOCAL VALUATION DESK</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                      Submit your details and photos online, then arrange a private appointment or home visit by booking where appropriate.
                    </p>
                  </div>

                  <div className="p-6 space-y-3.5 text-center sm:text-left">
                    <div className="w-10 h-10 border border-[#C5A880]/30 rounded flex items-center justify-center bg-zinc-50 text-[#C5A880] mx-auto sm:mx-0 shadow-sm">
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-sm tracking-widest text-[#C5A880] uppercase font-bold">TRUST &amp; AUTHENTICATION</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                      Offers are subject to inspection, ownership checks and authentication so genuine sellers and buyers are protected.
                    </p>
                  </div>
                </div>
              </section>

              {/* BRAND EXPLORATION CARDS (Section 1: "Brand browsing section") */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="font-serif text-xl sm:text-2xl tracking-widest text-zinc-900 uppercase font-semibold font-bold">WATCH BRAND DIRECTORIES</h2>
                  <p className="text-[10px] text-[#C5A880] font-mono tracking-widest uppercase">BROWSE CURRENT STOCK AND COMMONLY REQUESTED BRANDS</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
                  {brandCategories.slice(0, 12).map((brandName) => {
                    const isSoldOut = checkBrandSoldOut(brandName);
                    return (
                      <div 
                        key={brandName}
                        onClick={() => {
                          setSelectedBrandFilter(brandName);
                          setView('shop');
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }}
                        className="bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-100 hover:border-[#C5A880] p-6 text-center rounded-sm cursor-pointer transition-all duration-300 group flex flex-col justify-between aspect-[4/3] shadow-xs"
                      >
                        <span className="font-serif text-xs sm:text-sm tracking-widest text-zinc-800 group-hover:text-[#C5A880] transition-colors uppercase font-bold">
                          {brandName}
                        </span>
                        
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <span className="text-[9px] font-mono tracking-wider uppercase text-zinc-500 group-hover:text-zinc-700 transition-colors">
                            {isSoldOut ? 'Broker Source' : 'In Stock'}
                          </span>
                          <ChevronRight className="w-3 h-3 text-[#C5A880] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* FEATURED WATCHES SECTION (Section 1: "Featured watches section showing available stock") */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-4 border-b border-zinc-100">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl tracking-widest text-zinc-900 uppercase font-semibold font-bold">CURRENTLY AVAILABLE</h2>
                    <p className="text-[10px] text-[#C5A880] font-mono tracking-widest uppercase mt-0.5">CURATED LUXURY SHOWROOM SELECTIONS</p>
                  </div>
                  <button 
                    onClick={() => { setView('shop'); setSelectedBrandFilter('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-2 text-xs text-zinc-800 hover:text-[#C5A880] transition-colors font-semibold uppercase tracking-widest"
                  >
                    <span>View complete catalog</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stock.filter(w => w.status === 'Available').slice(0, 4).map((watch) => (
                    <div 
                      key={watch.id}
                      onClick={() => {
                        setSelectedWatch(watch);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      title={`View full details for ${watch.brand} ${watch.model}`}
                      className="bg-zinc-50 rounded-sm overflow-hidden border border-zinc-100 hover:border-[#C5A880] transition-all duration-300 flex flex-col group shadow-xs cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-[#F3EFE6] border-b border-zinc-100 relative">
                        <img 
                          src={getWatchCoverImage(watch)} 
                          alt={`${watch.brand} ${watch.model}`}
                          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (img.src !== FALLBACK_WATCH_IMAGE) img.src = FALLBACK_WATCH_IMAGE; }}
                        />
                        <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs border border-[#C5A880]/30 px-2.5 py-1 text-[9px] text-[#C5A880] font-mono rounded-sm uppercase tracking-wider shadow-sm">
                          {watch.condition}
                        </div>
                      </div>

                      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">{watch.brand}</span>
                          <h3 className="font-serif text-xs text-zinc-900 uppercase tracking-wider group-hover:text-[#C5A880] transition-colors truncate mt-1 font-bold">{watch.model}</h3>
                          <p className="text-[10px] text-zinc-500 font-mono mt-1">Ref: {watch.reference} | Year: {watch.year}</p>
                        </div>

                        <div className="pt-3 border-t border-zinc-200/60 flex items-center justify-between">
                          <span className="font-serif text-sm text-[#C5A880] font-bold">£{watch.price.toLocaleString()}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCheckoutWatch(watch);
                              setIsCheckoutOpen(true);
                            }}
                            className="bg-white hover:bg-[#C5A880] text-zinc-800 hover:text-black border border-zinc-200 hover:border-transparent text-[10px] font-semibold tracking-wider uppercase px-4 py-2 rounded-sm transition-all duration-300 shadow-xs cursor-pointer font-bold"
                          >
                            Acquire / Enquire
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ABOUT US SECTION (Section 5: "About Us near the bottom of homepage" - Named people substituted correctly) */}
              <section className="bg-zinc-50 border-y border-zinc-100 py-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-bold">Sheffield-Based Watch Dealer</span>
                      <h2 className="font-serif text-2xl sm:text-3xl text-zinc-900 tracking-widest uppercase mt-1 font-bold">ABOUT ALEKSANDER HATTON</h2>
                      <div className="w-12 h-[1px] bg-[#C5A880] mt-3"></div>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-sans">
                      Aleksander Hatton is a Sheffield-based watch dealership established in 2025. The business helps clients buy, sell, value, and source watches across a wide range of brands and price points, from everyday watches to high-end pieces. 
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-sans">
                      From its base in Sheffield, Aleksander Hatton combines a client-first approach with access to a wider network of watch dealers, wholesalers, and collectors. We consider working, broken, damaged and non-running watches, with private viewings and home appointments available by booking.
                    </p>
                  </div>

                  {/* Operational team detail card */}
                  <div className="bg-white border border-zinc-200/60 p-6 lg:p-8 space-y-6 rounded-sm shadow-md">
                    <h3 className="font-serif text-sm tracking-widest text-[#C5A880] uppercase font-bold border-b border-zinc-100 pb-2">
                       How We Help
                     </h3>

                    <div className="space-y-4 text-xs font-sans">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-zinc-900 font-bold tracking-wide uppercase">Sell / Value</h4>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Free watch valuation requests</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#C5A880] bg-[#FAF6F0] px-2 py-0.5 rounded border border-[#C5A880]/30">Sheffield HQ</span>
                      </div>

                      <div className="flex justify-between items-start border-t border-zinc-100 pt-4">
                        <div>
                          <h4 className="text-zinc-900 font-bold tracking-wide uppercase">Buy</h4>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Curated watches for sale</p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">Private Sales</span>
                      </div>

                      <div className="flex justify-between items-start border-t border-zinc-100 pt-4">
                        <div>
                          <h4 className="text-zinc-900 font-bold tracking-wide uppercase">Source</h4>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Specific watch sourcing</p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">Supplier Network</span>
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* REVIEVED FEEDBACK / MAP (Coordinates section) */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                <div className="bg-zinc-50 border border-zinc-100 p-8 flex flex-col justify-center space-y-4 shadow-xs">
                  <h3 className="font-serif text-lg text-zinc-900 uppercase tracking-wider font-bold">SHEFFIELD WATCH APPOINTMENTS</h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                    Private viewings and valuation appointments are available by booking. We can also discuss suitable home appointments for sellers and buyers where appropriate.
                  </p>
                  <div className="text-xs font-mono text-[#C5A880] space-y-1.5 uppercase font-semibold">
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Sheffield, South Yorkshire, UK</p>
                    <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> <a href={CONTACT_PHONE_TEL} className="hover:underline">{CONTACT_PHONE_DISPLAY}</a></p>
                    <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">{CONTACT_EMAIL}</a></p>
                  </div>
                </div>

                <div className="aspect-video w-full rounded border border-zinc-200 overflow-hidden bg-zinc-100 relative shadow-xs">
                  {/* Luxury map simulation illustrating beautiful sheffield alignment */}
                  <div className="absolute inset-0 bg-cover bg-center blend-overlay opacity-30 filter grayscale contrast-125" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800")' }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-zinc-900/10"></div>
                  <div className="absolute bottom-6 left-6 z-10 space-y-1 text-xs">
                    <span className="text-[10px] text-[#C5A880] font-mono uppercase tracking-widest font-bold">Sheffield Appointments</span>
                    <h4 className="font-serif text-sm text-white font-bold tracking-wide uppercase">Private Viewings By Booking</h4>
                    <p className="text-[10.5px] text-zinc-200 leading-normal">Valuations, buying appointments and sourcing meetings.</p>
                  </div>
                </div>
              </section>

            </motion.div>
          )}

          {/* VIEW: SHOP / LIVE STOCK SHOWROOM */}
          {currentView === 'shop' && !selectedWatch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10"
            >
              <div className="text-center max-w-xl mx-auto space-y-3">
                <h1 className="font-serif text-3xl tracking-widest text-zinc-900 uppercase font-bold">WATCHES FOR SALE</h1>
                <p className="text-xs text-[#C5A880] font-mono tracking-widest uppercase">Curated pre-owned watches across selected price ranges</p>
                <div className="w-12 h-[1px] bg-[#C5A880] mx-auto"></div>
              </div>

              {/* Brand filtration lists */}
              <div className="space-y-4">
                <span className="block text-[10px] tracking-widest font-mono text-zinc-400 uppercase font-bold text-center">FILTER BY BRAND</span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedBrandFilter('All')}
                    className={`px-4.5 py-2 text-[10px] font-semibold tracking-wider uppercase rounded-sm border transition-all ${
                      selectedBrandFilter === 'All' 
                        ? 'bg-[#C5A880] border-[#C5A880] text-black font-bold' 
                        : 'border-zinc-200 text-zinc-650 hover:border-zinc-400 hover:text-black bg-zinc-50'
                    }`}
                  >
                    All Available
                  </button>
                  {brandCategories.map((brandName) => (
                    <button
                      key={brandName}
                      onClick={() => setSelectedBrandFilter(brandName)}
                      className={`px-4.5 py-2 text-[10px] font-semibold tracking-wider uppercase rounded-sm border transition-all ${
                        selectedBrandFilter === brandName 
                          ? 'bg-[#C5A880] border-[#C5A880] text-black font-bold' 
                          : 'border-zinc-200 text-zinc-650 hover:border-zinc-400 hover:text-black bg-zinc-50'
                      }`}
                    >
                      {brandName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listed Showroom grid */}
              {loadingStock ? (
                <div className="text-center py-20">
                  <RefreshCw className="w-8 h-8 text-[#C5A880] animate-spin mx-auto mb-2" />
                  <p className="text-xs text-zinc-500 font-mono uppercase">Retrieving showroom inventory details...</p>
                </div>
              ) : filteredStock.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  {filteredStock.map((watch) => (
                    <div 
                      key={watch.id}
                      onClick={() => {
                        setSelectedWatch(watch);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      title={`View full details for ${watch.brand} ${watch.model}`}
                      className="bg-zinc-50 rounded-sm overflow-hidden border border-zinc-100 hover:border-[#C5A880] transition-all duration-350 flex flex-col justify-between group shadow-xs cursor-pointer hover:shadow-md hover:-translate-y-0.5 animate-fade-in"
                    >
                      
                      <div className="aspect-square w-full overflow-hidden bg-[#F3EFE6] border-b border-zinc-100 relative">
                        <img 
                          src={getWatchCoverImage(watch)} 
                          alt={`${watch.brand} ${watch.model}`}
                          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (img.src !== FALLBACK_WATCH_IMAGE) img.src = FALLBACK_WATCH_IMAGE; }}
                        />
                        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs border border-[#C5A880]/30 px-2.5 py-1 text-[9px] text-[#C5A880] font-mono rounded-sm uppercase tracking-wider shadow-sm font-semibold">
                          {watch.condition}
                        </div>
                      </div>

                      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold">{watch.brand}</span>
                          <h3 className="font-serif text-sm text-zinc-900 uppercase tracking-wider group-hover:text-[#C5A880] transition-colors truncate font-bold">{watch.model}</h3>
                          <p className="text-[10px] text-zinc-550 font-mono">Ref: {watch.reference} | Year: {watch.year}</p>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500 pt-1.5 border-t border-zinc-200/60 mt-1.5">
                            <div>BOX: <span className="text-zinc-800 font-bold">{watch.box}</span></div>
                            <div>PAPERS: <span className="text-zinc-800 font-bold">{watch.papers}</span></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-baseline justify-between pt-1 border-t border-zinc-200/60 mb-3">
                            <span className="text-[10px] text-zinc-500 font-mono uppercase">Price</span>
                            <span className="font-serif text-base text-[#C5A880] font-bold">£{watch.price.toLocaleString()}</span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCheckoutWatch(watch);
                              setIsCheckoutOpen(true);
                            }}
                            className="bg-white hover:bg-[#C5A880] text-zinc-800 hover:text-black border border-zinc-200 hover:border-transparent text-xs font-semibold tracking-widest uppercase px-4 py-2.5 w-full rounded-sm transition-all text-center shadow-xs font-sans font-bold cursor-pointer"
                          >
                            Acquire / Checkout Now
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                // SOLD OUT STATE MANDATED IN SECTION 2
                <div className="text-center py-20 max-w-xl mx-auto space-y-6 bg-zinc-50 rounded border border-zinc-100 p-8 shadow-xs">
                  <div className="w-12 h-12 bg-white rounded-full border border-zinc-200 flex items-center justify-center mx-auto mb-2 text-[#C5A880] shadow-xs">
                    <Clock className="w-6 h-6 shrink-0" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl text-zinc-900 uppercase tracking-wider font-bold">Currently Sold Out</h3>
                    <p className="text-xs text-[#B08A56] font-semibold max-w-sm mx-auto leading-relaxed">
                      Our stock changes frequently. Contact us and we may be able to source this brand through our dealer network.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => { setView('source'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-sm transition-colors w-full sm:w-auto shadow-sm"
                    >
                      Acquire client brief
                    </button>
                    <button
                      onClick={() => setSelectedBrandFilter('All')}
                      className="border border-zinc-200 bg-white text-zinc-700 hover:text-black hover:bg-zinc-50 text-xs font-semibold uppercase tracking-widest px-6 py-3 rounded-sm transition-colors w-full sm:w-auto shadow-xs"
                    >
                      Clear Brand Filter
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          )}

          {/* VIEW: SELL & VALUATION INTAKE */}
          {currentView === 'valuation' && !selectedWatch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ValuationForm />
            </motion.div>
          )}

          {/* VIEW: SOURCE SPECIFIC WATCH */}
          {currentView === 'source' && !selectedWatch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SourcingForm />
            </motion.div>
          )}

          {/* VIEW: PUBLIC CONTACT PAGE */}
          {currentView === 'contact' && !selectedWatch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto px-4 py-12 space-y-12"
            >
              <div className="text-center max-w-xl mx-auto space-y-3">
                <h1 className="font-serif text-3xl tracking-widest text-zinc-900 uppercase font-bold">CONTACT ALEKSANDER HATTON</h1>
                <p className="text-xs text-[#C5A880] font-mono tracking-widest uppercase">Call, WhatsApp or send an enquiry</p>
                <div className="w-12 h-[1px] bg-[#C5A880] mx-auto"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <a
                  href={CONTACT_PHONE_TEL}
                  className="bg-[#C5A880] hover:bg-[#D5B890] text-black text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-sm text-center shadow-sm"
                >
                  Call {CONTACT_PHONE_DISPLAY}
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-sm text-center shadow-sm"
                >
                  WhatsApp Us
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                
                {/* Contact form cards */}
                <div className="bg-zinc-50 border border-zinc-100 p-6 sm:p-8 space-y-6 shadow-sm">
                  <h3 className="font-serif text-sm tracking-widest text-[#C5A880] uppercase border-b border-zinc-200 pb-2 font-bold">
                    Send an Enquiry
                  </h3>

                  {!contactSuccess ? (
                    <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                      {/* Honeypot: hidden from people, tempting to bots. Leave it empty. */}
                      <div className="absolute left-[-9999px] w-px h-px overflow-hidden" aria-hidden="true">
                        <label htmlFor="contact-company">Company</label>
                        <input
                          id="contact-company"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={contactHp}
                          onChange={(e) => setContactHp(e.target.value)}
                        />
                      </div>

                      <div>
                        <label htmlFor="contact-name" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.2 font-semibold">Your Name *</label>
                        <input 
                          id="contact-name"
                          type="text" 
                          required
                          autoComplete="name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="Full legal Name" 
                          className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-zinc-800 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/35 transition-all text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="contact-email" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.2 font-semibold">Email *</label>
                          <input 
                            id="contact-email"
                            type="email" 
                            required
                            autoComplete="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            placeholder="e.g. yourname@example.com" 
                            className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-zinc-800 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/35 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="contact-phone" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.2 font-semibold">Phone (optional)</label>
                          <input 
                            id="contact-phone"
                            type="tel" 
                            autoComplete="tel"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                            placeholder="e.g. 07649 478871" 
                            className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-zinc-800 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/35 transition-all text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="contact-message" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.2 font-semibold">Your Message *</label>
                        <textarea 
                          id="contact-message"
                          rows={5}
                          required
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="Log model specifications, reference codes, viewing times desired..." 
                          className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-zinc-800 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/35 transition-all resize-none text-sm"
                        ></textarea>
                      </div>

                      {contactError && (
                        <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                          {contactError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={contactSending}
                        className="bg-[#C5A880] hover:bg-[#D5B890] text-black font-semibold text-xs uppercase tracking-widest py-3 w-full shadow-md cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {contactSending ? 'SENDING MESSAGE...' : 'SEND MESSAGE'}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-8 space-y-4">
                      <CheckCircle className="w-12 h-12 text-[#C5A880] mx-auto animate-bounce" />
                      <h4 className="font-serif text-lg text-zinc-900 uppercase tracking-wider font-bold">Message Delivered</h4>
                      <p className="text-xs text-zinc-650 max-w-sm mx-auto leading-relaxed">
                        Your message has reached our desk. We will reply to the email address you provided as soon as possible.
                      </p>
                      <button
                        onClick={() => setContactSuccess(false)}
                        className="text-xs font-mono text-[#C5A880] hover:underline"
                      >
                        Submit another communication
                      </button>
                    </div>
                  )}
                </div>

                {/* Left hand details cards */}
                <div className="space-y-6">
                  <div className="bg-zinc-50 border border-zinc-100 p-6 lg:p-8 space-y-4 shadow-sm">
                    <h3 className="font-serif text-[#C5A880] tracking-widest text-xs uppercase font-bold flex items-center gap-2">
                      <Compass className="w-4 h-4" />
                      Sheffield Watch Desk
                    </h3>
                    
                    <div className="space-y-4 text-xs text-zinc-700">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-[#C5A880] mt-0.5" />
                        <span>Sheffield, South Yorkshire, United Kingdom (Established 2025)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-[#C5A880]" />
                        <a href={CONTACT_PHONE_TEL} className="font-semibold text-zinc-800 hover:text-[#C5A880] hover:underline">{CONTACT_PHONE_DISPLAY}</a>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-[#C5A880]" />
                        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-black hover:underline transition-colors font-medium">{CONTACT_EMAIL}</a>
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-150 p-6 bg-zinc-50 text-center space-y-3 shadow-xs">
                    <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-bold">BY APPOINTMENT ASSURANCE</span>
                    <p className="text-xs text-zinc-650 leading-relaxed max-w-xs mx-auto">
                      Private viewings and home appointments are available by booking. For sellers, working, broken, damaged and non-running watches are welcome for valuation.
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* VIEW: CUSTOMER CONSOLE / ACCREDITED CABINET PORTFOLIO */}
          {currentView === 'account' && session?.role === 'customer' && !selectedWatch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ClientDashboard 
                session={session}
                onLogout={handleLogout}
                setView={setView}
              />
            </motion.div>
          )}

          {/* VIEW: ADMIN CONSOLE */}
          {currentView === 'admin' && session?.role === 'dealer' && !selectedWatch && (
            <motion.div
              className="dealer-console-shell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard onLogout={handleLogout} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 3. Footer Section */}
      <Footer 
        setView={setView} 
        openPolicies={(t) => {
          setPolicyType(t);
          setIsPolicyOpen(true);
        }}
      />

      {/* 4. Secure Checkout modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        watch={checkoutWatch} 
        onClose={() => {
          setIsCheckoutOpen(false);
          setCheckoutWatch(null);
        }} 
        onSuccess={() => {
          fetchStock(); // Reload stock status when purchase succeeds
        }}
      />

      {/* 5. Policy Detail drawer */}
      <PolicyModal 
        isOpen={isPolicyOpen} 
        initialTab={policyType} 
        onClose={() => {
          setIsPolicyOpen(false);
          setPolicyType('');
        }}
      />

      {/* 6. Cabinet Portal Auth Modal for Clients & Dealers */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

    </div>
  );
}

// Icon override wrapper for close compatibility
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
