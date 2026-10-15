import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, CheckCircle, Sparkles } from 'lucide-react';

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const BookDemoModal: React.FC<BookDemoModalProps> = ({ isOpen, onClose, showToast }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [outletsCount, setOutletsCount] = useState('1');
  const [city, setCity] = useState('Gurgaon');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName || !personName || !phone) {
      showToast('Please fill in your restaurant name, contact person, and phone number.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2dd4bf', '#38bdf8', '#f59e0b', '#ffffff'],
      });
      showToast(`Demo booked for ${restaurantName}! Our enterprise deployment team will coordinate your rollout.`);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#071d31] border border-[#16426a] rounded-2xl p-6 sm:p-8 shadow-2xl text-[#c2d5e3] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#799ab2] hover:text-[#dbeaf5] p-1 rounded-lg transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-teal-300">
              <CheckCircle className="w-10 h-10" />
            </div>
            <span className="text-xs uppercase tracking-widest font-mono text-teal-400 font-bold block mb-2">
              Walkthrough Confirmed
            </span>
            <h3 className="text-2xl font-extrabold text-[#dbeaf5] mb-3">
              We're Ready to Onboard {restaurantName}!
            </h3>
            <p className="text-sm text-[#8daec7] leading-relaxed mb-6">
              Our founding team (led by <b className="text-teal-300">Utkarsh Yadav</b>) will personally connect on WhatsApp within 2 hours to provision your sandbox menu, recipe BOMs, and branch registers.
            </p>
            <div className="p-4 bg-[#051423] border border-[#143b5e] rounded-xl text-xs text-left mb-6 space-y-1.5 font-mono">
              <div className="flex justify-between"><span className="text-[#799ab2]">Brand:</span> <span className="text-white font-semibold">{restaurantName}</span></div>
              <div className="flex justify-between"><span className="text-[#799ab2]">Contact:</span> <span className="text-white font-semibold">{personName}</span></div>
              <div className="flex justify-between"><span className="text-[#799ab2]">Phone:</span> <span className="text-teal-300 font-semibold">{phone}</span></div>
              <div className="flex justify-between"><span className="text-[#799ab2]">Outlets:</span> <span className="text-white font-semibold">{outletsCount} Branch(es) in {city}</span></div>
              <div className="flex justify-between"><span className="text-[#799ab2]">Direct Helpline:</span> <span className="text-sky-300 font-bold">+91 9554460651</span></div>
            </div>
            <button
              onClick={() => {
                setIsSuccess(false);
                onClose();
              }}
              className="w-full py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              Return to Website
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-teal-400 uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" /> F&B CHAIN ROLLOUT
            </div>
            <h2 className="text-2xl font-extrabold text-[#dbeaf5] tracking-tight">
              Book a Personalized Demo
            </h2>
            <p className="text-xs text-[#8daec7] mt-1 mb-6 leading-relaxed">
              See how RestaurantOS automates your Recipe BOM, stops kitchen food waste, and consolidates multi-outlet financials.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Restaurant / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="e.g. The Tandoor Reserve"
                    className="w-full px-3 py-2.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Your Name & Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="e.g. Rajesh Mehra (Owner)"
                    className="w-full px-3 py-2.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Contact Phone (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@restaurant.com"
                    className="w-full px-3 py-2.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Number of Outlets
                  </label>
                  <select
                    value={outletsCount}
                    onChange={(e) => setOutletsCount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#051321] border border-[#173e63] rounded-lg text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="1">1 Standalone Outlet</option>
                    <option value="2-3">2 to 3 Outlets</option>
                    <option value="4-10">4 to 10 Outlets</option>
                    <option value="10+">10+ Outlets (Chain)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Gurgaon, Delhi, Bengaluru"
                    className="w-full px-3 py-2.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#051423] rounded-lg border border-[#123657] text-[11px] text-[#799ab2]">
                🔒 <b>Direct Architect Guarantee:</b> You will receive a direct demo from founding engineers with your actual menu items mapped into our Recipe BOM engine.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? 'Scheduling Walkthrough...' : 'Confirm Demo & Test All Outlets 🚀'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
