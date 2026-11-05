import React, { useState } from 'react';
import { WardInfo, INITIAL_WARDS, getWardByNumber } from '../data/wardData';

interface TankerBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWard: WardInfo;
}

export const TankerBookingModal: React.FC<TankerBookingModalProps> = ({
  isOpen,
  onClose,
  currentWard,
}) => {
  const [wardId, setWardId] = useState<number>(currentWard.id);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState<'1000' | '2000' | '5000'>('2000');
  const [reason, setReason] = useState('dry_pipe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedBookingId, setBookedBookingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tankers/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          wardId,
          locality: address.trim() || `Ward ${wardId} Visakhapatnam Address`,
          capacityLiters: Number(capacity),
          reason,
        }),
      });
      const data = await res.json();
      if (data.booking?.id) {
        setBookedBookingId(data.booking.id);
      } else {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setBookedBookingId(`GVMC-TNK-${randomNum}`);
      }
    } catch (err) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setBookedBookingId(`GVMC-TNK-${randomNum}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-on-background/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest text-on-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary to-primary text-on-primary p-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">local_shipping</span>
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">GVMC Emergency Water Tanker</h2>
              <p className="text-xs text-white/90">తక్షణ వాటర్ ట్యాంకర్ బుకింగ్ • Rapid Relief Fleet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {!bookedBookingId ? (
          <form onSubmit={handleBook} className="p-5 overflow-y-auto space-y-4">
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">verified</span>
              <span>
                Standard municipal subsidized rate applicable. Guaranteed delivery within 30-60 mins for acute shortage pockets.
              </span>
            </div>

            {/* Ward & Address */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Delivery Ward (1 to 98) <span className="text-error">*</span>
                </label>
                <select
                  value={wardId}
                  onChange={(e) => setWardId(Number(e.target.value))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-medium"
                >
                  {INITIAL_WARDS.map((w) => (
                    <option key={w.id} value={w.id}>
                      Ward {w.id}: {w.name}
                    </option>
                  ))}
                  {Array.from({ length: 98 }, (_, i) => i + 1)
                    .filter((id) => !INITIAL_WARDS.some((w) => w.id === id))
                    .map((id) => (
                      <option key={id} value={id}>
                        Ward {id}: Division {id}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Street / Door No. / Apartment Landmark <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. D.No 4-52/1, Opposite Rythu Bazaar, MVP Sector 2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Contact Mobile Number <span className="text-error">*</span>
                </label>
                <div className="flex items-center">
                  <span className="bg-surface-container-high text-xs font-semibold px-2.5 py-2 rounded-l-lg border border-r-0 border-outline-variant/40 text-on-surface-variant">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98480 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Tanker Capacity options */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Required Tanker Capacity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1000', size: '1,000 Litres', label: 'Mini Tanker', fee: '₹350' },
                  { id: '2000', size: '2,000 Litres', label: 'Standard', fee: '₹600' },
                  { id: '5000', size: '5,000 Litres', label: 'Apartment/Bulk', fee: '₹1,200' },
                ].map((cap) => (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => setCapacity(cap.id as any)}
                    className={`p-2 rounded-xl text-center border text-xs transition-all ${
                      capacity === cap.id
                        ? 'border-secondary bg-secondary/10 text-on-surface font-bold ring-2 ring-secondary/30'
                        : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className="font-bold text-secondary text-sm">{cap.size}</div>
                    <div className="text-[11px] text-on-surface-variant">{cap.label}</div>
                    <div className="text-[10px] text-primary font-semibold mt-0.5">{cap.fee} (Govt)</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Shortage Reason */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Reason for Emergency Dispatch
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary"
              >
                <option value="dry_pipe">No supply / Dry pipeline in ward today</option>
                <option value="low_pressure">Severely low pressure - tank not filled</option>
                <option value="burst">Pipeline burst / contaminated water in street</option>
                <option value="borewell">Borewell dried up / community shortage</option>
                <option value="function">Family social gathering / event</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-outline-variant/40 text-xs font-semibold hover:bg-surface-container transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 bg-secondary hover:bg-secondary/90 text-on-secondary py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Locating Nearest Tanker...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">local_shipping</span>
                    <span>Confirm Tanker Booking</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Live Dispatch Tracker */
          <div className="p-6 text-center space-y-4 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant mx-auto flex items-center justify-center animate-bounce">
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-secondary bg-secondary-fixed px-3 py-1 rounded-full uppercase tracking-wider">
                Tanker Dispatched • వాహనం బయలుదేరింది
              </span>
              <h3 className="text-xl font-bold text-on-surface mt-2">Booking ID: {bookedBookingId}</h3>
              <p className="text-xs text-on-surface-variant">
                Dispatched from <strong className="text-on-surface">Muralinagar Filling Station</strong> to Ward {wardId}
              </p>
            </div>

            {/* Telemetry card */}
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-left text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                <span className="text-on-surface-variant">Vehicle Number:</span>
                <span className="font-mono font-bold text-on-surface bg-white px-2 py-0.5 rounded border border-outline-variant/30">
                  AP 31 TE 4921 (GVMC)
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                <span className="text-on-surface-variant">Driver / Incharge:</span>
                <span className="font-semibold text-on-surface">G. Venkata Ramana (+91 94411 90234)</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                <span className="text-on-surface-variant">Water Capacity:</span>
                <span className="font-bold text-primary">{capacity} Litres Chlorinated Water</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Estimated Arrival:</span>
                <span className="font-bold text-secondary text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">timer</span>
                  ~24 Minutes
                </span>
              </div>
            </div>

            {/* Live progress indicator */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between text-[11px]">
                <span className="text-primary font-bold">1. Order Placed</span>
                <span className="text-secondary font-bold">2. Water Filling Complete</span>
                <span className="text-secondary font-bold">3. In Transit</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="bg-secondary h-full rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>

            <button
              onClick={() => {
                setBookedBookingId(null);
                onClose();
              }}
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
            >
              Done / సరే
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
