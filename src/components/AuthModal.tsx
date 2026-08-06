import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User, Phone, X, AlertCircle, CheckCircle, RefreshCw, KeyRound } from 'lucide-react';
import { getCurrentUserProfile, supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: { role: 'customer' | 'dealer'; user: any }) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (authError) {
          setError(authError.message || 'Authentication failed. Please check credentials.');
          setLoading(false);
          return;
        }

        const profile = await getCurrentUserProfile();
        if (!profile) {
          setError('Login succeeded but the customer profile could not be loaded.');
          setLoading(false);
          return;
        }

        setSuccess('Authentication approved. Opening secure cabinet...');
        setTimeout(() => {
          onSuccess({
            role: profile.role === 'admin' || profile.role === 'dealer' ? 'dealer' : 'customer',
            user: profile,
          });
          setLoading(false);
          onClose();
        }, 500);

      } else {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }

        const { error: registerError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              name: name.trim(),
              phone: phone.trim(),
            },
          },
        });

        if (registerError) {
          setError(registerError.message || 'Registration failed.');
          setLoading(false);
          return;
        }

        const profile = await getCurrentUserProfile();
        setSuccess('Account created. Check your email if Supabase email confirmation is enabled.');

        if (profile) {
          setTimeout(() => {
            onSuccess({
              role: profile.role === 'admin' || profile.role === 'dealer' ? 'dealer' : 'customer',
              user: profile,
            });
            setLoading(false);
            onClose();
          }, 700);
        } else {
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection timeout. Secure database is offline.');
      setLoading(false);
    }
  };

  const handleTabSwitch = (newTab: 'login' | 'register') => {
    setTab(newTab);
    setError('');
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/45 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white rounded-sm border border-zinc-200 p-6 sm:p-8 space-y-6 shadow-2xl relative"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center bg-zinc-50 text-[#C5A880] mb-2 shadow-inner">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <h3 className="font-serif text-lg sm:text-xl tracking-[0.2em] text-[#C5A880] uppercase font-bold">
            Cabinet Portal
          </h3>
          <p className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">
            {tab === 'login' ? 'Secure Member & Dealer Access' : 'Create Exclusive Broker Account'}
          </p>
        </div>

        {/* Dynamic Status Badges */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-xs font-mono text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-700 text-xs font-mono text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 animate-bounce" />
            <span>{success}</span>
          </div>
        )}

        {/* Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 border-b border-zinc-200 pb-4">
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`py-1.5 text-[10px] font-mono uppercase font-bold tracking-wider transition-all border-b-2 cursor-pointer ${
              tab === 'login' 
                ? 'border-[#C5A880] text-[#C5A880]' 
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('register')}
            className={`py-1.5 text-[10px] font-mono uppercase font-bold tracking-wider transition-all border-b-2 cursor-pointer ${
              tab === 'register' 
                ? 'border-[#C5A880] text-[#C5A880]' 
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {tab === 'register' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-700 mb-1 font-bold">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-650" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Alexander Mercer" 
                    className="w-full bg-white border border-zinc-200 rounded-sm pl-10 pr-4 py-2.5 text-zinc-900 font-sans focus:outline-none focus:border-[#C5A880] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-700 mb-1 font-bold">Dealer contact phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-650" />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., +44 (0) 7700 900077" 
                    className="w-full bg-white border border-zinc-200 rounded-sm pl-10 pr-4 py-2.5 text-zinc-900 font-mono focus:outline-none focus:border-[#C5A880] text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-700 mb-1 font-bold">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-650" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., mail@example.com" 
                className="w-full bg-white border border-zinc-200 rounded-sm pl-10 pr-4 py-2.5 text-zinc-900 font-mono focus:outline-none focus:border-[#C5A880] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-700 mb-1 font-bold">Secret Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-650" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-white border border-zinc-200 rounded-sm pl-10 pr-4 py-2.5 text-zinc-900 font-mono focus:outline-none focus:border-[#C5A880] text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C5A880] hover:bg-[#D5B890] text-black font-semibold text-xs tracking-widest uppercase py-3 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : tab === 'login' ? (
              'Access Account'
            ) : (
              'Create Broker Access'
            )}
          </button>
        </form>

        <div className="p-3.5 bg-zinc-50 text-zinc-500 font-mono text-[9px] leading-relaxed uppercase border border-zinc-200 text-center">
          {tab === 'login' ? (
            <span>
              Secure connection established. All session activities and ledger validations are fully audited.
            </span>
          ) : (
            <span>
              All client files are encrypted. New account registrations will synchronize across active valuations and sourcing traces automatically.
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
