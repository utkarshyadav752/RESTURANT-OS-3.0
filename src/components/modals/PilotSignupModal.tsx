import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, CheckCircle, Sparkles } from 'lucide-react';

interface PilotSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const PilotSignupModal: React.FC<PilotSignupModalProps> = ({ isOpen, onClose, showToast }) => {
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(14);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lucknow');
  const [allowance, setAllowance] = useState('1500');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName || !email || !phone) {
      showToast('Please fill in your name, email, and phone number.');
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
      showToast(`Welcome to Pocket Fund Pilot, ${parentName}! We will reach out on WhatsApp shortly.`);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#071d31] border border-[#16426a] rounded-2xl p-6 sm:p-8 shadow-2xl text-[#c2d5e3] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#799ab2] hover:text-[#dbeaf5] p-1 rounded-lg transition-colors"
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
              Application Confirmed
            </span>
            <h3 className="text-2xl font-extrabold text-[#dbeaf5] mb-3">
              You're on the Pocket Fund Pilot List!
            </h3>
            <p className="text-sm text-[#8daec7] leading-relaxed mb-6">
              Thank you for trusting us with your family's financial learning. Our co-founding team (led by <b className="text-teal-300">Utkarsh Yadav</b>) will personally review your application and send your onboarding WhatsApp invitation within 24 hours.
            </p>
            <div className="p-4 bg-[#051423] border border-[#143b5e] rounded-xl text-xs text-left mb-6 space-y-1.5 font-mono">
              <div className="flex justify-between"><span className="text-[#799ab2]">Parent:</span> <span className="text-white font-semibold">{parentName}</span></div>
              <div className="flex justify-between"><span className="text-[#799ab2]">Student:</span> <span className="text-white font-semibold">{childName || 'Teen'} ({childAge} yrs)</span></div>
              <div className="flex justify-between"><span className="text-[#799ab2]">City:</span> <span className="text-white font-semibold">{city}</span></div>
              <div className="flex justify-between"><span className="text-[#799ab2]">Target Allowance:</span> <span className="text-teal-300 font-semibold">₹{Number(allowance).toLocaleString('en-IN')}/mo</span></div>
              <div className="flex justify-between"><span className="text-[#799ab2]">Helpline:</span> <span className="text-sky-300">+91 9554460651</span></div>
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
              <Sparkles className="w-3.5 h-3.5" /> Early Access Program
            </div>
            <h2 className="text-2xl font-extrabold text-[#dbeaf5] tracking-tight">
              Join the Family Pilot
            </h2>
            <p className="text-xs text-[#8daec7] mt-1 mb-6 leading-relaxed">
              Experience zero subscription fees for life on your starter family account. Help us test the parental guardrails and shape modern Indian teen allowances.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Parent / Guardian Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Student / Teen's Name
                  </label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g. Aarav"
                    className="w-full px-3 py-2.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Teen's Age
                  </label>
                  <select
                    value={childAge}
                    onChange={(e) => setChildAge(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#051321] border border-[#173e63] rounded-lg text-white focus:outline-none focus:border-teal-400"
                  >
                    {[11, 12, 13, 14, 15, 16, 17, 18].map((age) => (
                      <option key={age} value={age}>
                        {age} Years Old
                      </option>
                    ))}
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
                    placeholder="e.g. Lucknow, Delhi, Bengaluru"
                    className="w-full px-3 py-2.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Parent Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full px-3 py-2.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    WhatsApp Contact Number *
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
              </div>

              <div>
                <label className="block text-[#799ab2] font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Estimated Monthly Allowance (₹)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1000', '1500', '2000', '3000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAllowance(amt)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        allowance === amt
                          ? 'bg-teal-400/20 border-teal-400 text-teal-300 font-bold'
                          : 'bg-[#051321] border-[#173e63] text-slate-300 hover:border-teal-400/50'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#051423] rounded-lg border border-[#123657] text-[11px] text-[#799ab2]">
                🔒 <b>Privacy Promise:</b> Your contact information is never shared or used for spam. We only use this to provision your family demo account and coordinate feedback with our onboarding team.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? 'Registering Family...' : 'Submit Application & Secure Free Pilot Access 🚀'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
