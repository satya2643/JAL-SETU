import React, { useState } from 'react';
import { WardInfo, INITIAL_WARDS, getWardByNumber } from '../data/wardData';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWard?: number;
  onSuccessRegistered: (data: { name: string; phone: string; ward: WardInfo; language: string }) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  initialWard = 32,
  onSuccessRegistered,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedWardId, setSelectedWardId] = useState<number>(initialWard);
  const [locality, setLocality] = useState('');
  const [leadTime, setLeadTime] = useState<'60' | '45' | '30'>('45');
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelWhatsapp, setChannelWhatsapp] = useState(true);
  const [channelSms, setChannelSms] = useState(false);
  const [language, setLanguage] = useState<'bilingual' | 'telugu' | 'english'>('bilingual');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  if (!isOpen) return null;

  const currentWard = getWardByNumber(selectedWardId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number so the alert can reach your phone.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          name: name || 'Visakhapatnam Citizen',
          email,
          wardId: selectedWardId,
          locality,
          leadTime,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch alert.');
      }

      setDispatchResult(data.delivery);
      setStep('success');
      onSuccessRegistered({
        name: name || 'Visakhapatnam Citizen',
        phone: cleanPhone,
        ward: currentWard,
        language,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error subscribing for alerts. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleSmsTelugu = `GVMC JAL SETU: వార్డు ${currentWard.id} (${currentWard.name.split('(')[1]?.replace(')', '') || 'విశాఖ'}) లో నేటి నీటి సరఫరా సమయం: ${currentWard.timing}. మీ ఓవర్‌హెడ్ ట్యాంక్ మోటార్లు సిద్ధం చేసుకోండి.`;
  const sampleSmsEnglish = `GVMC JAL SETU: Ward ${currentWard.id} supply starts at ${currentWard.timing.split('–')[0]?.trim() || '06:00 AM'}. Line pressure: ${currentWard.linePressure}. Please keep overhead tank motors ready.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-on-background/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest text-on-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary p-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                notifications_active
              </span>
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Register for Ward Alerts</h2>
              <p className="text-xs text-primary-fixed opacity-90">నమోదు చేసుకోండి • GVMC SMS & WhatsApp Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
            {errorMessage && (
              <div className="bg-error-container text-on-error-container p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMessage}</span>
              </div>
            )}
            <p className="text-xs text-on-surface-variant">
              Get automated notifications directly to your phone exactly {leadTime} minutes prior to your ward's scheduled municipal water valve release.
            </p>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Resident Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Varma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Citizen Email Address <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. resident@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="flex items-center">
                  <span className="bg-surface-container-high text-xs font-semibold px-2.5 py-2 rounded-l-lg border border-r-0 border-outline-variant/40 text-on-surface-variant">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="98480 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:bg-white transition"
                  />
                </div>
              </div>

            {/* Ward Selector */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Select Municipal Ward (GVMC Ward 1 to 98) <span className="text-error">*</span>
              </label>
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(Number(e.target.value))}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-medium"
              >
                {INITIAL_WARDS.map((w) => (
                  <option key={w.id} value={w.id}>
                    Ward {w.id}: {w.name} ({w.zone})
                  </option>
                ))}
                {/* Fallback option for all other 98 wards */}
                {Array.from({ length: 98 }, (_, i) => i + 1)
                  .filter((id) => !INITIAL_WARDS.some((w) => w.id === id))
                  .map((id) => (
                    <option key={id} value={id}>
                      Ward {id}: Division {id} (Zone {id <= 12 ? 'I' : id <= 24 ? 'II' : id <= 36 ? 'III' : id <= 48 ? 'IV' : id <= 65 ? 'V' : id <= 78 ? 'VI' : id <= 88 ? 'VII' : 'VIII'})
                    </option>
                  ))}
              </select>
            </div>

            {/* Locality landmark */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Street / Apartment / Colony Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. Sector 4, Near Rythu Bazaar"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:bg-white transition"
              />
            </div>

            {/* Alert Timing Preference */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Notification Advance Lead Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: '60', label: '60 Mins Before', desc: '1 Hour Notice' },
                  { value: '45', label: '45 Mins Before', desc: 'Standard Notice' },
                  { value: '30', label: '30 Mins Before', desc: '30m Min Protocol' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLeadTime(opt.value as any)}
                    className={`py-2 px-2 rounded-lg text-center border text-xs transition-all ${
                      leadTime === opt.value
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-[10px] text-on-surface-variant opacity-80">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Channels & Language */}
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 space-y-2.5">
              <span className="text-xs font-bold text-on-surface block">Channel & Language Preferences</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelEmail}
                    onChange={(e) => setChannelEmail(e.target.checked)}
                    className="accent-primary w-4 h-4 rounded"
                  />
                  <span>Email Alerts (Direct Inbox)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelWhatsapp}
                    onChange={(e) => setChannelWhatsapp(e.target.checked)}
                    className="accent-secondary w-4 h-4 rounded"
                  />
                  <span>WhatsApp Notifications</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelSms}
                    onChange={(e) => setChannelSms(e.target.checked)}
                    className="accent-primary w-4 h-4 rounded"
                  />
                  <span>SMS Gateway</span>
                </label>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Preferred Script:</span>
                <div className="flex gap-1.5">
                  {(['bilingual', 'telugu', 'english'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLanguage(l)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                        language === l
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                      }`}
                    >
                      {l === 'bilingual' ? 'Telugu + English' : l === 'telugu' ? 'తెలుగు' : 'English'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live SMS Preview box */}
            <div className="bg-on-background/5 border border-outline-variant/30 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-primary font-bold text-[11px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">smartphone</span>
                <span>Live SMS Preview on your Phone</span>
              </div>
              <p className="text-on-surface font-mono bg-white p-2 rounded border border-outline-variant/20 text-[11px] leading-relaxed">
                {language === 'telugu'
                  ? sampleSmsTelugu
                  : language === 'english'
                  ? sampleSmsEnglish
                  : `${sampleSmsEnglish}\n\n${sampleSmsTelugu}`}
              </p>
            </div>

            {/* Action buttons */}
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
                className="w-2/3 bg-primary hover:bg-primary-container text-on-primary py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Registering with GVMC...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Confirm Registration / నమోదు చేయండి</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl font-bold">check</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-on-surface">Alert Dispatched to Mobile!</h3>
              <p className="text-xs text-secondary font-semibold mt-0.5">రిజిస్ట్రేషన్ విజయవంతమైంది • SMS పంపబడింది</p>
              <p className="text-xs text-on-surface-variant mt-2 max-w-xs mx-auto">
                Water release notifications for <strong className="text-on-surface">{currentWard.name}</strong> are dispatched to <span className="font-mono text-primary font-bold">+91 {phone}</span>.
              </p>
            </div>

            {/* Carrier Status Badge */}
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 text-left text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Carrier Route:</span>
                <span className="bg-[#86f2e4]/30 text-[#005049] text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006a61] animate-ping"></span>
                  {dispatchResult?.carrier || 'GVMC Telecom Gateway'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Scheduled Supply:</span>
                <span className="font-bold text-primary">{currentWard.timing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Advance Alert:</span>
                <span className="font-medium text-on-surface">{leadTime} Minutes Before Release</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Dispatch ID:</span>
                <span className="font-mono text-[11px] text-on-surface-variant">{dispatchResult?.dispatchId || 'DISP-LIVE-9921'}</span>
              </div>
            </div>

            {/* Tap to Open Directly on Phone */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block text-left">
                Direct Mobile App Launch:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dispatchResult?.smsUrl && (
                  <a
                    href={dispatchResult.smsUrl}
                    className="bg-primary hover:bg-primary-container text-on-primary py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">sms</span>
                    <span>Open in SMS App</span>
                  </a>
                )}
                {dispatchResult?.whatsappUrl && (
                  <a
                    href={dispatchResult.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#25D366] hover:bg-[#1EBE5D] text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    <span>Open in WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-surface-container-high hover:bg-surface-variant text-on-surface py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Done / కొనసాగించండి
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
