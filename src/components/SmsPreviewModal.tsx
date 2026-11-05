import React, { useState } from 'react';
import { WardInfo } from '../data/wardData';

interface SmsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ward: WardInfo;
  onOpenRegister: () => void;
}

export const SmsPreviewModal: React.FC<SmsPreviewModalProps> = ({
  isOpen,
  onClose,
  ward,
  onOpenRegister,
}) => {
  const [phone, setPhone] = useState('9848012345');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const supplyStart = ward.scheduledSupplyStartTime || ward.timing.split('–')[0]?.trim() || '06:00 AM';
  const smsTextTelugu = `జీవీఎంసీ జల సేతు: మీ వార్డు ${ward.id} (${ward.name.split('(')[1]?.replace(')', '') || 'విశాఖ'}) కు నేటి నీటి సరఫరా ప్రారంభ సమయం ${supplyStart}. (${ward.alertLeadMinutes || 45} నిమిషాల ముందస్తు హెచ్చరిక). ఒత్తిడి: ${ward.linePressure}. దయచేసి మోటార్లు సిద్ధం చేసుకోండి. - GVMC వాటర్ బోర్డు.`;
  const smsTextEnglish = `GVMC JAL SETU: Ward ${ward.id} (${ward.name.split('(')[1]?.replace(')', '') || 'Vizag'}) water release starts at ${supplyStart} (Supply window: ${ward.timing}). Dispatched ${ward.alertLeadMinutes || 45} mins in advance as per 30-min prior alert protocol. Line pressure: ${ward.linePressure}. Please keep overhead tank motors ready. - GVMC Water Board.`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(`${smsTextEnglish}\n\n${smsTextTelugu}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToMyPhone = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMsg('Please enter a 10-digit mobile number.');
      return;
    }

    setErrorMsg(null);
    setIsSending(true);

    try {
      const res = await fetch('/api/alerts/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: clean,
          message: smsTextEnglish,
          teluguMessage: smsTextTelugu,
          wardId: ward.id,
          title: `Ward ${ward.id} Water Release Schedule`,
          language: 'bilingual',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch alert to mobile.');
      }

      setDispatchResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error dispatching SMS.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-on-background/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest text-on-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-primary text-on-primary p-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">send_to_mobile</span>
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Mobile Water Alert Dispatch</h2>
              <p className="text-xs text-primary-fixed opacity-90">{ward.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Smartphone UI Mockup */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="bg-[#eef2f8] rounded-2xl p-4 border border-outline-variant/30 shadow-inner">
            <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-3">
              <span className="font-mono font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span>
                Sender: GVMC-WATER
              </span>
              <span>Today 05:00 AM</span>
            </div>

            {/* Bubble */}
            <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs border border-outline-variant/20 space-y-2">
              <p className="text-xs text-on-surface leading-relaxed">
                {smsTextEnglish}
              </p>
              <div className="border-t border-outline-variant/20 pt-2">
                <p className="text-xs text-on-surface font-sans leading-relaxed">
                  {smsTextTelugu}
                </p>
              </div>
              <div className="text-[10px] text-right text-outline pt-1 flex items-center justify-end gap-1">
                <span>Direct Cellular Route</span>
                <span className="material-symbols-outlined text-xs text-secondary">done_all</span>
              </div>
            </div>
          </div>

          {/* Direct Mobile Dispatcher Box */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 space-y-2.5">
            <span className="text-xs font-bold text-on-surface block">
              Send This Alert Directly to Your Phone:
            </span>

            {errorMsg && (
              <div className="bg-error-container text-on-error-container p-2.5 rounded-lg text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex items-center flex-1">
                <span className="bg-surface-container-high text-xs font-bold px-2.5 py-2 rounded-l-lg border border-r-0 border-outline-variant/40 text-on-surface-variant">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white border border-outline-variant/40 rounded-r-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary font-bold"
                />
              </div>

              <button
                type="button"
                onClick={handleSendToMyPhone}
                disabled={isSending || phone.length < 10}
                className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary py-2 px-3.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
              >
                {isSending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">send</span>
                    <span>Send SMS</span>
                  </>
                )}
              </button>
            </div>

            {/* Delivery Confirmation */}
            {dispatchResult && (
              <div className="bg-[#86f2e4]/30 border border-[#006a61]/30 p-3 rounded-xl text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#005049] flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-[#006a61]">check_circle</span>
                    Dispatched to +91 {dispatchResult.cleanPhone}
                  </span>
                  <span className="bg-white/80 text-[#005049] text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    {dispatchResult.carrier}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {dispatchResult.smsUrl && (
                    <a
                      href={dispatchResult.smsUrl}
                      className="bg-primary text-on-primary py-2 px-2.5 rounded-lg font-bold text-[11px] text-center flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">sms</span>
                      <span>Open in SMS App</span>
                    </a>
                  )}
                  {dispatchResult.whatsappUrl && (
                    <a
                      href={dispatchResult.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#25D366] text-white py-2 px-2.5 rounded-lg font-bold text-[11px] text-center flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">chat</span>
                      <span>Receive on WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 text-xs">
            <button
              onClick={handleCopy}
              className="flex-1 py-2 px-3 rounded-lg border border-outline-variant/40 hover:bg-surface-container font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
              <span>{copied ? 'Copied Text' : 'Copy SMS Text'}</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">notifications_active</span>
              <span>Auto-Alert Register</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
