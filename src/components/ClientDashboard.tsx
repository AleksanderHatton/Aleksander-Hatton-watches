import React, { useEffect, useState } from 'react';
import { 
  Compass, ShieldCheck, Mail, Phone, Calendar, Banknote, Clock, Award, 
  ChevronRight, RefreshCw, ShoppingBag, LogOut, FileText, Sparkles, Inbox
} from 'lucide-react';
import { Watch, ValuationRequest, SourcingRequest, Order } from '../types';
import { apiFetch } from '../lib/api';

interface ClientDashboardProps {
  session: {
    user: {
      name: string;
      email: string;
      phone?: string;
      id?: string;
    };
  };
  onLogout: () => void;
  setView: (view: string) => void;
}

export default function ClientDashboard({ session, onLogout, setView }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'valuations' | 'sourcing'>('orders');
  const [loading, setLoading] = useState(false);
  
  // Data lists filtered by current customer email
  const [orders, setOrders] = useState<Order[]>([]);
  const [valuations, setValuations] = useState<ValuationRequest[]>([]);
  const [sourcing, setSourcing] = useState<SourcingRequest[]>([]);
  const [refreshSeed, setRefreshSeed] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const clientEmail = session.user.email.toLowerCase().trim();
        
        const [allOrders, allValuations, allSourcing] = await Promise.all([
          apiFetch<Order[]>('/api/orders'),
          apiFetch<ValuationRequest[]>('/api/valuations'),
          apiFetch<SourcingRequest[]>('/api/sourcing')
        ]);

        setOrders(allOrders.filter((o: Order) => o.clientEmail.toLowerCase().trim() === clientEmail));
        setValuations(allValuations.filter((v: ValuationRequest) => v.email.toLowerCase().trim() === clientEmail));
        setSourcing(allSourcing.filter((s: SourcingRequest) => s.email.toLowerCase().trim() === clientEmail));
      } catch (err) {
        console.error('Error fetching client dashboard resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session.user.email, refreshSeed]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[70vh]">
      
      {/* Dashboard Top Banner */}
      <div className="bg-zinc-50 border border-zinc-200/60 p-6 sm:p-10 rounded-sm mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs relative overflow-hidden">
        {/* Decorative corner element */}
        <div className="absolute top-0 right-0 w-36 h-36 border-t border-r border-[#C5A880]/15 pointer-events-none transform translate-x-12 -translate-y-12 rotate-45"></div>
        
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-bold bg-[#FAF6F0] px-2.5 py-1 rounded-sm border border-[#C5A880]/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Premium Member
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3.5xl tracking-wide text-zinc-900 uppercase font-semibold">
            Hello, {session.user.name}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500 font-medium font-mono uppercase">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
              {session.user.email}
            </span>
            {session.user.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                {session.user.phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0 z-10">
          <button
            onClick={() => setRefreshSeed(prev => prev + 1)}
            className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-650 hover:text-zinc-950 font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Ledger
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 bg-zinc-950 hover:bg-neutral-800 text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            Term Session
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div 
          onClick={() => setActiveTab('orders')}
          className={`border p-6 rounded-sm cursor-pointer transition-all ${
            activeTab === 'orders' 
              ? 'border-[#C5A880] bg-[#FAF6F0]/20 shadow-md' 
              : 'border-zinc-200/70 hover:border-zinc-300 hover:bg-zinc-50/50 bg-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-semibold block">Acquired Assets</span>
              <p className="font-serif text-3xl font-bold text-zinc-900">{orders.length}</p>
            </div>
            <div className="w-9 h-9 rounded bg-[#FAF6F0] text-[#C5A880] flex items-center justify-center border border-[#C5A880]/10">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-4 outline-none flex items-center gap-1">
            Browse acquisition receipts <ChevronRight className="w-3 h-3 text-[#C5A880]" />
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('valuations')}
          className={`border p-6 rounded-sm cursor-pointer transition-all ${
            activeTab === 'valuations' 
              ? 'border-[#C5A880] bg-[#FAF6F0]/20 shadow-md' 
              : 'border-zinc-200/70 hover:border-zinc-300 hover:bg-zinc-50/50 bg-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-semibold block">Appraisal Files</span>
              <p className="font-serif text-3xl font-bold text-zinc-900">{valuations.length}</p>
            </div>
            <div className="w-9 h-9 rounded bg-[#FAF6F0] text-[#C5A880] flex items-center justify-center border border-[#C5A880]/10">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-4 outline-none flex items-center gap-1">
            Check appraisal estimates <ChevronRight className="w-3 h-3 text-[#C5A880]" />
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('sourcing')}
          className={`border p-6 rounded-sm cursor-pointer transition-all ${
            activeTab === 'sourcing' 
              ? 'border-[#C5A880] bg-[#FAF6F0]/20 shadow-md' 
              : 'border-zinc-200/70 hover:border-zinc-300 hover:bg-zinc-50/50 bg-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-semibold block">Active Traces</span>
              <p className="font-serif text-3xl font-bold text-zinc-900">{sourcing.length}</p>
            </div>
            <div className="w-9 h-9 rounded bg-[#FAF6F0] text-[#C5A880] flex items-center justify-center border border-[#C5A880]/10">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-4 outline-none flex items-center gap-1">
            Trace sourcing statuses <ChevronRight className="w-3 h-3 text-[#C5A880]" />
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="border border-zinc-200/60 rounded-sm bg-white overflow-hidden shadow-xs">
        
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-zinc-200/80 bg-zinc-50/50">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest border-r border-zinc-200/60 transition-colors cursor-pointer ${
              activeTab === 'orders' 
                ? 'bg-white text-[#C5A880] border-b-2 border-b-[#C5A880]' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            My Acquisitions ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('valuations')}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest border-r border-zinc-200/60 transition-colors cursor-pointer ${
              activeTab === 'valuations' 
                ? 'bg-white text-[#C5A880] border-b-2 border-b-[#C5A880]' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            My Valuations ({valuations.length})
          </button>
          <button
            onClick={() => setActiveTab('sourcing')}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${
              activeTab === 'sourcing' 
                ? 'bg-white text-[#C5A880] border-b-2 border-b-[#C5A880]' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Sourcing Commissions ({sourcing.length})
          </button>
        </div>

        {/* Tab Panel Body */}
        <div className="p-6 sm:p-8">
          
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3.5">
              <RefreshCw className="w-8 h-8 text-[#C5A880] animate-spin" />
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-405">Recalibrating Secure Vault Database...</p>
            </div>
          ) : (
            <div>
              
              {/* TAB 1: ORDERS (ACQUISITIONS) */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {orders.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-zinc-200 bg-zinc-50/30 rounded-sm space-y-4 max-w-lg mx-auto">
                      <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                      <div className="space-y-1">
                        <h4 className="font-serif text-sm font-bold text-zinc-700 uppercase tracking-wide">NO RECENT ACQUISITIONS PRE-RECORDED</h4>
                        <p className="text-xs text-zinc-500 leading-normal font-sans max-w-xs mx-auto">
                          You haven't purchased any luxury timepieces online using this account. Sourced watches purchased via private appointments will register shortly.
                        </p>
                      </div>
                      <button
                        onClick={() => { setView('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="bg-black hover:bg-neutral-800 text-white font-mono text-[10px] tracking-wider uppercase font-bold py-2.5 px-6 rounded-sm transition-all cursor-pointer"
                      >
                        Browse Showroom Catalog
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-[10px] font-mono uppercase text-zinc-400 max-w-2xl tracking-wide flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Transactions listed below represent legal acquisitions processed and verified by our auditing desks
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {orders.map((order) => (
                          <div 
                            key={order.id} 
                            className="bg-zinc-50 border border-zinc-150 rounded-sm p-6 relative overflow-hidden flex flex-col justify-between shadow-xs"
                          >
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">Acquisition Ref</span>
                                  <h4 className="font-mono text-xs text-zinc-900 font-bold uppercase">{order.id}</h4>
                                </div>
                                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                                  {order.paymentStatus === 'Paid' ? 'Settled & Issued' : order.paymentStatus}
                                </span>
                              </div>

                              <div className="border-t border-zinc-200/60 py-3.5 space-y-1 text-xs">
                                <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Allocated Timepiece</span>
                                <p className="font-serif font-bold text-zinc-900 text-sm uppercase">
                                  {order.watchDetails?.brand} {order.watchDetails?.model}
                                </p>
                                <p className="text-[10px] font-mono text-zinc-500">
                                  Specification Reference: {order.watchDetails?.reference || 'N/A'}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-[11px] bg-white border border-zinc-150 p-3 rounded-sm">
                                <div>
                                  <span className="text-[9px] font-mono uppercase text-zinc-400 block font-semibold">Funding Method</span>
                                  <span className="font-mono text-zinc-700 uppercase font-bold text-[10px]">{order.paymentMethod}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-mono uppercase text-zinc-400 block font-semibold">Acquisition Cost</span>
                                  <span className="font-serif text-zinc-900 font-bold text-xs">£{order.watchDetails?.price.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-zinc-150 pt-4 mt-4 flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-mono">
                              <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                              <span>Acquired: {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: VALUATIONS */}
              {activeTab === 'valuations' && (
                <div className="space-y-6">
                  {valuations.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-zinc-200 bg-zinc-50/30 rounded-sm space-y-4 max-w-lg mx-auto">
                      <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                      <div className="space-y-1">
                        <h4 className="font-serif text-sm font-bold text-zinc-700 uppercase tracking-wide">NO TIMEPIECE APPRAISALS ON FILE</h4>
                        <p className="text-xs text-zinc-500 leading-normal font-sans max-w-xs mx-auto">
                          Keep your private investments documented. Propose your watches to our acquisitions desk for high-value buyouts.
                        </p>
                      </div>
                      <button
                        onClick={() => { setView('valuation'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="bg-[#C5A880] hover:bg-[#D5B890] text-black font-mono text-[10px] tracking-wider uppercase font-bold py-2.5 px-6 rounded-sm transition-all cursor-pointer"
                      >
                        Submit Appraisal File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-[10px] font-mono uppercase text-zinc-400 max-w-2xl tracking-wide flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                        Indicated assessments below are updated in real-time by our master horologists
                      </p>

                      <div className="space-y-4">
                        {valuations.map((v) => (
                          <div 
                            key={v.id}
                            className="bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 rounded-sm p-5 sm:p-6 transition-colors shadow-xs"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200/60">
                              <div>
                                <span className="text-[9px] font-mono uppercase tracking-widest text-[#C5A880] font-bold block">Appraisal Folder Ref</span>
                                <h4 className="font-mono text-xs text-zinc-950 font-bold uppercase">{v.id}</h4>
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded border uppercase ${
                                v.status === 'Pending Review' 
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                  : v.status === 'Offered' 
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                  : v.status === 'Approved' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                              }`}>
                                {v.status === 'Pending Review' ? 'Awaiting Analytical Audit' : v.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4 text-xs font-sans">
                              <div className="space-y-1">
                                <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold block">Timepiece Description</span>
                                <p className="font-serif font-bold text-zinc-900 text-[13px] uppercase">
                                  {v.brand} {v.model}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-mono">Reference Ref: {v.reference}</p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold block">Physical Condition</span>
                                <p className="text-zinc-850 font-semibold">{v.condition}</p>
                                <p className="text-[9.5px] text-zinc-500 font-mono">Box: {v.box} | Papers: {v.papers}</p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9px] font-mono uppercase text-[#C5A880] font-bold block">Aspirational Target Price</span>
                                <p className="font-serif font-bold text-zinc-950 text-sm">
                                  {v.askingPrice.startsWith('£') ? v.askingPrice : `£${Number(v.askingPrice).toLocaleString()}`}
                                </p>
                                <p className="text-[9.5px] text-zinc-400 font-mono">Receipt: {v.receipt}</p>
                              </div>
                            </div>

                            {v.adminNotes ? (
                              <div className="mt-2 p-4 bg-white border border-zinc-200 rounded-sm">
                                <span className="text-[9px] font-mono uppercase text-[#C5A880] font-bold block mb-1">Acquisitions Officer Response note</span>
                                <p className="text-xs text-zinc-700 italic font-medium leading-relaxed font-sans">
                                  "{v.adminNotes}"
                                </p>
                              </div>
                            ) : (
                              <div className="mt-2 p-3.5 bg-[#FAF6F0]/40 border border-[#C5A880]/15 rounded-sm flex items-center gap-2 text-[10px] text-[#A28F70] font-mono uppercase font-bold">
                                <Award className="w-4 h-4 text-[#C5A880] shrink-0" />
                                <span>A horology analyst is researching previous auction listings to formulate standard buyouts.</span>
                              </div>
                            )}

                            <div className="border-t border-zinc-150 pt-3 mt-4 text-[9.5px] font-mono uppercase text-zinc-400 flex justify-between items-center">
                              <span>Submitted: {new Date(v.createdAt).toLocaleDateString()}</span>
                              <span className="text-[#C5A880] font-bold">{v.preferredContact} preferred contact</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SOURCING */}
              {activeTab === 'sourcing' && (
                <div className="space-y-6">
                  {sourcing.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-zinc-200 bg-zinc-50/30 rounded-sm space-y-4 max-w-lg mx-auto">
                      <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                      <div className="space-y-1">
                        <h4 className="font-serif text-sm font-bold text-zinc-700 uppercase tracking-wide">NO SOURCING AGREEMENTS COMMITTED</h4>
                        <p className="text-xs text-zinc-500 leading-normal font-sans max-w-xs mx-auto">
                          Looking for standard hard-to-acquire references (Daytona, Nautilus, Royal Oak)? Instruct our sourcing desk.
                        </p>
                      </div>
                      <button
                        onClick={() => { setView('source'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="bg-black hover:bg-neutral-800 text-white font-mono text-[10px] tracking-wider uppercase font-bold py-2.5 px-6 rounded-sm transition-all cursor-pointer"
                      >
                        Place Sourcing Request
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-[10px] font-mono uppercase text-zinc-400 max-w-2xl tracking-wide flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-zinc-400" />
                        We trace watches across our certified list of international boutique suppliers and wholesalers
                      </p>

                      <div className="space-y-4">
                        {sourcing.map((s) => (
                          <div 
                            key={s.id}
                            className="bg-zinc-50 border border-zinc-200 rounded-sm p-6 relative flex flex-col justify-between shadow-xs"
                          >
                            <div>
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-205">
                                <div>
                                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#C5A880] font-bold block">Trace File Ref</span>
                                  <h4 className="font-mono text-xs text-zinc-950 font-bold uppercase">{s.id}</h4>
                                </div>
                                <span className={`text-[10.5px] font-mono font-bold px-3 py-1 rounded border uppercase ${
                                  s.status === 'Active Sourcing' 
                                    ? 'bg-[#C5A880]/10 text-[#C5A880] border-[#C5A880]/20' 
                                    : s.status === 'Watch Found' 
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                    : s.status === 'Completed' 
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-200'
                                }`}>
                                  {s.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 py-5 text-xs text-zinc-700">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold block">Requested Piece</span>
                                  <p className="font-serif font-bold text-zinc-900 uppercase text-[12.5px]">{s.brand}</p>
                                  <p className="text-zinc-650 uppercase font-semibold">{s.model}</p>
                                  <p className="text-[10px] font-mono text-zinc-500">Ref: {s.reference}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold block">Target Budget</span>
                                  <p className="font-serif font-bold text-zinc-950 text-[13px]">{s.budget}</p>
                                  <p className="text-[10px] font-mono text-zinc-505">Timeframe: {s.timeframe}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold block">Preferred Specs</span>
                                  <p className="font-medium text-zinc-900">{s.condition} Condition</p>
                                  <p className="text-[10px] font-mono text-zinc-500">Box &amp; Papers: {s.boxPapers}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold block">Auditing Coordinates</span>
                                  <p className="font-medium text-zinc-900">Registered EU-wide Network</p>
                                  <p className="text-[10px] font-mono text-zinc-500">Trace updated: {new Date(s.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>

                              {s.adminNotes && (
                                <div className="p-4 bg-white border border-zinc-200 rounded-sm mt-1">
                                  <span className="text-[9px] font-mono uppercase text-[#C5A880] font-bold block mb-1">Acquisitions Trace Log Update</span>
                                  <p className="text-xs text-zinc-755 italic font-medium leading-relaxed">
                                    "{s.adminNotes}"
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="border-t border-zinc-200/60 pt-3 mt-4 flex items-center gap-1.5 text-[9.5px] font-mono text-zinc-400 uppercase">
                              <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                              <span>Committed Trace Commission: {new Date(s.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
