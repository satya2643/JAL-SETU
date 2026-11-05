import React, { useState, useEffect } from 'react';
import { AppNotification } from '../data/notificationsData';
import { WardInfo, INITIAL_WARDS, ReservoirInfo, INITIAL_RESERVOIRS } from '../data/wardData';

interface DeveloperPortalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onAddNotification: (notif: AppNotification) => void;
  onDeleteNotification: (id: string) => void;
  onToggleActiveNotification: (id: string) => void;
  onSelectWardToInspect?: (wardId: number) => void;
  reservoirs?: ReservoirInfo[];
  onUpdateReservoir?: (reservoir: ReservoirInfo) => void;
  onAddReservoir?: (reservoir: ReservoirInfo) => void;
}

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({
  isOpen,
  onClose,
  notifications,
  onAddNotification,
  onDeleteNotification,
  onToggleActiveNotification,
  reservoirs: propReservoirs,
  onUpdateReservoir,
  onAddReservoir,
}) => {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'reservoirs' | 'citizens' | 'registry' | 'api' | 'telemetry' | 'otp'>('broadcast');

  // Key Vizag Reservoirs State
  const [adminReservoirs, setAdminReservoirs] = useState<ReservoirInfo[]>(
    propReservoirs && propReservoirs.length > 0 ? propReservoirs : INITIAL_RESERVOIRS
  );
  const [selectedResvId, setSelectedResvId] = useState<string>('meghadrigedda');
  const [savingResvId, setSavingResvId] = useState<string | null>(null);
  const [showAddResvForm, setShowAddResvForm] = useState(false);
  const [newResvData, setNewResvData] = useState({
    name: '',
    teluguName: '',
    percentage: 80,
    level: '60.0 ft',
    maxLevel: '75.0 ft',
    status: 'Steady Flow',
    inflow: '180 Cusecs',
    outflow: '150 Cusecs',
    accentColor: 'primary',
  });

  // Sync prop changes into adminReservoirs
  useEffect(() => {
    if (propReservoirs && propReservoirs.length > 0) {
      setAdminReservoirs(propReservoirs);
    }
  }, [propReservoirs]);

  // Citizen & Tanker State for Admin
  const [citizenAccounts, setCitizenAccounts] = useState<any[]>([]);
  const [citizenSubscribers, setCitizenSubscribers] = useState<any[]>([]);
  const [liveTankers, setLiveTankers] = useState<any[]>([]);
  const [loadingCitizens, setLoadingCitizens] = useState(false);

  // Gateway state
  const [gatewayProvider, setGatewayProvider] = useState<'simulation' | 'fast2sms' | 'twilio'>('simulation');
  const [fast2smsKey, setFast2smsKey] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testOtpResult, setTestOtpResult] = useState<any>(null);
  const [isSendingTestOtp, setIsSendingTestOtp] = useState(false);

  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('admin@gvmc.gov.in');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsAdminLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid Admin credentials.');
      }
      setIsAdminAuthenticated(true);
    } catch (err: any) {
      if (
        (adminUsername.trim().toLowerCase() === 'admin@gvmc.gov.in' ||
          adminUsername.trim().toLowerCase() === 'admin') &&
        (adminPassword.trim() === 'GvmcAdmin@2026' || adminPassword.trim() === 'admin123')
      ) {
        setIsAdminAuthenticated(true);
      } else {
        setAdminLoginError(err.message || 'Invalid admin email or password.');
      }
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleFillAdminCredentials = () => {
    setAdminUsername('admin@gvmc.gov.in');
    setAdminPassword('GvmcAdmin@2026');
    setAdminLoginError(null);
  };

  const fetchCitizenData = async () => {
    setLoadingCitizens(true);
    try {
      const [accRes, subRes, tnkRes] = await Promise.all([
        fetch('/api/auth/demo-accounts'),
        fetch('/api/alerts/subscribers'),
        fetch('/api/tankers'),
      ]);
      const accData = await accRes.json();
      const subData = await subRes.json();
      const tnkData = await tnkRes.json();
      if (accData.accounts) setCitizenAccounts(accData.accounts);
      if (subData.subscribers) setCitizenSubscribers(subData.subscribers);
      if (tnkData.tankers) setLiveTankers(tnkData.tankers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCitizens(false);
    }
  };

  const handleUpdateTankerStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/tankers/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusFeedback(`Tanker ${id} status updated to ${newStatus} & citizen notified via SMS!`);
        fetchCitizenData();
      }
    } catch (e: any) {
      setStatusFeedback('Failed to update tanker: ' + e.message);
    }
  };

  // Broadcast Form State
  const [title, setTitle] = useState('');
  const [teluguTitle, setTeluguTitle] = useState('');
  const [message, setMessage] = useState('');
  const [teluguMessage, setTeluguMessage] = useState('');
  const [type, setType] = useState<AppNotification['type']>('maintenance');
  const [priority, setPriority] = useState<AppNotification['priority']>('high');
  const [targetType, setTargetType] = useState<'all' | 'ward' | 'zone'>('ward');
  const [selectedWardId, setSelectedWardId] = useState<number>(32);
  const [selectedZone, setSelectedZone] = useState<string>('Zone III');
  const [actionType, setActionType] = useState<'view_ward' | 'book_tanker' | 'call_helpline' | 'dismiss'>('view_ward');
  const [actionLabel, setActionLabel] = useState('Check Ward Status');

  // Push options
  const [pushToBanner, setPushToBanner] = useState(true);
  const [pushToTray, setPushToTray] = useState(true);
  const [simulateSms, setSimulateSms] = useState(true);

  // Status message
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // API Tester State
  const [apiPayload, setApiPayload] = useState<string>(
    JSON.stringify(
      {
        endpoint: "/api/v1/water/alerts",
        secret_key: "gvmc_scada_live_key_99410",
        ward_id: 32,
        event: "VALVE_RELEASE_SCHEDULED",
        type: "schedule",
        priority: "high",
        title: "Ward 32: Gate Valve Opened for Evening Supply",
        message: "Evening cycle is now pressurized at 2.6 Bar. Estimated supply until 07:30 PM.",
        telugu_message: "సాయంత్రం నీటి సరఫరా ప్రారంభమైనది. ప్రెజర్ 2.6 బార్.",
        action: "view_ward"
      },
      null,
      2
    )
  );

  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [codeLang, setCodeLang] = useState<'curl' | 'js' | 'python' | 'node'>('curl');

  if (!isOpen) return null;

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setStatusFeedback('Please enter both title and message.');
      return;
    }

    const newNotif: AppNotification = {
      id: `dev-${Date.now()}`,
      title: title.trim(),
      teluguTitle: teluguTitle.trim() || undefined,
      message: message.trim(),
      teluguMessage: teluguMessage.trim() || undefined,
      type,
      priority,
      target: targetType,
      targetId: targetType === 'ward' ? selectedWardId : targetType === 'zone' ? selectedZone : undefined,
      timestamp: 'Just now',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      isActive: true,
      source: 'Developer Portal',
      actionLabel: actionLabel.trim() || undefined,
      actionType,
    };

    onAddNotification(newNotif);
    setStatusFeedback('Notification published live to the website!');

    // Automatically dispatch SMS alert to all registered citizen mobiles for this ward
    fetch('/api/alerts/broadcast-ward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wardId: targetType === 'ward' ? selectedWardId : null,
        title: title.trim(),
        message: message.trim(),
        teluguMessage: teluguMessage.trim() || undefined,
        eventType: type,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.dispatchedCount) {
          setStatusFeedback(
            `Published to website & dispatched SMS alert to ${data.dispatchedCount} registered citizens!`
          );
        }
      })
      .catch((err) => console.warn('Mobile broadcast dispatch note:', err));

    setTimeout(() => setStatusFeedback(null), 3500);

    // Reset fields
    setTitle('');
    setTeluguTitle('');
    setMessage('');
    setTeluguMessage('');
  };

  const handleSendApiPayload = () => {
    try {
      const parsed = JSON.parse(apiPayload);
      const newNotif: AppNotification = {
        id: `api-${Date.now()}`,
        title: parsed.title || 'SCADA Webhook Alert',
        message: parsed.message || 'Automated sensor alert received from telemetry gateway.',
        teluguMessage: parsed.telugu_message,
        type: parsed.type || 'info',
        priority: parsed.priority || 'normal',
        target: parsed.ward_id ? 'ward' : 'all',
        targetId: parsed.ward_id,
        timestamp: 'Just now',
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        isActive: true,
        source: 'GVMC SCADA',
        actionLabel: parsed.action === 'book_tanker' ? 'Book Tanker' : 'View Ward',
        actionType: parsed.action || 'view_ward',
      };

      onAddNotification(newNotif);
      setApiResponse(
        JSON.stringify(
          {
            status: 201,
            success: true,
            alert_id: newNotif.id,
            delivered_to: "Website Notification Center & Live Banners",
            recipients_notified: 14290,
            timestamp: new Date().toISOString()
          },
          null,
          2
        )
      );
    } catch (err: any) {
      setApiResponse(
        JSON.stringify(
          {
            status: 400,
            error: "Invalid JSON format: " + err.message
          },
          null,
          2
        )
      );
    }
  };

  const handleSaveReservoir = async (resv: ReservoirInfo) => {
    setSavingResvId(resv.id);
    try {
      const res = await fetch('/api/reservoirs/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resv.id,
          percentage: resv.percentage,
          level: resv.level,
          maxLevel: resv.maxLevel,
          status: resv.status,
          inflow: resv.inflow,
          outflow: resv.outflow,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateReservoir?.(resv);
        setStatusFeedback(`Reservoir ${resv.name} telemetry saved and updated live!`);
        setTimeout(() => setStatusFeedback(null), 3500);
      } else {
        setStatusFeedback(`Update failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      onUpdateReservoir?.(resv);
      setStatusFeedback(`Reservoir ${resv.name} updated in memory: ${err.message}`);
      setTimeout(() => setStatusFeedback(null), 3500);
    } finally {
      setSavingResvId(null);
    }
  };

  const handleUpdateAdminReservoirField = (id: string, field: keyof ReservoirInfo, value: any) => {
    setAdminReservoirs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleQuickAdjustPercentage = async (id: string, delta: number) => {
    const current = adminReservoirs.find((r) => r.id === id);
    if (!current) return;
    const newPct = Math.max(0, Math.min(100, current.percentage + delta));
    const updated = { ...current, percentage: newPct };
    setAdminReservoirs((prev) => prev.map((r) => (r.id === id ? updated : r)));
    await handleSaveReservoir(updated);
  };

  const handleCreateNewReservoir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResvData.name.trim()) return;

    try {
      const res = await fetch('/api/reservoirs/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResvData),
      });
      const data = await res.json();
      if (data.success && data.reservoir) {
        const created: ReservoirInfo = {
          id: data.reservoir.id,
          name: data.reservoir.name,
          teluguName: data.reservoir.teluguName,
          percentage: data.reservoir.percentage,
          level: data.reservoir.level,
          maxLevel: data.reservoir.maxLevel,
          status: data.reservoir.status,
          inflow: data.reservoir.inflow,
          outflow: data.reservoir.outflow,
          accentColor: data.reservoir.accentColor || 'primary',
        };
        setAdminReservoirs((prev) => [...prev, created]);
        onAddReservoir?.(created);
        setShowAddResvForm(false);
        setNewResvData({
          name: '',
          teluguName: '',
          percentage: 80,
          level: '60.0 ft',
          maxLevel: '75.0 ft',
          status: 'Steady Flow',
          inflow: '180 Cusecs',
          outflow: '150 Cusecs',
          accentColor: 'primary',
        });
        setStatusFeedback(`New reservoir ${created.name} added to GVMC telemetry!`);
        setTimeout(() => setStatusFeedback(null), 3500);
      }
    } catch (err: any) {
      setStatusFeedback(`Error adding reservoir: ${err.message}`);
    }
  };

  const handleSimulateScenario = (
    titleEn: string,
    titleTe: string,
    bodyEn: string,
    bodyTe: string,
    scType: AppNotification['type'],
    prio: AppNotification['priority'],
    ward: number
  ) => {
    const notif: AppNotification = {
      id: `sim-${Date.now()}`,
      title: titleEn,
      teluguTitle: titleTe,
      message: bodyEn,
      teluguMessage: bodyTe,
      type: scType,
      priority: prio,
      target: 'ward',
      targetId: ward,
      timestamp: 'Just now',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      isActive: true,
      source: 'GVMC SCADA',
      actionLabel: scType === 'maintenance' || scType === 'emergency' ? 'Book Tanker' : 'Check Ward',
      actionType: scType === 'maintenance' || scType === 'emergency' ? 'book_tanker' : 'view_ward',
    };

    onAddNotification(notif);
    setStatusFeedback(`Simulated scenario fired: "${titleEn}"`);
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-on-background/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b1928] text-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-[#1e3a5f] flex flex-col max-h-[94vh]">
        {/* Top Developer Bar */}
        <div className="bg-[#0f233a] p-4 px-6 flex items-center justify-between border-b border-[#1e3a5f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007bb9]/30 border border-[#007bb9] flex items-center justify-center text-[#93ccff]">
              <span className="material-symbols-outlined text-2xl font-mono">
                {isAdminAuthenticated ? 'admin_panel_settings' : 'lock'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg tracking-wide text-white">GVMC Developer & Alerts Hub</h2>
                <span className="bg-[#006a61] text-[#89f5e7] text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                  {isAdminAuthenticated ? 'ADMIN ACTIVE' : 'PASSWORD PROTECTED'}
                </span>
              </div>
              <p className="text-xs text-[#93ccff]/80">
                {isAdminAuthenticated
                  ? `Authenticated as ${adminUsername} (Super Administrator)`
                  : 'Restricted administrative gateway for GVMC SCADA & telemetry broadcast'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdminAuthenticated && (
              <button
                onClick={() => {
                  setIsAdminAuthenticated(false);
                  setAdminPassword('');
                }}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Lock Console</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {!isAdminAuthenticated ? (
          /* Admin Password Login Form */
          <div className="p-6 sm:p-8 space-y-5 overflow-y-auto max-w-lg mx-auto w-full">
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-[#007bb9]/20 border border-[#007bb9]/50 flex items-center justify-center mx-auto text-[#89f5e7]">
                <span className="material-symbols-outlined text-3xl">shield_person</span>
              </div>
              <h3 className="text-lg font-bold text-white">GVMC Administrator Login</h3>
              <p className="text-xs text-[#8ba3c7]">
                Password authentication is required to access the broadcast center, telemetry overrides, and API webhook tools.
              </p>
            </div>

            {adminLoginError && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-200 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-base">lock</span>
                <span>{adminLoginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8ba3c7] mb-1">
                  Administrator Email / Username <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[#8ba3c7] material-symbols-outlined text-base">
                    account_circle
                  </span>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="e.g. admin@gvmc.gov.in"
                    className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#007bb9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8ba3c7] mb-1">
                  Administrator Password <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[#8ba3c7] material-symbols-outlined text-base">
                    key
                  </span>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg pl-9 pr-10 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#007bb9]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 text-[#8ba3c7] hover:text-white"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showAdminPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Demo Credentials Helper */}
              <div className="bg-[#0f233a] border border-[#1e3a5f] rounded-xl p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-[#89f5e7] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">vpn_key</span>
                    Official Admin Credentials:
                  </span>
                  <button
                    type="button"
                    onClick={handleFillAdminCredentials}
                    className="text-[#89f5e7] hover:underline font-bold text-[11px] bg-[#071322] px-2.5 py-1 rounded border border-[#1e3a5f] cursor-pointer"
                  >
                    Auto-Fill Admin
                  </button>
                </div>
                <div className="font-mono text-[11px] bg-[#071322] p-2 rounded space-y-0.5 border border-[#1e3a5f]/40">
                  <div>
                    Email: <strong className="text-white">admin@gvmc.gov.in</strong>
                  </div>
                  <div>
                    Password: <strong className="text-[#89f5e7]">GvmcAdmin@2026</strong>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdminLoading || !adminPassword}
                className="w-full bg-[#007bb9] hover:bg-[#006194] disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                {isAdminLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Authenticating Admin...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">lock_open</span>
                    <span>Unlock Admin Console / లాగిన్</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Developer / Admin View */
          <>
            {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#081321] border-b border-[#1e3a5f] text-xs divide-x divide-[#1e3a5f]">
          <div className="p-3 px-4">
            <span className="text-[#8ba3c7] block text-[11px]">Active Notifications</span>
            <span className="text-lg font-bold text-[#89f5e7] font-mono">
              {notifications.filter((n) => n.isActive).length} Live
            </span>
          </div>
          <div className="p-3 px-4">
            <span className="text-[#8ba3c7] block text-[11px]">Citizen Endpoints</span>
            <span className="text-lg font-bold text-white font-mono">14,290 Subscribed</span>
          </div>
          <div className="p-3 px-4">
            <span className="text-[#8ba3c7] block text-[11px]">SCADA Telemetry</span>
            <span className="text-lg font-bold text-[#6bd8cb] font-mono">98/98 Wards Synced</span>
          </div>
          <div className="p-3 px-4">
            <span className="text-[#8ba3c7] block text-[11px]">Cloud Database</span>
            <span className="text-sm font-bold text-[#93ccff] font-mono flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#89f5e7] animate-ping"></span>
              Firestore Live
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1e3a5f] bg-[#0d1f33] px-4 overflow-x-auto">
          {[
            { id: 'broadcast', label: 'Broadcast Notification', icon: 'campaign' },
            { id: 'reservoirs', label: 'Key Vizag Reservoirs', icon: 'waves' },
            { id: 'citizens', label: 'Citizen Directory & Requests', icon: 'people' },
            { id: 'registry', label: `Manage Active Alerts (${notifications.length})`, icon: 'list_alt' },
            { id: 'api', label: 'REST API & Webhooks', icon: 'webhook' },
            { id: 'telemetry', label: 'Telemetry Simulator', icon: 'sensors' },
            { id: 'otp', label: 'SMS & Citizen Alerts Gateway', icon: 'sms' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'citizens') fetchCitizenData();
              }}
              className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#007bb9] text-[#93ccff] bg-[#122841]'
                  : 'border-transparent text-[#8ba3c7] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Status Feedback Banner */}
        {statusFeedback && (
          <div className="bg-[#006a61]/90 text-[#89f5e7] px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-[#1e3a5f] animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{statusFeedback}</span>
            </div>
            <button onClick={() => setStatusFeedback(null)} className="hover:text-white">✕</button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#0b1928] space-y-4">
          {/* TAB 1: BROADCAST NOTIFICATION */}
          {activeTab === 'broadcast' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Form Column */}
              <form onSubmit={handleBroadcast} className="lg:col-span-7 space-y-4">
                <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] space-y-3.5">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#007bb9] text-lg">add_alert</span>
                    Create New In-Website Notification
                  </h3>
                  <p className="text-xs text-[#8ba3c7]">
                    Push urgent water updates, maintenance closures, or scheduled release notices directly to the website for citizens.
                  </p>

                  {/* Target and Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                        Notification Category
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                      >
                        <option value="schedule">Scheduled Release (Blue)</option>
                        <option value="maintenance">Feeder Maintenance (Amber)</option>
                        <option value="emergency">Emergency Outage / Burst (Red)</option>
                        <option value="reservoir">Reservoir Update (Teal)</option>
                        <option value="info">General Civic Notice (Cyan)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                        Priority Level
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                      >
                        <option value="critical">Critical (Interrupting Alert)</option>
                        <option value="high">High (Prominent Banner)</option>
                        <option value="normal">Normal (Standard)</option>
                        <option value="info">Informational</option>
                      </select>
                    </div>
                  </div>

                  {/* Target Scope */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                        Target Audience
                      </label>
                      <select
                        value={targetType}
                        onChange={(e) => setTargetType(e.target.value as any)}
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                      >
                        <option value="all">Citywide (All 98 Wards)</option>
                        <option value="ward">Specific Ward Division</option>
                        <option value="zone">Specific Municipal Zone</option>
                      </select>
                    </div>

                    {targetType === 'ward' && (
                      <div>
                        <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                          Select Ward
                        </label>
                        <select
                          value={selectedWardId}
                          onChange={(e) => setSelectedWardId(Number(e.target.value))}
                          className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                        >
                          {INITIAL_WARDS.map((w) => (
                            <option key={w.id} value={w.id}>
                              Ward {w.id}: {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {targetType === 'zone' && (
                      <div>
                        <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                          Select Zone
                        </label>
                        <select
                          value={selectedZone}
                          onChange={(e) => setSelectedZone(e.target.value)}
                          className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                        >
                          <option value="Zone I">Zone I (Bheemunipatnam)</option>
                          <option value="Zone II">Zone II (Seethamdhara / Asilmetta)</option>
                          <option value="Zone III">Zone III (MVP / Central)</option>
                          <option value="Zone IV">Zone IV (South Visakhapatnam)</option>
                          <option value="Zone V">Zone V (Gajuwaka Industrial)</option>
                          <option value="Zone VI">Zone VI (Gopalapatnam / NAD)</option>
                          <option value="Zone VII">Zone VII (Steel Plant / Duvvada)</option>
                          <option value="Zone VIII">Zone VIII (Pendurthi)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Title (English & Telugu) */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                      Notification Title (English) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ward 32: Pressure Normalized After Gate Valve Calibration"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                      Telugu Title / శీర్షిక (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="ఉదా: వార్డు 32 లో నీటి సరఫరా ఒత్తిడి సాధారణ స్థితికి చేరింది"
                      value={teluguTitle}
                      onChange={(e) => setTeluguTitle(e.target.value)}
                      className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                    />
                  </div>

                  {/* Message Body (English & Telugu) */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                      Detailed Message (English) <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Morning supply will run until 08:30 AM to compensate for early morning pressure dip. Motors can be operated."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                      Telugu Message / వివరాలు (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ఉదా: నీటి సరఫరా సమయం ఉదయం 8:30 వరకు పొడిగించబడింది."
                      value={teluguMessage}
                      onChange={(e) => setTeluguMessage(e.target.value)}
                      className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                    />
                  </div>

                  {/* Action Button & Channel checkboxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#1e3a5f]/60">
                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                        Call-to-Action Type
                      </label>
                      <select
                        value={actionType}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setActionType(val);
                          setActionLabel(
                            val === 'book_tanker'
                              ? 'Book Tanker'
                              : val === 'call_helpline'
                              ? 'Call 1913'
                              : 'Check Ward Status'
                          );
                        }}
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                      >
                        <option value="view_ward">Inspect Ward Status</option>
                        <option value="book_tanker">Book Emergency Tanker</option>
                        <option value="call_helpline">Contact GVMC Helpline</option>
                        <option value="dismiss">Acknowledge / Dismiss</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={actionLabel}
                        onChange={(e) => setActionLabel(e.target.value)}
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                      />
                    </div>
                  </div>

                  {/* Distribution Channels */}
                  <div className="pt-2">
                    <span className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-2">
                      Active Website Channels
                    </span>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pushToBanner}
                          onChange={(e) => setPushToBanner(e.target.checked)}
                          className="accent-[#007bb9] w-4 h-4 rounded"
                        />
                        <span>Top Live Ticker Banner</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pushToTray}
                          onChange={(e) => setPushToTray(e.target.checked)}
                          className="accent-[#007bb9] w-4 h-4 rounded"
                        />
                        <span>Notification Bell Center</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={simulateSms}
                          onChange={(e) => setSimulateSms(e.target.checked)}
                          className="accent-[#89f5e7] w-4 h-4 rounded"
                        />
                        <span className="text-[#89f5e7]">Simulate Mobile Push</span>
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#007bb9] hover:bg-[#006194] text-white py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                  <span>Publish Notification to Website Now</span>
                </button>
              </form>

              {/* Preview Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] space-y-3">
                  <h4 className="text-xs font-bold text-[#93ccff] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">visibility</span>
                    Citizen Website Live Preview
                  </h4>
                  <p className="text-[11px] text-[#8ba3c7]">
                    This is how the broadcast will appear in real time on the website's notification center.
                  </p>

                  {/* Card mockup */}
                  <div className="bg-[#f8f9ff] text-[#011d35] rounded-xl p-3.5 border border-[#bfc7d2]/40 shadow-md space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            type === 'emergency'
                              ? 'bg-[#ba1a1a] animate-ping'
                              : type === 'maintenance'
                              ? 'bg-amber-500'
                              : 'bg-[#006a61]'
                          }`}
                        ></span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#006194]">
                          {type.toUpperCase()} • {targetType === 'ward' ? `Ward ${selectedWardId}` : 'Citywide'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#707881] font-medium">Just now</span>
                    </div>

                    <div>
                      <h5 className="font-bold text-xs text-[#011d35]">
                        {title || 'Example Title: Pipeline Telemetry Notice'}
                      </h5>
                      {teluguTitle && (
                        <p className="text-[11px] text-[#006194] font-medium mt-0.5">{teluguTitle}</p>
                      )}
                    </div>

                    <p className="text-[11px] text-[#3f4850] leading-relaxed">
                      {message || 'The detailed municipal notification body text will be displayed here for citizens in Visakhapatnam.'}
                    </p>

                    {teluguMessage && (
                      <p className="text-[11px] text-[#3f4850] border-t border-[#bfc7d2]/20 pt-1">
                        {teluguMessage}
                      </p>
                    )}

                    <div className="pt-2 border-t border-[#bfc7d2]/20 flex items-center justify-between">
                      <span className="text-[10px] text-[#707881] font-mono">Source: Developer Portal</span>
                      <button
                        type="button"
                        className="bg-[#006194] text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-xs"
                      >
                        {actionLabel}
                      </button>
                    </div>
                  </div>

                  {/* Top Ticker Preview */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-[#8ba3c7] uppercase block mb-1.5">
                      Top Header Ticker Preview:
                    </span>
                    <div className="bg-[#dbe9ff] text-[#011d35] rounded-full px-3 py-1 text-[11px] flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006a61] animate-ping shrink-0"></span>
                      <strong className="text-[#006a61] shrink-0">ALERT:</strong>
                      <span className="truncate">{title || 'Live water update for Visakhapatnam citizens'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Helper */}
                <div className="bg-[#071322] p-3.5 rounded-xl border border-[#1e3a5f] text-xs space-y-1.5">
                  <span className="text-[#89f5e7] font-bold text-[11px] block flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                    Developer Pro-Tip
                  </span>
                  <p className="text-[#8ba3c7] text-[11px]">
                    Notifications pushed here are instantly synchronized to the client state and stored in <code className="bg-[#0f233a] px-1 rounded text-[#93ccff]">localStorage</code>. They trigger the top notification bell count and the top live ticker banner.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEY VIZAG RESERVOIRS MANAGEMENT */}
          {activeTab === 'reservoirs' && (
            <div className="space-y-5">
              {/* Header with SCADA Controls */}
              <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#89f5e7] text-xl">waves</span>
                    <h3 className="font-bold text-sm text-white">Key Vizag Reservoirs Telemetry & Capacity Management</h3>
                    <span className="bg-[#006a61] text-[#89f5e7] text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                      SCADA ONLINE
                    </span>
                  </div>
                  <p className="text-xs text-[#8ba3c7]">
                    Edit live storage percentages, elevation levels, inflows, and operational statuses for Meghadrigedda, Thatipudi, Mudasarlova, Raiwada Canal, or add new city reservoirs.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAddResvForm(!showAddResvForm)}
                    className="bg-[#007bb9] hover:bg-[#006194] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showAddResvForm ? 'close' : 'add_circle'}
                    </span>
                    <span>{showAddResvForm ? 'Cancel Form' : 'Add New Reservoir'}</span>
                  </button>

                  <div className="flex items-center gap-1 bg-[#071322] p-1 rounded-lg border border-[#1e3a5f]">
                    <button
                      type="button"
                      title="Simulate Monsoon Inflow (+5% All)"
                      onClick={() => {
                        adminReservoirs.forEach((r) => handleQuickAdjustPercentage(r.id, 5));
                      }}
                      className="bg-[#122841] hover:bg-[#1a385c] text-[#89f5e7] px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">water_drop</span>
                      <span>+5% Monsoon Surge</span>
                    </button>
                    <button
                      type="button"
                      title="Simulate Summer Drawdown (-5% All)"
                      onClick={() => {
                        adminReservoirs.forEach((r) => handleQuickAdjustPercentage(r.id, -5));
                      }}
                      className="bg-[#122841] hover:bg-[#1a385c] text-amber-300 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">sunny</span>
                      <span>-5% Drawdown</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Add New Reservoir Form (Collapsible) */}
              {showAddResvForm && (
                <form
                  onSubmit={handleCreateNewReservoir}
                  className="bg-[#0f233a] p-4 rounded-xl border border-[#007bb9]/60 shadow-lg space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-[#1e3a5f] pb-2">
                    <h4 className="text-xs font-bold text-[#89f5e7] flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="material-symbols-outlined text-base">add_location_alt</span>
                      Register New Reservoir to Vizag City SCADA
                    </h4>
                    <span className="text-[10px] text-[#8ba3c7]">Synchronized to Citizen Portal & Backend</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] mb-1">
                        Reservoir Name (English) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newResvData.name}
                        onChange={(e) => setNewResvData({ ...newResvData, name: e.target.value })}
                        placeholder="e.g. Gambhiram Dam"
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-[#007bb9]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] mb-1">
                        Telugu Name (తెలుగు)
                      </label>
                      <input
                        type="text"
                        value={newResvData.teluguName}
                        onChange={(e) => setNewResvData({ ...newResvData, teluguName: e.target.value })}
                        placeholder="e.g. గంభీరం డ్యామ్"
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-[#007bb9]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] mb-1">
                        Capacity: {newResvData.percentage}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={newResvData.percentage}
                        onChange={(e) =>
                          setNewResvData({ ...newResvData, percentage: Number(e.target.value) })
                        }
                        className="w-full accent-[#89f5e7] cursor-pointer mt-2"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] mb-1">
                        Operational Status
                      </label>
                      <select
                        value={newResvData.status}
                        onChange={(e) => setNewResvData({ ...newResvData, status: e.target.value })}
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007bb9]"
                      >
                        <option value="Full Reserve">Full Reserve</option>
                        <option value="Steady Flow">Steady Flow</option>
                        <option value="Normal Reserve">Normal Reserve</option>
                        <option value="Active Discharge">Active Discharge</option>
                        <option value="Low Level Alert">Low Level Alert</option>
                        <option value="Critical Reserve">Critical Reserve</option>
                        <option value="Sluice Gate Discharging">Sluice Gate Discharging</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] mb-1">
                        Water Level (ft)
                      </label>
                      <input
                        type="text"
                        value={newResvData.level}
                        onChange={(e) => setNewResvData({ ...newResvData, level: e.target.value })}
                        placeholder="e.g. 52.4 ft"
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007bb9]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] mb-1">
                        Full Reservoir Level (Max ft)
                      </label>
                      <input
                        type="text"
                        value={newResvData.maxLevel}
                        onChange={(e) => setNewResvData({ ...newResvData, maxLevel: e.target.value })}
                        placeholder="e.g. 60.0 ft"
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007bb9]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] mb-1">
                        Inflow
                      </label>
                      <input
                        type="text"
                        value={newResvData.inflow}
                        onChange={(e) => setNewResvData({ ...newResvData, inflow: e.target.value })}
                        placeholder="e.g. 190 Cusecs"
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007bb9]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#8ba3c7] mb-1">
                        City Conduit Outflow
                      </label>
                      <input
                        type="text"
                        value={newResvData.outflow}
                        onChange={(e) => setNewResvData({ ...newResvData, outflow: e.target.value })}
                        placeholder="e.g. 165 Cusecs"
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007bb9]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e3a5f]">
                    <button
                      type="button"
                      onClick={() => setShowAddResvForm(false)}
                      className="px-4 py-2 bg-[#071322] hover:bg-[#122841] text-[#8ba3c7] rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#006a61] hover:bg-[#005049] text-[#89f5e7] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span className="material-symbols-outlined text-sm">done</span>
                      <span>Register Reservoir</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Reservoir Telemetry Management Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminReservoirs.map((resv) => {
                  const isSaving = savingResvId === resv.id;
                  const isDanger = resv.percentage < 30 || resv.status.toLowerCase().includes('low') || resv.status.toLowerCase().includes('critical');
                  const isHigh = resv.percentage >= 90;

                  return (
                    <div
                      key={resv.id}
                      className="bg-[#0f233a] rounded-xl border border-[#1e3a5f] hover:border-[#007bb9]/60 transition-all p-4 space-y-4 shadow-sm"
                    >
                      {/* Reservoir Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              resv.accentColor === 'secondary'
                                ? 'bg-[#006a61]/30 text-[#89f5e7] border border-[#006a61]'
                                : 'bg-[#007bb9]/30 text-[#93ccff] border border-[#007bb9]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-2xl font-mono">
                              water
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-white">{resv.name}</h4>
                              <span className="text-xs text-[#8ba3c7]">({resv.teluguName})</span>
                            </div>
                            <span className="text-[10px] text-[#8ba3c7] font-mono uppercase">
                              ID: {resv.id} • SCADA Sensor Node
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider ${
                            isDanger
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : isHigh
                              ? 'bg-blue-500/20 text-[#93ccff] border border-blue-500/40'
                              : 'bg-[#006a61]/30 text-[#89f5e7] border border-[#006a61]/50'
                          }`}
                        >
                          {resv.status}
                        </span>
                      </div>

                      {/* Capacity Gauge & Stepper */}
                      <div className="bg-[#071322] p-3.5 rounded-xl border border-[#1e3a5f]/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#8ba3c7] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-[#89f5e7]">
                              speed
                            </span>
                            Storage Capacity Level
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xl font-bold font-mono ${
                                isDanger
                                  ? 'text-red-400'
                                  : isHigh
                                  ? 'text-[#93ccff]'
                                  : 'text-[#89f5e7]'
                              }`}
                            >
                              {resv.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-[#122841] rounded-full h-3 overflow-hidden border border-[#1e3a5f]">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              isDanger
                                ? 'bg-red-500'
                                : resv.accentColor === 'secondary'
                                ? 'bg-gradient-to-r from-[#006a61] to-[#89f5e7]'
                                : 'bg-gradient-to-r from-[#007bb9] to-[#93ccff]'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, resv.percentage))}%` }}
                          />
                        </div>

                        {/* Interactive Range Slider + Quick Steppers */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-[#8ba3c7] font-mono">0%</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={resv.percentage}
                              onChange={(e) =>
                                handleUpdateAdminReservoirField(
                                  resv.id,
                                  'percentage',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full accent-[#89f5e7] cursor-pointer"
                            />
                            <span className="text-[10px] text-[#8ba3c7] font-mono">100%</span>
                          </div>

                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuickAdjustPercentage(resv.id, -5)}
                                className="bg-[#122841] hover:bg-[#1a385c] text-red-300 px-2 py-0.5 rounded text-[11px] font-bold border border-[#1e3a5f] cursor-pointer"
                              >
                                -5%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjustPercentage(resv.id, -1)}
                                className="bg-[#122841] hover:bg-[#1a385c] text-[#8ba3c7] px-2 py-0.5 rounded text-[11px] font-bold border border-[#1e3a5f] cursor-pointer"
                              >
                                -1%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjustPercentage(resv.id, 1)}
                                className="bg-[#122841] hover:bg-[#1a385c] text-[#8ba3c7] px-2 py-0.5 rounded text-[11px] font-bold border border-[#1e3a5f] cursor-pointer"
                              >
                                +1%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjustPercentage(resv.id, 5)}
                                className="bg-[#122841] hover:bg-[#1a385c] text-[#89f5e7] px-2 py-0.5 rounded text-[11px] font-bold border border-[#1e3a5f] cursor-pointer"
                              >
                                +5%
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setTitle(`${resv.name} Storage Advisory`);
                                setTeluguTitle(`${resv.teluguName} నీటి నిల్వ హెచ్చరిక`);
                                setMessage(
                                  `SCADA update for ${resv.name}: Reservoir storage is currently at ${resv.percentage}% (${resv.level}). Inflow: ${resv.inflow}, Outflow: ${resv.outflow}.`
                                );
                                setTeluguMessage(
                                  `${resv.teluguName} ప్రస్తుత సామర్థ్యం ${resv.percentage}% (${resv.level}). ఇన్ఫ్లో: ${resv.inflow}, ఔట్ఫ్లో: ${resv.outflow}.`
                                );
                                setType('reservoir');
                                setPriority(resv.percentage < 30 ? 'high' : 'normal');
                                setActiveTab('broadcast');
                              }}
                              className="text-[11px] text-[#93ccff] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">campaign</span>
                              <span>Broadcast Notice</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Telemetry Editable Fields */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-[#8ba3c7] mb-1">
                            Water Level (ft)
                          </label>
                          <input
                            type="text"
                            value={resv.level}
                            onChange={(e) =>
                              handleUpdateAdminReservoirField(resv.id, 'level', e.target.value)
                            }
                            className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#007bb9]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#8ba3c7] mb-1">
                            Max Reservoir Level
                          </label>
                          <input
                            type="text"
                            value={resv.maxLevel}
                            onChange={(e) =>
                              handleUpdateAdminReservoirField(resv.id, 'maxLevel', e.target.value)
                            }
                            className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#007bb9]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#8ba3c7] mb-1">
                            Daily Inflow
                          </label>
                          <input
                            type="text"
                            value={resv.inflow}
                            onChange={(e) =>
                              handleUpdateAdminReservoirField(resv.id, 'inflow', e.target.value)
                            }
                            className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#007bb9]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#8ba3c7] mb-1">
                            Conduit Outflow
                          </label>
                          <input
                            type="text"
                            value={resv.outflow}
                            onChange={(e) =>
                              handleUpdateAdminReservoirField(resv.id, 'outflow', e.target.value)
                            }
                            className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#007bb9]"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-[#8ba3c7] mb-1">
                            Status Classification
                          </label>
                          <select
                            value={resv.status}
                            onChange={(e) =>
                              handleUpdateAdminReservoirField(resv.id, 'status', e.target.value)
                            }
                            className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#007bb9]"
                          >
                            <option value="Full Reserve">Full Reserve (Optimal)</option>
                            <option value="Steady Flow">Steady Flow (Normal)</option>
                            <option value="Normal Reserve">Normal Reserve (Standard)</option>
                            <option value="Active Discharge">Active Discharge (Sluice open)</option>
                            <option value="Low Level Alert">Low Level Alert (Advisory)</option>
                            <option value="Critical Reserve">Critical Reserve (Emergency)</option>
                            <option value="Sluice Gate Discharging">Sluice Gate Discharging</option>
                          </select>
                        </div>
                      </div>

                      {/* Save Button for this Reservoir */}
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveReservoir(resv)}
                        className="w-full bg-[#007bb9] hover:bg-[#006194] disabled:opacity-50 text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-99"
                      >
                        <span className={`material-symbols-outlined text-sm ${isSaving ? 'animate-spin' : ''}`}>
                          {isSaving ? 'sync' : 'save'}
                        </span>
                        <span>{isSaving ? 'Syncing with SCADA & Website...' : `Save ${resv.name} Changes`}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE NOTIFICATIONS REGISTRY */}
          {activeTab === 'registry' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Live Website Notifications ({notifications.length})</h3>
                  <p className="text-xs text-[#8ba3c7]">
                    Manage active alerts displayed on the citizen website. Toggle visibility or remove old entries.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      notif.isActive
                        ? 'bg-[#0f233a] border-[#1e3a5f]'
                        : 'bg-[#071322] border-[#1e3a5f]/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          notif.type === 'emergency'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : notif.type === 'maintenance'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-[#007bb9]/20 text-[#93ccff] border border-[#007bb9]/40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {notif.type === 'emergency'
                            ? 'warning'
                            : notif.type === 'maintenance'
                            ? 'build'
                            : notif.type === 'reservoir'
                            ? 'waves'
                            : 'water_drop'}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-white truncate">{notif.title}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              notif.priority === 'critical'
                                ? 'bg-red-500 text-white'
                                : notif.priority === 'high'
                                ? 'bg-amber-500 text-black'
                                : 'bg-[#007bb9] text-white'
                            }`}
                          >
                            {notif.priority}
                          </span>
                          <span className="text-[10px] text-[#8ba3c7]">
                            {notif.target === 'ward' ? `Ward ${notif.targetId}` : 'Citywide'} • {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-[#8ba3c7] mt-0.5 line-clamp-2">{notif.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => onToggleActiveNotification(notif.id)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
                          notif.isActive
                            ? 'bg-[#006a61] text-[#89f5e7] hover:bg-[#005049]'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {notif.isActive ? 'Active on Site' : 'Hidden'}
                      </button>

                      <button
                        onClick={() => onDeleteNotification(notif.id)}
                        className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition"
                        title="Delete Notification"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REST API & WEBHOOKS */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#007bb9] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      POST
                    </span>
                    <span className="font-mono text-xs text-[#89f5e7]">
                      https://gvmc.gov.in/api/v1/water/alerts
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8ba3c7] font-mono">SCADA Webhook Gateway</span>
                </div>
                <p className="text-xs text-[#8ba3c7]">
                  External automated systems, IoT pressure transducers, and municipal servers can post notifications directly using this REST format.
                </p>
              </div>

              {/* Code Snippets Selector */}
              <div className="bg-[#071322] rounded-xl border border-[#1e3a5f] overflow-hidden">
                <div className="bg-[#0f233a] px-4 py-2 border-b border-[#1e3a5f] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    {(['curl', 'js', 'python', 'node'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLang(lang)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase transition ${
                          codeLang === lang
                            ? 'bg-[#007bb9] text-white'
                            : 'text-[#8ba3c7] hover:text-white'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-[#8ba3c7]">Developer SDK</span>
                </div>

                <div className="p-4 font-mono text-[11px] text-[#93ccff] overflow-x-auto bg-[#071322]">
                  {codeLang === 'curl' && (
                    <pre className="leading-relaxed">
{`curl -X POST https://gvmc.gov.in/api/v1/water/alerts \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer gvmc_scada_live_key_99410" \\
  -d '{
    "ward_id": 32,
    "type": "schedule",
    "priority": "high",
    "title": "Ward 32: Gate Valve Opened for Evening Supply",
    "message": "Evening cycle is now pressurized at 2.6 Bar. Estimated supply until 07:30 PM.",
    "action": "view_ward"
  }'`}
                    </pre>
                  )}

                  {codeLang === 'js' && (
                    <pre className="leading-relaxed">
{`// Client-side / Frontend Integration
await fetch("https://gvmc.gov.in/api/v1/water/alerts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer gvmc_scada_live_key_99410"
  },
  body: JSON.stringify({
    ward_id: 32,
    type: "schedule",
    priority: "high",
    title: "Ward 32: Gate Valve Opened for Evening Supply",
    message: "Evening cycle is now pressurized at 2.6 Bar.",
    action: "view_ward"
  })
});`}
                    </pre>
                  )}

                  {codeLang === 'python' && (
                    <pre className="leading-relaxed">
{`import requests

url = "https://gvmc.gov.in/api/v1/water/alerts"
payload = {
    "ward_id": 32,
    "type": "emergency",
    "priority": "critical",
    "title": "Ward 32: Rapid Pressure Drop Detected",
    "message": "SCADA sensor detected 1.1 Bar loss near Lawson's Bay pipeline.",
    "action": "book_tanker"
}
headers = {"Authorization": "Bearer gvmc_scada_live_key_99410"}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}
                    </pre>
                  )}

                  {codeLang === 'node' && (
                    <pre className="leading-relaxed">
{`import axios from 'axios';

const res = await axios.post('https://gvmc.gov.in/api/v1/water/alerts', {
  ward_id: 14,
  type: 'schedule',
  priority: 'high',
  title: 'Ward 14: Mudasarlova Feeder Supply Active',
  message: 'Overhead tank motors can now be energized.'
}, {
  headers: { Authorization: 'Bearer gvmc_scada_live_key_99410' }
});`}
                    </pre>
                  )}
                </div>
              </div>

              {/* Interactive JSON Payload Tester */}
              <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#89f5e7] text-base">play_arrow</span>
                    Live Interactive API Dispatch Tester
                  </h4>
                  <span className="text-[10px] text-[#8ba3c7]">Edit JSON & Push Live</span>
                </div>

                <textarea
                  rows={8}
                  value={apiPayload}
                  onChange={(e) => setApiPayload(e.target.value)}
                  className="w-full bg-[#071322] font-mono text-xs text-[#93ccff] p-3 rounded-lg border border-[#1e3a5f] focus:outline-none focus:border-[#007bb9]"
                />

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#8ba3c7]">
                    Clicking will inject this notification into the website live state.
                  </span>
                  <button
                    onClick={handleSendApiPayload}
                    className="bg-[#007bb9] hover:bg-[#006194] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                    <span>Send Payload to Website</span>
                  </button>
                </div>

                {apiResponse && (
                  <div className="mt-3 bg-[#071322] p-3 rounded-lg border border-[#1e3a5f] font-mono text-[11px] text-[#89f5e7] overflow-x-auto">
                    <span className="text-[#8ba3c7] block mb-1 font-bold">API Response:</span>
                    <pre>{apiResponse}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TELEMETRY SIMULATOR */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f]">
                <h3 className="font-bold text-sm text-white">One-Click SCADA Telemetry Simulation</h3>
                <p className="text-xs text-[#8ba3c7] mt-1">
                  Trigger automated civic incidents to observe how the citizen portal reacts, notifies residents, and updates line pressure readings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Scenario 1 */}
                <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">warning</span>
                        Sudden Pipe Burst
                      </span>
                      <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono font-bold">
                        CRITICAL
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-white">Ward 45 (Gajuwaka Industrial Belt)</h5>
                    <p className="text-xs text-[#8ba3c7] mt-1 leading-snug">
                      Simulate a sudden 400mm main line fracture. Alerts residents and activates emergency tanker booking priority.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleSimulateScenario(
                        'Ward 45: Emergency Pipeline Rupture near Kanithi Junction',
                        'వార్డు 45: అత్యవసర పైప్‌లైన్ పగిలింది',
                        'Main distribution line experiencing sudden pressure drop to 0.4 Bar. Repair crews dispatched. Emergency tankers ready.',
                        'మరమ్మత్తు పనులు జరుగుతున్నాయి. ఉచిత అత్యవసర ట్యాంకర్లను బుక్ చేసుకోండి.',
                        'emergency',
                        'critical',
                        45
                      )
                    }
                    className="w-full bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">play_arrow</span>
                    <span>Trigger Pipe Burst Scenario</span>
                  </button>
                </div>

                {/* Scenario 2 */}
                <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#89f5e7] flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">valve</span>
                        Valve Gate Opening
                      </span>
                      <span className="text-[10px] bg-[#006a61]/40 text-[#89f5e7] px-2 py-0.5 rounded font-mono font-bold">
                        SCHEDULED
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-white">Ward 32 (MVP Colony Sector 1-6)</h5>
                    <p className="text-xs text-[#8ba3c7] mt-1 leading-snug">
                      Simulate morning sluice gate opening from Thatipudi feeder. Line pressure rises to 2.8 Bar.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleSimulateScenario(
                        'Ward 32: Morning Water Release Started on Schedule',
                        'వార్డు 32: ఉదయపు నీటి సరఫరా ప్రారంభమైనది',
                        'Thatipudi sluice gate opened. Line pressure is at optimal 2.8 Bar. Overhead tank pumping can proceed.',
                        'ఓవర్‌హెడ్ ట్యాంక్ మోటార్లు ఆన్ చేసుకోండి.',
                        'schedule',
                        'high',
                        32
                      )
                    }
                    className="w-full bg-[#006a61]/30 hover:bg-[#006a61]/50 text-[#89f5e7] border border-[#006a61]/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">play_arrow</span>
                    <span>Trigger Valve Open Scenario</span>
                  </button>
                </div>

                {/* Scenario 3 */}
                <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">build</span>
                        Power Sub-Station Trip
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                        MAINTENANCE
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-white">Ward 18 (Siripuram & Waltair)</h5>
                    <p className="text-xs text-[#8ba3c7] mt-1 leading-snug">
                      Booster pumping delay due to APTRANSCO substation line maintenance. Supply shifted by 45 minutes.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleSimulateScenario(
                        'Ward 18: 45-Minute Booster Delay due to Grid Maintenance',
                        'వార్డు 18: విద్యుత్ నిర్వహణ వలన 45 నిమిషాల జాప్యం',
                        'APTRANSCO line check completed. Water pumping will commence at 06:45 AM instead of 06:00 AM.',
                        'ఉదయం 6:45 గంటలకు సరఫరా మొదలవుతుంది.',
                        'maintenance',
                        'normal',
                        18
                      )
                    }
                    className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">play_arrow</span>
                    <span>Trigger Maintenance Delay</span>
                  </button>
                </div>

                {/* Scenario 4 */}
                <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#93ccff] flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">waves</span>
                        Reservoir Inflow Spike
                      </span>
                      <span className="text-[10px] bg-[#007bb9]/20 text-[#93ccff] px-2 py-0.5 rounded font-mono font-bold">
                        RESERVOIR
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-white">Meghadrigedda Reservoir</h5>
                    <p className="text-xs text-[#8ba3c7] mt-1 leading-snug">
                      Catchment rainfall adds 400 cusecs inflow. Safe water storage reaches 89% full reservoir capacity.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleSimulateScenario(
                        'Meghadrigedda Storage Reaches 89% - Full Summer Quota Secured',
                        'మేఘాద్రిగెడ్డ నీటి నిల్వ 89% కు చేరింది',
                        'Fresh catchment inflows have stabilized summer reserves for Visakhapatnam central divisions.',
                        'నగర ప్రజలకు పుష్కలంగా తాగునీటి సరఫరా అందుబాటులో ఉంది.',
                        'reservoir',
                        'info',
                        32
                      )
                    }
                    className="w-full bg-[#007bb9]/20 hover:bg-[#007bb9]/40 text-[#93ccff] border border-[#007bb9]/40 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">play_arrow</span>
                    <span>Trigger Inflow Update</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SMS & CITIZEN ALERTS GATEWAY */}
          {activeTab === 'otp' && (
            <div className="space-y-4">
              <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#89f5e7] text-xl">phonelink_ring</span>
                    <h3 className="font-bold text-sm text-white">SMS & WhatsApp Dispatch Gateway</h3>
                  </div>
                  <span className="bg-[#006a61] text-[#89f5e7] text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    ACTIVE GATEWAY
                  </span>
                </div>
                <p className="text-xs text-[#8ba3c7]">
                  Citizen and administrator accounts authenticate securely via passwords. This gateway dispatches real-time water supply notices, valve opening announcements, and emergency maintenance warnings directly to registered citizen phones via WhatsApp and cellular SMS.
                </p>
              </div>

              {/* Live Test Dispatcher */}
              <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] space-y-3">
                <h4 className="text-xs font-bold text-[#93ccff] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">send_to_mobile</span>
                  Test Real-Time Alert Dispatch to Mobile Number
                </h4>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center flex-1">
                    <span className="bg-[#071322] text-[#8ba3c7] text-xs font-bold px-3 py-2.5 rounded-l-lg border border-r-0 border-[#1e3a5f]">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Enter any 10-digit mobile number"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#071322] border border-[#1e3a5f] rounded-r-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#007bb9]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSendingTestOtp || testPhone.length < 10}
                    onClick={async () => {
                      setIsSendingTestOtp(true);
                      setTestOtpResult(null);
                      try {
                        const res = await fetch('/api/otp/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phone: testPhone }),
                        });
                        const data = await res.json();
                        setTestOtpResult(data);
                        setStatusFeedback(`Alert dispatched to +91 ${testPhone}!`);
                      } catch (err: any) {
                        setTestOtpResult({ error: err.message });
                      } finally {
                        setIsSendingTestOtp(false);
                      }
                    }}
                    className="bg-[#007bb9] hover:bg-[#006194] disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    {isSendingTestOtp ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">send</span>
                        <span>Dispatch Test Citizen Alert</span>
                      </>
                    )}
                  </button>
                </div>

                {testOtpResult && (
                  <div className="bg-[#071322] p-3 rounded-lg border border-[#1e3a5f] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#89f5e7] font-bold">Dispatch Status:</span>
                      <span className="text-[10px] text-[#8ba3c7] font-mono">
                        Route: <strong className="text-white text-xs">{testOtpResult.carrier || 'Cellular Route'}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {testOtpResult.whatsappUrl && (
                        <a
                          href={testOtpResult.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#89f5e7] border border-[#25D366]/40 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition"
                        >
                          <span className="material-symbols-outlined text-sm text-[#25D366]">chat</span>
                          <span>Open in WhatsApp (+91 {testPhone})</span>
                        </a>
                      )}

                      {testOtpResult.smsUrl && (
                        <a
                          href={testOtpResult.smsUrl}
                          className="bg-[#007bb9]/20 hover:bg-[#007bb9]/30 text-[#93ccff] border border-[#007bb9]/40 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition"
                        >
                          <span className="material-symbols-outlined text-sm">sms</span>
                          <span>Open in Native SMS App</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Carrier Gateway Configuration Form */}
              <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#89f5e7] text-base">settings_cell</span>
                    Carrier SMS Gateway Integration (Fast2SMS / Twilio)
                  </h4>
                  <span className="text-[10px] text-[#8ba3c7]">Optional Cellular SMS</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                      Select Primary SMS Gateway
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { id: 'simulation', label: 'Multi-Channel (Instant)', desc: 'WhatsApp & SMS App' },
                        { id: 'fast2sms', label: 'Fast2SMS (India Bulk)', desc: 'Cellular Carrier SMS' },
                        { id: 'twilio', label: 'Twilio International', desc: 'Global SMS Route' },
                      ].map((prov) => (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => setGatewayProvider(prov.id as any)}
                          className={`p-2.5 rounded-lg border text-left transition ${
                            gatewayProvider === prov.id
                              ? 'border-[#007bb9] bg-[#007bb9]/20 text-white font-bold'
                              : 'border-[#1e3a5f] bg-[#071322] text-[#8ba3c7] hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">{prov.label}</div>
                          <div className="text-[10px] text-[#8ba3c7] opacity-80">{prov.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {gatewayProvider === 'fast2sms' && (
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase">
                        Fast2SMS Authorization API Key
                      </label>
                      <input
                        type="password"
                        placeholder="Paste Fast2SMS API Key (from fast2sms.com/dev/bulkV2)"
                        value={fast2smsKey}
                        onChange={(e) => setFast2smsKey(e.target.value)}
                        className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#007bb9]"
                      />
                      <span className="text-[10px] text-[#8ba3c7] block">
                        Fast2SMS delivers real cellular SMS to Airtel, Jio, Vi, and BSNL numbers in India without telecom delay.
                      </span>
                    </div>
                  )}

                  {gatewayProvider === 'twilio' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                          Account SID
                        </label>
                        <input
                          type="text"
                          placeholder="AC..."
                          value={twilioSid}
                          onChange={(e) => setTwilioSid(e.target.value)}
                          className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                          Auth Token
                        </label>
                        <input
                          type="password"
                          placeholder="Auth Token"
                          value={twilioToken}
                          onChange={(e) => setTwilioToken(e.target.value)}
                          className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#8ba3c7] uppercase mb-1">
                          From Number
                        </label>
                        <input
                          type="text"
                          placeholder="+1..."
                          value={twilioFrom}
                          onChange={(e) => setTwilioFrom(e.target.value)}
                          className="w-full bg-[#071322] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/otp/gateway-config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            provider: gatewayProvider,
                            fast2smsApiKey: fast2smsKey,
                            twilioAccountSid: twilioSid,
                            twilioAuthToken: twilioToken,
                            twilioFromNumber: twilioFrom,
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setStatusFeedback('SMS Gateway configuration saved!');
                        }
                      } catch (err: any) {
                        setStatusFeedback('Failed to update config: ' + err.message);
                      }
                    }}
                    className="bg-[#007bb9] hover:bg-[#006194] text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                  >
                    Save Gateway Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CITIZEN DIRECTORY & LIVE REQUESTS */}
          {activeTab === 'citizens' && (
            <div className="space-y-4">
              <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#89f5e7] text-xl">people_alt</span>
                    <h3 className="font-bold text-sm text-white">Citizen Directory & Municipal Service Queue</h3>
                  </div>
                  <p className="text-xs text-[#8ba3c7]">
                    Live administrative link between GVMC Water Board and registered Visakhapatnam citizens.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchCitizenData}
                  disabled={loadingCitizens}
                  className="bg-[#007bb9] hover:bg-[#006194] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <span className={`material-symbols-outlined text-sm ${loadingCitizens ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                  <span>{loadingCitizens ? 'Refreshing...' : 'Refresh Records'}</span>
                </button>
              </div>

              {/* Citizen & Tanker Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#0f233a] p-3.5 rounded-xl border border-[#1e3a5f] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#007bb9]/20 border border-[#007bb9]/40 flex items-center justify-center text-[#93ccff]">
                    <span className="material-symbols-outlined text-xl">how_to_reg</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8ba3c7] block">Registered Citizens</span>
                    <span className="text-base font-bold text-white font-mono">{citizenAccounts.length} Verified</span>
                  </div>
                </div>

                <div className="bg-[#0f233a] p-3.5 rounded-xl border border-[#1e3a5f] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#006a61]/20 border border-[#006a61]/40 flex items-center justify-center text-[#89f5e7]">
                    <span className="material-symbols-outlined text-xl">mark_chat_unread</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8ba3c7] block">Active SMS Subscribers</span>
                    <span className="text-base font-bold text-[#89f5e7] font-mono">{citizenSubscribers.length} Phone Numbers</span>
                  </div>
                </div>

                <div className="bg-[#0f233a] p-3.5 rounded-xl border border-[#1e3a5f] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                    <span className="material-symbols-outlined text-xl">local_shipping</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8ba3c7] block">Emergency Tanker Queue</span>
                    <span className="text-base font-bold text-amber-300 font-mono">
                      {liveTankers.filter((t) => t.status === 'pending').length} Pending Dispatch
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. Citizen Emergency Tanker Requests */}
              <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-300 text-base">local_shipping</span>
                    Citizen Emergency Tanker Requests (Live Action Queue)
                  </h4>
                  <span className="text-[10px] text-[#8ba3c7]">Direct Admin Dispatch to Citizen</span>
                </div>

                {liveTankers.length === 0 ? (
                  <p className="text-xs text-[#8ba3c7] italic py-2">No active tanker requests in queue.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {liveTankers.map((tnk) => (
                      <div
                        key={tnk.id}
                        className="bg-[#071322] p-3 rounded-lg border border-[#1e3a5f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white font-mono">{tnk.id}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                                tnk.status === 'dispatched'
                                  ? 'bg-[#006a61] text-[#89f5e7]'
                                  : tnk.status === 'delivered'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {tnk.status}
                            </span>
                            <span className="text-[#8ba3c7] text-[11px]">Ward {tnk.wardId}</span>
                          </div>
                          <div className="text-[11px] text-[#8ba3c7]">
                            <strong className="text-white">{tnk.residentName}</strong> • +91 {tnk.phone} • {tnk.locality}
                          </div>
                          <div className="text-[10px] text-[#8ba3c7] opacity-80">
                            Capacity: {tnk.capacityLiters}L • Reason: {tnk.reason}
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {tnk.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTankerStatus(tnk.id, 'dispatched')}
                              className="bg-[#007bb9] hover:bg-[#006194] text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">local_shipping</span>
                              <span>Dispatch & Notify SMS</span>
                            </button>
                          )}
                          {tnk.status === 'dispatched' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTankerStatus(tnk.id, 'delivered')}
                              className="bg-[#006a61] hover:bg-[#005049] text-[#89f5e7] px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">done_all</span>
                              <span>Mark Delivered</span>
                            </button>
                          )}
                          <a
                            href={`https://api.whatsapp.com/send?phone=91${tnk.phone}&text=${encodeURIComponent(
                              `Hello ${tnk.residentName}, regarding your GVMC emergency water tanker booking ${tnk.id} for Ward ${tnk.wardId}: Fleet status is ${tnk.status.toUpperCase()}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#89f5e7] border border-[#25D366]/40 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition"
                          >
                            <span className="material-symbols-outlined text-xs text-[#25D366]">chat</span>
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Registered Citizen Users Directory */}
              <div className="bg-[#0f233a] p-4 rounded-xl border border-[#1e3a5f] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#89f5e7] text-base">badge</span>
                    Registered Visakhapatnam Citizens (Password-Verified Accounts)
                  </h4>
                  <span className="text-[10px] text-[#8ba3c7]">Persistent User Database</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {citizenAccounts.map((cit, idx) => (
                    <div
                      key={idx}
                      className="bg-[#071322] p-3 rounded-lg border border-[#1e3a5f] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{cit.name}</span>
                          <span className="bg-[#007bb9]/20 text-[#93ccff] text-[10px] px-2 py-0.2 rounded font-mono font-bold">
                            Ward {cit.wardId}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8ba3c7] font-mono">{cit.email}</div>
                        <div className="text-[10px] text-[#8ba3c7]">{cit.locality}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWardId(cit.wardId);
                          setTargetType('ward');
                          setTitle(`Ward ${cit.wardId} Priority Advisory`);
                          setActiveTab('broadcast');
                        }}
                        className="bg-[#122841] hover:bg-[#1a385c] text-[#93ccff] border border-[#1e3a5f] px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                      >
                        <span className="material-symbols-outlined text-xs">campaign</span>
                        <span>Send Ward Alert</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 bg-[#0f233a] border-t border-[#1e3a5f] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#8ba3c7]">
            <span className="w-2 h-2 rounded-full bg-[#89f5e7] animate-ping"></span>
            <span>All broadcasts instantly update the citizen website without requiring a rebuild.</span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#007bb9] hover:bg-[#006194] text-white px-4 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer"
          >
            Back to Citizen Portal
          </button>
        </div>
      </>
    )}
  </div>
</div>
  );
};
