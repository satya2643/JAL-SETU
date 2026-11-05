/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  WardInfo,
  INITIAL_WARDS,
  INITIAL_RESERVOIRS,
  ReservoirInfo,
  getWardByNumber,
} from './data/wardData';
import {
  AppNotification,
  loadStoredNotifications,
  saveStoredNotifications,
} from './data/notificationsData';
import { RegistrationModal } from './components/RegistrationModal';
import { ResidentModal } from './components/ResidentModal';
import { TankerBookingModal } from './components/TankerBookingModal';
import { OperatorPortalModal } from './components/OperatorPortalModal';
import { AllWardsModal } from './components/AllWardsModal';
import { SmsPreviewModal } from './components/SmsPreviewModal';
import { DeveloperPortal } from './components/DeveloperPortal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

export default function App() {
  const [wards, setWards] = useState<WardInfo[]>(INITIAL_WARDS);
  const [currentWardId, setCurrentWardId] = useState<number>(32);
  const [searchInput, setSearchInput] = useState<string>('');
  const [reservoirs, setReservoirs] = useState<ReservoirInfo[]>(INITIAL_RESERVOIRS);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadStoredNotifications()
  );

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isResidentOpen, setIsResidentOpen] = useState(false);
  const [isTankerOpen, setIsTankerOpen] = useState(false);
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);
  const [isAllWardsOpen, setIsAllWardsOpen] = useState(false);
  const [isSmsPreviewOpen, setIsSmsPreviewOpen] = useState(false);
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Active toast notification for simulated events
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save notifications to localStorage whenever changed
  useEffect(() => {
    saveStoredNotifications(notifications);
  }, [notifications]);

  // Subscribe to real-time Cloud Firestore notifications
  useEffect(() => {
    const pathForOnSnapshot = 'notifications';
    const unsubscribe = onSnapshot(
      collection(db, pathForOnSnapshot),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteNotifs: AppNotification[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          setNotifications((prev) => {
            const map = new Map<string, AppNotification>();
            remoteNotifs.forEach((n) => map.set(n.id, n));
            prev.forEach((n) => {
              if (!map.has(n.id)) map.set(n.id, n);
            });
            return Array.from(map.values());
          });
        }
      },
      (error) => {
        console.warn('Firestore real-time sync notice:', error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time Cloud Firestore & REST reservoirs
  useEffect(() => {
    // 1. Initial load from server
    fetch('/api/reservoirs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reservoirs) && data.reservoirs.length > 0) {
          setReservoirs(data.reservoirs);
        }
      })
      .catch((err) => console.warn('Could not fetch reservoirs from server:', err));

    // 2. Real-time Firestore sync
    const unsubscribe = onSnapshot(
      collection(db, 'reservoirs'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteResvs: ReservoirInfo[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          setReservoirs((prev) => {
            const map = new Map<string, ReservoirInfo>();
            prev.forEach((r) => map.set(r.id, r));
            remoteResvs.forEach((r) => map.set(r.id, r));
            return Array.from(map.values());
          });
        }
      },
      (error) => {
        console.warn('Firestore reservoirs sync note:', error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUpdateReservoir = async (updated: ReservoirInfo) => {
    setReservoirs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast(`🌊 Reservoir ${updated.name} updated to ${updated.percentage}%!`);

    try {
      await setDoc(doc(db, 'reservoirs', updated.id), updated, { merge: true });
    } catch (e: any) {
      console.warn('Firestore reservoir update error:', e.message);
    }
  };

  const handleAddReservoir = async (newRes: ReservoirInfo) => {
    setReservoirs((prev) => [...prev, newRes]);
    showToast(`🌊 New Reservoir ${newRes.name} registered to telemetry!`);

    try {
      await setDoc(doc(db, 'reservoirs', newRes.id), newRes, { merge: true });
    } catch (e: any) {
      console.warn('Firestore reservoir add error:', e.message);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const currentWard =
    wards.find((w) => w.id === currentWardId) || getWardByNumber(currentWardId);

  // Notification actions with Firestore persistence
  const handleAddNotification = async (newNotif: AppNotification) => {
    setNotifications((prev) => [newNotif, ...prev]);
    showToast(`🔔 New Live Alert: ${newNotif.title}`);

    try {
      const pathForWrite = 'notifications';
      await setDoc(doc(db, pathForWrite, newNotif.id), {
        title: newNotif.title,
        teluguTitle: newNotif.teluguTitle || '',
        message: newNotif.message,
        teluguMessage: newNotif.teluguMessage || '',
        type: newNotif.type,
        priority: newNotif.priority,
        target: newNotif.target,
        targetId: newNotif.targetId ? String(newNotif.targetId) : '',
        isActive: newNotif.isActive,
        source: newNotif.source,
        actionLabel: newNotif.actionLabel || '',
        actionType: newNotif.actionType || '',
        timestamp: newNotif.timestamp,
        date: newNotif.date,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    } catch (err) {
      console.warn('Saved locally; Firestore note:', err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast('Notification removed from website');

    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.warn('Deleted locally; Firestore note:', err);
    }
  };

  const handleToggleActiveNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isActive: !n.isActive } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All notifications marked as read');
  };

  const handleClearAll = () => {
    setNotifications([]);
    showToast('Notification registry cleared');
  };

  // Handle Search
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;

    const numMatch = searchInput.match(/\d+/);
    if (numMatch) {
      const wardNum = parseInt(numMatch[0], 10);
      if (wardNum >= 1 && wardNum <= 98) {
        setCurrentWardId(wardNum);
        showToast(`Loaded live telemetry for Ward ${wardNum}`);
        return;
      }
    }

    // Try finding by locality or text
    const found = INITIAL_WARDS.find(
      (w) =>
        w.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        w.locality.toLowerCase().includes(searchInput.toLowerCase())
    );

    if (found) {
      setCurrentWardId(found.id);
      showToast(`Found ${found.name}`);
    } else {
      showToast(`Showing nearest match for "${searchInput}" (Ward 32)`);
      setCurrentWardId(32);
    }
  };

  const handleUpdateWard = (updated: WardInfo) => {
    setWards((prev) => {
      const exists = prev.some((w) => w.id === updated.id);
      if (exists) {
        return prev.map((w) => (w.id === updated.id ? updated : w));
      }
      return [...prev, updated];
    });
    setCurrentWardId(updated.id);
    showToast(`Updated telemetry & valve state for Ward ${updated.id}`);
  };

  // Calculate unread active notifications
  const unreadCount = notifications.filter((n) => n.isActive && !n.isRead).length;

  return (
    <div className="bg-[#f8f9ff] text-[#011d35] font-sans min-h-screen flex flex-col items-center justify-start antialiased selection:bg-[#cce5ff] selection:text-[#001d31]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 z-50 px-4 py-2.5 rounded-full bg-[#006194] text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3 max-w-sm">
          <span className="material-symbols-outlined text-sm text-[#89f5e7]">
            info
          </span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Main Container - Optimized for mobile & civic desktop layout */}
      <main className="w-full max-w-md sm:max-w-lg bg-[#f8f9ff] flex flex-col relative pb-10 border-x border-[#bfc7d2]/20 shadow-xs">
        {/* Civic Top Bar with Developer Hub & Notification Bell */}
        <div className="w-full px-4 pt-3 pb-1 flex items-center justify-between border-b border-[#bfc7d2]/20 bg-white/70 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#006194] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <span className="material-symbols-outlined text-base">water_drop</span>
            </div>
            <div>
              <span className="font-extrabold text-xs text-[#011d35] tracking-tight block leading-tight">
                JAL SETU
              </span>
              <span className="text-[9px] text-[#006194] font-semibold tracking-wider uppercase block">
                GVMC Civic Water Grid
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Center Bell with Unread Badge */}
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              className="relative w-8 h-8 rounded-lg bg-[#eef4ff] hover:bg-[#dbe9ff] text-[#006194] flex items-center justify-center transition cursor-pointer border border-[#006194]/20"
              title="View Live Notifications"
            >
              <span className="material-symbols-outlined text-lg">
                notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ba1a1a] text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative px-4 pt-4 pb-6 flex flex-col items-center text-center overflow-hidden">
          {/* Subtle Water Ripple SVG Vector Motif */}
          <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-30">
            <svg
              className="animate-pulse"
              fill="none"
              height="420"
              viewBox="0 0 420 420"
              width="420"
            >
              <circle
                cx="210"
                cy="210"
                r="80"
                stroke="#007bb9"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              ></circle>
              <circle
                cx="210"
                cy="210"
                r="140"
                stroke="#006194"
                strokeWidth="1"
              ></circle>
              <circle
                cx="210"
                cy="210"
                r="200"
                stroke="#006a61"
                strokeWidth="0.75"
              ></circle>
            </svg>
          </div>

          {/* Official Initiative Badge */}
          <div className="inline-flex items-center space-x-1 bg-[#eef4ff] px-4 py-1.5 rounded-full shadow-xs mb-4 border border-[#bfc7d2]/25">
            <span
              className="material-symbols-outlined text-[#006194] text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="text-[12px] font-semibold text-[#006194] tracking-wide">
              Official GVMC Water Board Initiative
            </span>
            <span className="text-[#707881] text-[11px] font-bold">| జివిఎంసి</span>
          </div>

          {/* Main Headline with Telugu accent micro-cue */}
          <h1 className="text-[30px] sm:text-[34px] leading-[36px] sm:leading-[40px] font-extrabold text-[#011d35] tracking-tight max-w-xs sm:max-w-md">
            Never miss a water update
          </h1>
          <p className="text-[12px] font-semibold text-[#006194] mt-1">
            నీటి సరఫరా తాజా సమాచారం మరియు హెచ్చరికలు
          </p>

          {/* Subheadline */}
          <p className="text-[14px] leading-[21px] text-[#3f4850] mt-2 max-w-sm">
            Accurate daily water release timings, pipeline maintenance alerts, and emergency tanker updates directly for your ward in Visakhapatnam.
          </p>

          {/* Primary Quick Actions */}
          <div className="w-full flex flex-col gap-2 mt-6">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="w-full bg-[#006194] hover:bg-[#007bb9] active:scale-[0.99] text-white font-semibold text-[14px] py-3.5 px-6 rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
              type="button"
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                notifications_active
              </span>
              <span>Register for Ward Alerts</span>
              <span className="text-[#cce5ff] opacity-80 text-[11px] ml-1 font-bold">
                / నమోదు
              </span>
            </button>

            <button
              onClick={() => setIsResidentOpen(true)}
              className="w-full bg-[#e5efff] hover:bg-[#dbe9ff] active:scale-[0.99] text-[#006194] font-semibold text-[14px] py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer border border-[#006194]/15"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">login</span>
              <span>Resident Log In / లాగిన్</span>
            </button>
          </div>
        </div>

        {/* Interactive Ward Quick Search Deck */}
        <div className="px-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#bfc7d2]/30">
            <div className="flex items-center justify-between mb-1">
              <label
                className="text-[12px] font-semibold text-[#011d35] flex items-center gap-1.5"
                htmlFor="wardInput"
              >
                <span className="material-symbols-outlined text-[#006194] text-base">
                  pin_drop
                </span>
                Quick Ward Status / వార్డు స్థితిని చూడండి
              </label>
              <span className="text-[11px] font-bold text-[#006a61] bg-[#eef4ff] px-2 py-0.5 rounded-full">
                Zone 1–8
              </span>
            </div>
            <p className="text-[13px] text-[#3f4850] mb-3">
              Check your ward today (e.g. Ward 32, Ward 14, Ward 45)
            </p>

            <form onSubmit={handleSearch} className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-[#707881]">
                <span className="material-symbols-outlined text-xl">search</span>
              </div>
              <input
                id="wardInput"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Ward Number (1 - 98)..."
                className="w-full bg-[#eef4ff] text-[#011d35] text-[14px] pl-11 pr-24 py-3 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#006194]/30 transition-all font-medium"
              />
              <button
                type="submit"
                className="absolute right-1.5 bg-[#006194] text-white text-[12px] font-semibold px-3.5 py-2 rounded-lg hover:bg-[#007bb9] active:scale-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span>Check</span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </button>
            </form>

            {/* Quick Suggestion Ward Pills */}
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-[#3f4850] whitespace-nowrap">
                Frequent:
              </span>
              <button
                type="button"
                onClick={() => {
                  setCurrentWardId(32);
                  setSearchInput('Ward 32');
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                  currentWardId === 32
                    ? 'bg-[#006194] text-white shadow-xs'
                    : 'bg-[#e5efff] hover:bg-[#dbe9ff] text-[#011d35]'
                }`}
              >
                Ward 32 (MVP)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentWardId(14);
                  setSearchInput('Ward 14');
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                  currentWardId === 14
                    ? 'bg-[#006194] text-white shadow-xs'
                    : 'bg-[#e5efff] hover:bg-[#dbe9ff] text-[#011d35]'
                }`}
              >
                Ward 14 (Seethamdhara)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentWardId(45);
                  setSearchInput('Ward 45');
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                  currentWardId === 45
                    ? 'bg-[#006194] text-white shadow-xs'
                    : 'bg-[#e5efff] hover:bg-[#dbe9ff] text-[#011d35]'
                }`}
              >
                Ward 45 (Gajuwaka)
              </button>
              <button
                type="button"
                onClick={() => setIsAllWardsOpen(true)}
                className="text-[11px] font-bold px-2 py-1 rounded-full bg-[#dbe9ff] text-[#006194] hover:bg-[#cce5ff] whitespace-nowrap flex items-center gap-0.5 cursor-pointer"
              >
                <span>+ View All 98</span>
              </button>
            </div>

            {/* Dynamic Live Result Card */}
            <div className="mt-4 pt-4 bg-[#eef4ff] rounded-xl p-4 border border-[#bfc7d2]/20 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[18px] font-semibold text-[#011d35]">
                      {currentWard.name}
                    </span>
                  </div>
                  <span className="text-[13px] text-[#3f4850] mt-0.5">
                    {currentWard.zone} • {currentWard.feeder}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs ${
                    currentWard.status === 'Supplying Now'
                      ? 'bg-[#86f2e4] text-[#005049]'
                      : currentWard.status === 'Low Pressure Alert'
                      ? 'bg-[#d1e4ff] text-[#004b73]'
                      : currentWard.status === 'Maintenance'
                      ? 'bg-[#ffdad6] text-[#93000a]'
                      : 'bg-[#89f5e7] text-[#005049]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006a61] animate-ping"></span>
                  {currentWard.status}
                </span>
              </div>

              <div className="mt-3 pt-1 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#3f4850] uppercase tracking-wider block">
                    Today's Window:
                  </span>
                  <span className="text-[22px] font-bold text-[#006194]">
                    {currentWard.timing}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#3f4850] block">Line Pressure</span>
                  <span className="text-[14px] font-semibold text-[#006a61]">
                    {currentWard.linePressure}
                  </span>
                </div>
              </div>

              {currentWard.notice && (
                <div className="mt-2.5 p-2 bg-white/70 border border-[#bfc7d2]/30 rounded-lg text-[11px] text-[#011d35] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-[#006194]">
                    info
                  </span>
                  <span>{currentWard.notice}</span>
                </div>
              )}

              <div className="mt-3 bg-white rounded-lg p-2 px-3 flex items-center justify-between text-[#011d35] shadow-xs">
                <div className="flex items-center gap-1.5 text-[#006194]">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span className="text-[11px]">
                    Next Supply In: <strong>{currentWard.nextSupplyCountdown}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSmsPreviewOpen(true)}
                  className="text-[11px] text-[#006194] hover:underline font-bold cursor-pointer"
                >
                  Get SMS Alert
                </button>
              </div>

              {/* 30-Minute Prior Alert Protocol Card */}
              <div className="mt-3.5 p-3.5 bg-white rounded-xl border border-[#006a61]/30 flex flex-col gap-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#006a61] text-base">verified</span>
                    <span className="text-[12px] font-bold text-[#005049]">
                      30-Min Prior Alert Protocol Verified
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#86f2e4] text-[#005049] px-2 py-0.5 rounded-full">
                    {currentWard.alertLeadMinutes || 45}m Advance Notice
                  </span>
                </div>

                <div className="bg-[#eef4ff] p-2.5 rounded-lg border border-[#bfc7d2]/20 text-xs text-[#011d35] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#3f4850] block tracking-wide">
                      Water Will Be Given At:
                    </span>
                    <span className="text-[16px] font-extrabold text-[#006194]">
                      {currentWard.scheduledSupplyStartTime || currentWard.timing.split('–')[0]?.trim()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#3f4850] block">Supply Window</span>
                    <span className="text-[12px] font-semibold text-[#011d35]">
                      {currentWard.timing}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#3f4850]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#006194]">campaign</span>
                    <span>Alert Issued: <strong>{currentWard.alertDispatchedAt || '05:15 AM'}</strong></span>
                  </span>
                  <span className="text-[#006a61] font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    <span>&ge; 30 Mins Notice Rule Met</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Municipal Emergency & Tanker Request Strip */}
        <div className="px-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#bfc7d2]/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#86f2e4] flex items-center justify-center text-[#006f66] shrink-0">
                <span className="material-symbols-outlined text-xl">
                  local_shipping
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-semibold text-[#011d35] truncate">
                  Need an Emergency Water Tanker?
                </span>
                <span className="text-[12px] text-[#3f4850] truncate">
                  Direct doorstep dispatch for dry supply pockets
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsTankerOpen(true)}
              className="bg-[#e5efff] hover:bg-[#dbe9ff] text-[#006194] font-semibold text-[12px] px-3.5 py-2.5 rounded-lg whitespace-nowrap active:scale-95 transition-all cursor-pointer border border-[#006194]/20"
              type="button"
            >
              Book Tanker
            </button>
          </div>
        </div>

        {/* Helpline Contact Callout Banner */}
        <div className="px-4 mb-6">
          <div className="bg-[#d1e4ff] rounded-xl p-4 flex flex-col gap-2 text-[#011d35] border border-[#bfc7d2]/30">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-[#006194] text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                support_agent
              </span>
              <span className="text-[14px] font-semibold text-[#011d35]">
                GVMC Jal Sahayata Helpline
              </span>
            </div>
            <p className="text-[13px] text-[#3f4850] leading-snug">
              Facing dirty water, sudden leakage, or pipe burst? Reach municipal engineers immediately:
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <a
                className="bg-white hover:bg-[#eef4ff] px-4 py-2.5 rounded-lg flex items-center justify-between text-[#011d35] shadow-xs transition-colors flex-1"
                href="tel:1913"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006a61] text-base">
                    call
                  </span>
                  <span className="text-[12px] font-semibold">Toll-Free Helpline:</span>
                </div>
                <span className="text-[18px] font-bold text-[#006194] tracking-wide">
                  1913
                </span>
              </a>

              <a
                className="bg-white hover:bg-[#eef4ff] px-4 py-2.5 rounded-lg flex items-center justify-between text-[#011d35] shadow-xs transition-colors flex-1"
                href="https://wa.me/919440100000"
                target="_blank"
                rel="noreferrer"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006a61] text-base">
                    chat
                  </span>
                  <span className="text-[12px] font-semibold">WhatsApp Desk:</span>
                </div>
                <span className="text-[14px] font-bold text-[#006a61] tracking-wide">
                  96199XXXXX
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Operator & Developer Switching Section */}
        <div className="px-4 pb-8 flex flex-col items-center text-center space-y-3">
          {/* Operator Switch */}
          <div className="w-full bg-[#eef4ff] rounded-xl p-4 flex flex-col items-center gap-2 border border-[#bfc7d2]/30">
            <span className="material-symbols-outlined text-[#707881] text-2xl">
              engineering
            </span>
            <p className="text-[12px] font-semibold text-[#011d35]">
              Municipal Water Operator or Valve Controller?
            </p>
            <p className="text-[13px] text-[#3f4850] max-w-xs">
              Authorized GVMC field personnel can update gate schedules and pressure readings directly.
            </p>
            <button
              onClick={() => setIsOperatorOpen(true)}
              className="inline-flex items-center gap-1.5 mt-1 text-[12px] text-[#006194] hover:text-[#007bb9] font-bold transition-colors cursor-pointer"
            >
              <span>Switch to Operator Portal</span>
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </button>
          </div>

          {/* Developer Website & API Hub Switch */}
          <div className="w-full bg-[#0f233a] rounded-xl p-4 flex flex-col items-center gap-2 border border-[#1e3a5f] text-white">
            <div className="w-9 h-9 rounded-full bg-[#007bb9]/30 text-[#89f5e7] flex items-center justify-center font-mono font-bold">
              <span className="material-symbols-outlined text-xl">terminal</span>
            </div>
            <p className="text-[12px] font-bold text-white">
              Developer Hub & Civic Notification Center
            </p>
            <p className="text-[12px] text-[#93ccff]/80 max-w-xs">
              Publish custom water alerts to the website, test REST API webhooks, or simulate IoT telemetry incidents.
            </p>
            <button
              onClick={() => setIsDeveloperOpen(true)}
              className="inline-flex items-center gap-1.5 mt-1 text-[12px] bg-[#007bb9] hover:bg-[#006194] text-white font-bold px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-base">campaign</span>
              <span>Open Developer Portal & Add Notifications</span>
            </button>
          </div>

          {/* Official Civic Footer Subtext */}
          <div className="mt-4 flex flex-col items-center gap-1 text-[#3f4850]">
            <p className="text-[11px] font-bold">
              Greater Visakhapatnam Municipal Corporation (GVMC)
            </p>
            <p className="text-[13px] opacity-75">
              Tenneti Bhavan, Asilmetta Junction, Visakhapatnam - 530002
            </p>
          </div>
        </div>
      </main>

      {/* Interactive Modals */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        initialWard={currentWardId}
        onSuccessRegistered={(data) => {
          showToast(`Alerts active for ${data.name} on ${data.ward.name}!`);
        }}
      />

      <ResidentModal
        isOpen={isResidentOpen}
        onClose={() => setIsResidentOpen(false)}
        currentWard={currentWard}
        onOpenTankerModal={() => setIsTankerOpen(true)}
        onSelectWard={(wardId) => {
          setCurrentWardId(wardId);
          setSearchInput(`Ward ${wardId}`);
          showToast(`Loaded personal ward dashboard for Ward ${wardId}`);
        }}
      />

      <TankerBookingModal
        isOpen={isTankerOpen}
        onClose={() => setIsTankerOpen(false)}
        currentWard={currentWard}
      />

      <OperatorPortalModal
        isOpen={isOperatorOpen}
        onClose={() => setIsOperatorOpen(false)}
        wards={wards}
        onUpdateWard={handleUpdateWard}
      />

      <AllWardsModal
        isOpen={isAllWardsOpen}
        onClose={() => setIsAllWardsOpen(false)}
        onSelectWard={(w) => {
          setCurrentWardId(w.id);
          setSearchInput(`Ward ${w.id}`);
          showToast(`Switched view to ${w.name}`);
        }}
        selectedWardId={currentWardId}
      />

      <SmsPreviewModal
        isOpen={isSmsPreviewOpen}
        onClose={() => setIsSmsPreviewOpen(false)}
        ward={currentWard}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {/* Developer Website Portal */}
      <DeveloperPortal
        isOpen={isDeveloperOpen}
        onClose={() => setIsDeveloperOpen(false)}
        notifications={notifications}
        onAddNotification={handleAddNotification}
        onDeleteNotification={handleDeleteNotification}
        onToggleActiveNotification={handleToggleActiveNotification}
        reservoirs={reservoirs}
        onUpdateReservoir={handleUpdateReservoir}
        onAddReservoir={handleAddReservoir}
      />

      {/* Notification Center Tray */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        currentWard={currentWard}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll}
        onOpenDeveloperPortal={() => setIsDeveloperOpen(true)}
        onSelectWard={(wardId) => {
          setCurrentWardId(wardId);
          setSearchInput(`Ward ${wardId}`);
          showToast(`Switched view to Ward ${wardId}`);
        }}
        onOpenTankerModal={() => setIsTankerOpen(true)}
      />
    </div>
  );
}
