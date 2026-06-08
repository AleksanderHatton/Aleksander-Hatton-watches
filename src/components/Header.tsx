import React from 'react';
import { Menu, X, Shield, ShoppingBag, Eye, User, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  currentView: string;
  setView: (view: string) => void;
  openPolicies: (tab: string) => void;
  session: { role: 'customer' | 'dealer'; user: any } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Header({ 
  currentView, 
  setView, 
  openPolicies, 
  session, 
  onOpenAuth, 
  onLogout 
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { label: 'Home', id: 'home' },
    { label: 'Shop Stock', id: 'shop' },
    { label: 'Sell / Valuation', id: 'valuation' },
    { label: 'Source a Watch', id: 'source' },
    { label: 'Contact', id: 'contact' },
  ];

  const handleNavClick = (viewId: string) => {
    setView(viewId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div 
            onClick={() => handleNavClick('home')} 
            className="cursor-pointer group flex flex-col justify-center items-start"
          >
            <h1 className="font-serif text-xl sm:text-2xl tracking-[0.25em] text-[#C5A880] transition-colors group-hover:text-zinc-950 uppercase font-semibold">
              Aleksander Hatton
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-mono tracking-widest text-[#9A8F80] uppercase">Fine Horology</span>
              <span className="w-1 h-1 rounded-full bg-[#C5A880]"></span>
              <span className="text-[9px] font-mono tracking-widest text-[#9A8F80] uppercase">Sheffield</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 lg:space-x-12">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative text-xs tracking-widest uppercase transition-all duration-300 py-2 font-bold cursor-pointer ${
                  currentView === item.id ? 'text-[#C5A880]' : 'text-zinc-650 hover:text-zinc-950'
                }`}
              >
                {item.label}
                {currentView === item.id && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#C5A880]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Right Header Controls (Unified login) */}
          <div className="hidden md:flex items-center space-x-6 pr-1">
            {session === null ? (
              <button
                onClick={onOpenAuth}
                className={`relative text-xs tracking-widest uppercase transition-all duration-300 py-2 font-bold cursor-pointer flex items-center gap-2 ${
                  currentView === 'auth' ? 'text-[#C5A880]' : 'text-zinc-650 hover:text-[#C5A880]'
                }`}
              >
                <User className="w-3.5 h-3.5 text-[#C5A880]" />
                Cabinet Portal
              </button>
            ) : (
              <div className="flex items-center space-x-6">
                {session.role === 'dealer' ? (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`relative text-xs tracking-widest uppercase transition-all duration-300 py-2 font-bold cursor-pointer flex items-center gap-2 ${
                      currentView === 'admin'
                        ? 'text-[#C5A880]'
                        : 'text-zinc-650 hover:text-[#C5A880]'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-[#C5A880]" />
                    Dealer Console
                    {currentView === 'admin' && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#C5A880]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavClick('account')}
                    className={`relative text-xs tracking-widest uppercase transition-all duration-300 py-2 font-bold cursor-pointer flex items-center gap-2 ${
                      currentView === 'account'
                        ? 'text-[#C5A880]'
                        : 'text-zinc-650 hover:text-[#C5A880]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[#C5A880]" />
                    My Account ({session.user.name.split(' ')[0]})
                    {currentView === 'account' && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#C5A880]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                )}
                
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center p-1.5 text-zinc-450 hover:text-red-600 transition-colors cursor-pointer"
                  title="Sign Out of Portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            {session !== null && (
              <button
                onClick={() => handleNavClick(session.role === 'dealer' ? 'admin' : 'account')}
                className={`p-2 transition-colors ${
                  currentView === 'admin' || currentView === 'account' ? 'text-[#C5A880]' : 'text-zinc-505'
                }`}
                title="Go to Account Portal"
              >
                {session.role === 'dealer' ? <Shield className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-zinc-500 hover:text-[#C5A880] focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-zinc-50 border-b border-zinc-200"
        >
          <div className="px-4 pt-4 pb-6 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`block w-full text-left py-3 px-4 text-xs font-bold tracking-widest uppercase rounded ${
                  currentView === item.id ? 'bg-[#FAF6F0] text-[#C5A880] border-l-2 border-[#C5A880]' : 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            <div className="pt-4 border-t border-zinc-200 flex flex-col gap-3 px-4">
              {session === null ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full bg-zinc-950 hover:bg-zinc-805 text-white text-xs font-bold tracking-widest uppercase py-3 rounded-sm text-center flex items-center justify-center gap-2 cursor-pointer font-bold"
                >
                  <User className="w-4 h-4" />
                  Cabinet Portal Login
                </button>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => handleNavClick(session.role === 'dealer' ? 'admin' : 'account')}
                    className="w-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-bold tracking-widest uppercase py-2.5 rounded-sm text-center flex items-center justify-center gap-2 font-bold"
                  >
                    {session.role === 'dealer' ? <Shield className="w-4 h-4 text-[#C5A880]" /> : <User className="w-4 h-4 text-[#C5A880]" />}
                    {session.role === 'dealer' ? 'Dealer Console' : `My Account Portal`}
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 hover:text-red-750 text-xs font-bold tracking-widest uppercase py-2.5 rounded-sm text-center flex items-center justify-center gap-2 font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out Terminal
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
