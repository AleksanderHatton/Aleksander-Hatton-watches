import React, { useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Upload, ChevronRight, CheckCircle, ShieldAlert, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

const valuationBrands = [
  'A. Lange & Söhne',
  'Accurist',
  'Alpina',
  'Anne Klein',
  'Armani Exchange',
  'Audemars Piguet',
  'Avi-8',
  'Ball',
  'Baume & Mercier',
  'Bell & Ross',
  'Blancpain',
  'BOSS',
  'Breguet',
  'Breitling',
  'Bulova',
  'Bvlgari',
  'Calvin Klein',
  'Cartier',
  'Casio',
  'Certina',
  'Chanel',
  'Chopard',
  'Christopher Ward',
  'Citizen',
  'Corum',
  'Daniel Wellington',
  'Diesel',
  'Doxa',
  'Emporio Armani',
  'Eterna',
  'Festina',
  'Fossil',
  'Franck Muller',
  'Frederique Constant',
  'Garmin',
  'G-Shock',
  'Girard-Perregaux',
  'Grand Seiko',
  'Gucci',
  'Guess',
  'Hamilton',
  'Hublot',
  'Hugo Boss',
  'IWC',
  'Jacob & Co.',
  'Jaeger-LeCoultre',
  'Junghans',
  'Lacoste',
  'Lorus',
  'Longines',
  'Maurice Lacroix',
  'Michael Kors',
  'Mido',
  'Mondaine',
  'Montblanc',
  'Movado',
  'Nixon',
  'Nomos Glashütte',
  'Oakley',
  'Omega',
  'Orient',
  'Oris',
  'Panerai',
  'Parmigiani Fleurier',
  'Patek Philippe',
  'Piaget',
  'Rado',
  'Raymond Weil',
  'Richard Mille',
  'Roger Dubuis',
  'Rolex',
  'Rotary',
  'Sekonda',
  'Seiko',
  'SevenFriday',
  'Skagen',
  'Sinn',
  'Squale',
  'Swatch',
  'TAG Heuer',
  'Tissot',
  'Tommy Hilfiger',
  'Tudor',
  'U-Boat',
  'Ulysse Nardin',
  'Vacheron Constantin',
  'Victorinox',
  'Wenger',
  'Zenith',
  'Other / Not listed'
];

export default function ValuationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredContact: 'Email',
    location: '',
    brand: '',
    model: '',
    reference: '',
    year: '',
    condition: 'Excellent',
    box: 'Unsure',
    papers: 'Unsure',
    receipt: 'Unsure',
    serviceHistory: '',
    askingPrice: '',
    pleaseAdvise: false,
    additionalDetails: ''
  });

  const [photos, setPhotos] = useState<Record<string, string>>({
    front: '',
    back: '',
    side: '',
    boxPapers: '',
    additional: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Refs for file inputs
  const fileInputRefs: Record<string, React.RefObject<HTMLInputElement | null>> = {
    front: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
    boxPapers: useRef<HTMLInputElement>(null),
    additional: useRef<HTMLInputElement>(null)
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Convert File to Base64
  const processFile = (file: File, key: string) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are permitted.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image file size must be less than 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotos(prev => ({
        ...prev,
        [key]: reader.result as string
      }));
    };
    reader.onerror = () => {
      setError('Error parsing watch photo files.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({
    front: false,
    back: false,
    side: false,
    boxPapers: false,
    additional: false
  });

  const handleDrag = (e: React.DragEvent, key: string, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [key]: active }));
  };

  const handleDrop = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [key]: false }));
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0], key);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0], key);
    }
  };

  const triggerFileInput = (key: string) => {
    fileInputRefs[key].current?.click();
  };

  const removePhoto = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotos(prev => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name || !formData.email || !formData.phone || !formData.brand || !formData.model) {
      setError('Please fill in all mandatory customer and watch profile details.');
      setLoading(false);
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    const payload = {
      ...formData,
      askingPrice: formData.pleaseAdvise ? 'Unsure / Please advise' : formData.askingPrice,
      photos
    };

    try {
      await apiFetch('/api/valuations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError('Submitting appraisal details failed. Check connection or file capacities and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Header Segment */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h1 className="font-serif text-3xl sm:text-4xl text-zinc-900 tracking-widest uppercase font-bold">SELL YOUR WATCH</h1>
            <p className="text-xs text-[#C5A880] font-mono tracking-wider uppercase font-semibold">Indicative Valuation &amp; Acquisition Protocol</p>
            <div className="w-12 h-[1px] bg-[#C5A880] mx-auto my-3"></div>
            <p className="text-xs sm:text-sm text-zinc-650 leading-relaxed font-sans">
              Looking to sell your watch? Submit the details below and our team will review the information and contact you with an indicative valuation.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs rounded-sm">
              {error}
            </div>
          )}

          {/* Section 1: Client Details */}
          <section className="bg-zinc-50 border border-zinc-100 p-6 sm:p-8 space-y-6 shadow-sm rounded-sm">
            <h2 className="font-serif text-sm tracking-widest text-[#C5A880] uppercase border-b border-zinc-200 pb-2 flex items-center gap-2 font-bold">
              <span className="w-1.5 h-1.5 bg-[#C5A880] rounded-full"></span>
              1. Customer Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Full Legal Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  required
                  value={formData.name}
                  onChange={handleTextChange}
                  placeholder="e.g. Aleksander Hatton" 
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-[#C5A880] transition-all focus:ring-1 focus:ring-[#C5A880]/30 select-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Email Address *</label>
                <input 
                  type="email" 
                  name="email" 
                  required
                  value={formData.email}
                  onChange={handleTextChange}
                  placeholder="e.g. yourname@example.com" 
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-[#C5A880] transition-all focus:ring-1 focus:ring-[#C5A880]/30 select-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Phone Number *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  required
                  value={formData.phone}
                  onChange={handleTextChange}
                  placeholder="e.g. +44 7123 456789" 
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-[#C5A880] transition-all focus:ring-1 focus:ring-[#C5A880]/30 select-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Preferred contact channel</label>
                <select 
                  name="preferredContact"
                  value={formData.preferredContact}
                  onChange={handleTextChange}
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-850 focus:outline-none focus:border-[#C5A880] transition-all focus:ring-1 focus:ring-[#C5A880]/30 text-sm"
                >
                  <option value="Email">Email Correspondence</option>
                  <option value="Phone">Direct Voice Call</option>
                  <option value="WhatsApp">Discreet WhatsApp Message</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Your Location / City *</label>
                <input 
                  type="text" 
                  name="location" 
                  required
                  value={formData.location}
                  onChange={handleTextChange}
                  placeholder="e.g. Sheffield, UK" 
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-[#C5A880] transition-all focus:ring-1 focus:ring-[#C5A880]/30 select-none text-sm"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Watch Details */}
          <section className="bg-zinc-50 border border-zinc-100 p-6 sm:p-8 space-y-6 shadow-sm rounded-sm">
            <h2 className="font-serif text-sm tracking-widest text-[#C5A880] uppercase border-b border-zinc-200 pb-2 flex items-center gap-2 font-bold">
              <span className="w-1.5 h-1.5 bg-[#C5A880] rounded-full"></span>
              2. Horology Specifications
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Watch Brand *</label>
                <select 
                  name="brand" 
                  required
                  value={formData.brand}
                  onChange={handleTextChange}
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-850 focus:outline-none focus:border-[#C5A880] transition-all text-sm"
                >
                  <option value="">-- Click to select Brand --</option>
                  {valuationBrands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Model Name / Description *</label>
                <input 
                  type="text" 
                  name="model" 
                  required
                  value={formData.model}
                  onChange={handleTextChange}
                  placeholder="e.g. Submariner Starbuck Green bezel" 
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-805 focus:outline-none focus:border-[#C5A880] transition-all focus:ring-1 focus:ring-[#C5A880]/30 select-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Reference Number</label>
                <input 
                  type="text" 
                  name="reference" 
                  value={formData.reference}
                  onChange={handleTextChange}
                  placeholder="e.g. 126610LV or unspecified" 
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-805 focus:outline-none focus:border-[#C5A880] transition-all focus:ring-1 focus:ring-[#C5A880]/30 select-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Year Sourced / Acquired</label>
                <input 
                  type="text" 
                  name="year" 
                  value={formData.year}
                  onChange={handleTextChange}
                  placeholder="e.g. 2022 or Unsure" 
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-805 focus:outline-none focus:border-[#C5A880] transition-all focus:ring-1 focus:ring-[#C5A880]/30 select-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Current Physical Condition</label>
                <select 
                  name="condition"
                  value={formData.condition}
                  onChange={handleTextChange}
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-850 focus:outline-none focus:border-[#C5A880] transition-all text-sm"
                >
                  <option value="Unworn">Unworn (Factory stickers/mint)</option>
                  <option value="Mint">Mint (Like-new blemishes)</option>
                  <option value="Excellent">Excellent (Minor swirls, razor sharp)</option>
                  <option value="Very Good">Very Good (Light cosmetic wear only)</option>
                  <option value="Good">Good (Moderate daily wear signs)</option>
                  <option value="Fair">Fair (Scratching/signs of heavy use)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Is Original Store Box Included?</label>
                <select 
                  name="box"
                  value={formData.box}
                  onChange={handleTextChange}
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-855 focus:outline-none focus:border-[#C5A880] transition-all text-sm"
                >
                  <option value="Yes">Yes (Full Box included)</option>
                  <option value="No">No (Watch only)</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Are Official Identity Papers / Warranty cards Included?</label>
                <select 
                  name="papers"
                  value={formData.papers}
                  onChange={handleTextChange}
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-855 focus:outline-none focus:border-[#C5A880] transition-all text-sm"
                >
                  <option value="Yes">Yes (Full Certified Warranty papers)</option>
                  <option value="No">No (Out of warrant / No registration papers)</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Is Original Purchase Receipt Included?</label>
                <select 
                  name="receipt"
                  value={formData.receipt}
                  onChange={handleTextChange}
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-855 focus:outline-none focus:border-[#C5A880] transition-all text-sm"
                >
                  <option value="Yes">Yes (Original retail receipt available)</option>
                  <option value="No">No</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Documented Service History</label>
                <input 
                  type="text" 
                  name="serviceHistory" 
                  value={formData.serviceHistory}
                  onChange={handleTextChange}
                  placeholder="e.g. Serviced by Rolex in March 2023 with service paper card" 
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-805 focus:outline-none focus:border-[#C5A880] transition-all focus:ring-1 focus:ring-[#C5A880]/30 select-none text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">Asking Price (£)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="pleaseAdvise"
                      name="pleaseAdvise" 
                      checked={formData.pleaseAdvise}
                      onChange={handleTextChange}
                      className="accent-[#C5A880]"
                    />
                    <label htmlFor="pleaseAdvise" className="text-xs text-[#C5A880] font-mono cursor-pointer uppercase font-semibold">Unsure / Please advise me</label>
                  </div>
                </div>
                {!formData.pleaseAdvise && (
                  <input 
                    type="text" 
                    name="askingPrice" 
                    value={formData.askingPrice}
                    onChange={handleTextChange}
                    placeholder="e.g. £14,500" 
                    className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-2.5 text-xs text-zinc-805 focus:outline-none focus:border-[#C5A880] transition-all focus:ring-1 focus:ring-[#C5A880]/30 select-none text-sm"
                  />
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">Additional Details, Engravings or Chronology notes</label>
                <textarea 
                  name="additionalDetails" 
                  rows={4}
                  value={formData.additionalDetails}
                  onChange={handleTextChange}
                  placeholder="Describe bezel conditions, clasp swirls, missing bracelet links, dial details..." 
                  className="w-full bg-white border border-zinc-200 rounded-sm px-4 py-3 text-xs text-zinc-805 focus:outline-none focus:border-[#C5A880] transition-all focus:ring-1 focus:ring-[#C5A880]/30 resize-none text-sm"
                ></textarea>
              </div>
            </div>
          </section>

          {/* Section 3: High-Res Asset Photos (Bespoke drag & drop constraints) */}
          <section className="bg-zinc-50 border border-zinc-100 p-6 sm:p-8 space-y-6 shadow-sm rounded-sm">
            <h2 className="font-serif text-sm tracking-widest text-[#C5A880] uppercase border-b border-zinc-200 pb-2 flex items-center gap-2 font-bold">
              <span className="w-1.5 h-1.5 bg-[#C5A880] rounded-full"></span>
              3. Visual Verification Assets
            </h2>
            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xl font-mono">
              High quality assets allow fast, precise valuations. Please drag-and-drop or select up to 5 photos. (Max size 8MB each).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Photo Input mapping */}
              {[
                { label: 'Front Dial *', key: 'front' },
                { label: 'Back Case *', key: 'back' },
                { label: 'Side Crown *', key: 'side' },
                { label: 'Box / Papers', key: 'boxPapers' },
                { label: 'Details / Other', key: 'additional' }
              ].map((slot) => {
                const isUploaded = !!photos[slot.key];
                const isActive = dragActive[slot.key];

                return (
                  <div 
                    key={slot.key}
                    onDragEnter={(e) => handleDrag(e, slot.key, true)}
                    onDragOver={(e) => handleDrag(e, slot.key, true)}
                    onDragLeave={(e) => handleDrag(e, slot.key, false)}
                    onDrop={(e) => handleDrop(e, slot.key)}
                    onClick={() => triggerFileInput(slot.key)}
                    className={`aspect-square rounded-sm border-2 border-dashed cursor-pointer relative overflow-hidden flex flex-col items-center justify-center p-3 text-center transition-all ${
                      isUploaded 
                        ? 'border-emerald-600 bg-emerald-50/50' 
                        : isActive 
                        ? 'border-[#C5A880] bg-[#C5A880]/5' 
                        : 'border-zinc-200 hover:border-zinc-400 bg-white'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRefs[slot.key]}
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileInputChange(e, slot.key)}
                    />

                    {isUploaded ? (
                      <div className="absolute inset-0 group">
                        <img 
                          src={photos[slot.key]} 
                          alt={slot.label} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-[10px] text-white">
                          <span className="font-mono font-bold">{slot.label}</span>
                          <button 
                            type="button"
                            onClick={(e) => removePhoto(slot.key, e)}
                            className="mt-2 px-2.5 py-1 rounded bg-red-650 hover:bg-red-750 text-white font-semibold font-sans tracking-wide uppercase shadow text-[9.5px]"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white p-0.5 rounded-full shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className={`w-6 h-6 mb-2 ${isActive ? 'text-[#C5A880]' : 'text-zinc-400'}`} />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">{slot.label}</span>
                        <span className="text-[9px] text-zinc-400 mt-1">Drag or Click</span>
                      </>
                    )}
                  </div>
                );
              })}

            </div>
          </section>

          {/* Sourcing and pricing Disclaimer */}
          <div className="flex gap-3 p-4 bg-[#FAF7F2] border border-[#EADBBD] rounded-sm shadow-xs">
            <ShieldAlert className="w-5 h-5 text-[#A07B43] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#A07B43] leading-relaxed font-mono uppercase font-semibold">
              <strong>OFFICIAL APPRAISAL DISCLAIMER:</strong> Valuations are indicative only and subject to inspection, authentication, market conditions, and final agreement. Physical elements will be chemical analyzed and referenced against global lost-and-stolen registers before transaction closure.
            </p>
          </div>

          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#C5A880] hover:bg-[#D5B890] disabled:bg-[#342D23] disabled:text-zinc-500 text-black font-semibold text-xs uppercase tracking-widest px-10 py-4 rounded-sm transition-colors duration-300 w-full sm:w-auto shadow-md font-sans text-xs cursor-pointer font-bold"
            >
              {loading ? 'PROCESSING SECURE UPLOAD & PACKAGING...' : 'SUBMIT APPRAISAL REQUEST'}
            </button>
          </div>

        </form>
      ) : (
        // Successful Submission Card
        <div className="max-w-2xl mx-auto py-12 px-6 bg-zinc-50 border border-zinc-150 rounded-sm text-center space-y-6 shadow-md">
          <div className="w-16 h-16 rounded-full bg-[#FAF6F0] flex items-center justify-center mx-auto border border-[#C5A880]">
            <Sparkles className="w-8 h-8 text-[#C5A880] animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-[#C09B65] uppercase tracking-wider font-bold">INTAKE COMPLETED</h2>
            <p className="text-zinc-500 text-[11px] font-mono">APPRAISAL PIPELINE REFERENCE VERIFIED</p>
          </div>

          <p className="text-xs sm:text-sm text-zinc-650 leading-relaxed font-sans max-w-md mx-auto">
            Thank you. Your valuation request has been received. A member of Aleksander Hatton will review your submission and contact you shortly.
          </p>

          <div className="p-4 bg-white rounded-sm text-left border border-zinc-200 shadow-xs space-y-2 text-xs">
            <div className="flex gap-2 text-[10px] uppercase font-mono tracking-wider text-emerald-600 mt-2 font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Automated notifications synchronized</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono leading-relaxed mt-2 uppercase font-semibold">
              • Direct email containing high-res horology snapshots sent to our Shefield appraisals team: <strong>inquiries@ahwatches.com</strong>.<br />
              • Auto-conf email dispatched to your personal details.
            </p>
          </div>

          <button
            onClick={() => {
              setSuccess(false);
              setFormData({
                name: '',
                email: '',
                phone: '',
                preferredContact: 'Email',
                location: '',
                brand: '',
                model: '',
                reference: '',
                year: '',
                condition: 'Excellent',
                box: 'Unsure',
                papers: 'Unsure',
                receipt: 'Unsure',
                serviceHistory: '',
                askingPrice: '',
                pleaseAdvise: false,
                additionalDetails: ''
              });
              setPhotos({
                front: '',
                back: '',
                side: '',
                boxPapers: '',
                additional: ''
              });
            }}
            className="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-805 text-xs font-semibold uppercase tracking-widest px-8 py-3.5 rounded-sm transition-all shadow-xs font-bold cursor-pointer"
          >
            Submit Another Appraisal
          </button>
        </div>
      )}

    </div>
  );
}
