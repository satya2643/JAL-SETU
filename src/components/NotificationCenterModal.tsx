import React, { useState } from 'react';
import { AppNotification } from '../data/notificationsData';
import { WardInfo } from '../data/wardData';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  currentWard: WardInfo;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onOpenDeveloperPortal: () => void;
  onSelectWard: (wardId: number) => void;
  onOpenTankerModal: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  currentWard,
  onMarkAllRead,
  onClearAll,
  onOpenDeveloperPortal,
  onSelectWard,
  onOpenTankerModal,
}) => {
  const [filter, setFilter] = useState<'all' | 'my_ward' | 'emergency'>('all');

  if (!isOpen) return null;

  const activeNotifs = notifications.filter((n) => n.isActive);

  const filteredNotifs = activeNotifs.filter((n) => {
    if (filter === 'emergency') {
      return n.type === 'emergency' || n.priority === 'critical' || n.priority === 'high';
    }
    if (filter === 'my_ward') {
      return n.target === 'all' || (n.target === 'ward' && Number(n.targetId) === currentWard.id);
    }
    return true;
  });

  const unreadCount = activeNotifs.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-on-background/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest text-on-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary p-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative">
              <span className="material-symbols-outlined text-2xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-white font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg leading-tight">Live Alerts & Notifications</h2>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {activeNotifs.length} Total
                </span>
              </div>
              <p className="text-xs text-primary-fixed opacity-90">
                తాజా సమాచారం • GVMC SCADA & Civic Broadcasts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Developer Console Shortcut Strip */}
        <div className="bg-[#0f233a] text-white px-4 py-2 flex items-center justify-between text-xs border-b border-[#1e3a5f]">
          <div className="flex items-center gap-2 text-[11px] text-[#93ccff]">
            <span className="material-symbols-outlined text-sm">terminal</span>
            <span>Developer / SCADA Engineer?</span>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenDeveloperPortal();
            }}
            className="bg-[#007bb9] hover:bg-[#006194] text-white text-[11px] font-bold px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer"
          >
            <span>Open Developer Console</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="p-3 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between gap-2">
          <div className="flex gap-1.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-white hover:bg-surface-container text-on-surface'
              }`}
            >
              All ({activeNotifs.length})
            </button>
            <button
              onClick={() => setFilter('my_ward')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                filter === 'my_ward'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-white hover:bg-surface-container text-on-surface'
              }`}
            >
              Ward {currentWard.id}
            </button>
            <button
              onClick={() => setFilter('emergency')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                filter === 'emergency'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-white hover:bg-surface-container text-on-surface'
              }`}
            >
              Urgent / Alerts
            </button>
          </div>

          <div className="flex gap-2 text-[11px]">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Mark Read
              </button>
            )}
            <button
              onClick={onClearAll}
              className="text-on-surface-variant hover:text-error text-[11px] cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Notification Items List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-outline-variant/15">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant space-y-2">
              <span className="material-symbols-outlined text-4xl text-outline">notifications_off</span>
              <p className="text-xs">No notifications in this filter category.</p>
              <button
                onClick={() => setFilter('all')}
                className="text-xs text-primary font-bold hover:underline"
              >
                Show All Notifications
              </button>
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                className={`pt-3 first:pt-0 space-y-2 transition ${
                  !n.isRead ? 'bg-primary-fixed/15 -mx-2 px-2 py-2 rounded-xl' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        n.type === 'emergency'
                          ? 'bg-error animate-ping'
                          : n.type === 'maintenance'
                          ? 'bg-amber-500'
                          : 'bg-secondary'
                      }`}
                    ></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {n.type.toUpperCase()} •{' '}
                      {n.target === 'ward' ? `Ward ${n.targetId}` : 'Citywide'}
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-medium shrink-0">
                    {n.timestamp}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-on-surface leading-snug">{n.title}</h4>
                  {n.teluguTitle && (
                    <p className="text-[11px] text-primary font-medium mt-0.5">{n.teluguTitle}</p>
                  )}
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{n.message}</p>
                  {n.teluguMessage && (
                    <p className="text-[11px] text-on-surface-variant/90 mt-1 border-t border-outline-variant/20 pt-1">
                      {n.teluguMessage}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-[10px] text-outline font-mono">Via {n.source}</span>

                  {n.actionLabel && (
                    <button
                      onClick={() => {
                        onClose();
                        if (n.actionType === 'book_tanker') {
                          onOpenTankerModal();
                        } else if (n.actionType === 'view_ward' && typeof n.targetId === 'number') {
                          onSelectWard(n.targetId);
                        } else if (n.actionType === 'call_helpline') {
                          window.location.href = 'tel:1913';
                        }
                      }}
                      className="bg-primary hover:bg-primary-container text-on-primary text-[10px] font-bold px-2.5 py-1 rounded-md transition shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>{n.actionLabel}</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-low border-t border-outline-variant/30 flex justify-between items-center text-xs">
          <button
            onClick={() => {
              onClose();
              onOpenDeveloperPortal();
            }}
            className="text-primary hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add_alert</span>
            <span>Developer: Add Notification to Website</span>
          </button>
          <button
            onClick={onClose}
            className="bg-primary text-on-primary px-3.5 py-1.5 rounded-lg font-bold text-xs hover:bg-primary-container transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
