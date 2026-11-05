import React, { useState } from 'react';
import { WardInfo, INITIAL_WARDS, getWardByNumber } from '../data/wardData';

interface AllWardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWard: (ward: WardInfo) => void;
  selectedWardId: number;
}

export const AllWardsModal: React.FC<AllWardsModalProps> = ({
  isOpen,
  onClose,
  onSelectWard,
  selectedWardId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!isOpen) return null;

  // Generate full list of 98 wards
  const allWards: WardInfo[] = Array.from({ length: 98 }, (_, i) => i + 1).map((id) =>
    getWardByNumber(id)
  );

  const filteredWards = allWards.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.teluguName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toString() === searchTerm.trim();

    const matchesZone = zoneFilter === 'all' || w.zone === zoneFilter;
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;

    return matchesSearch && matchesZone && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-on-background/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest text-on-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary p-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">apartment</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg leading-tight">All 98 GVMC Ward Divisions</h2>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  8 Zones
                </span>
              </div>
              <p className="text-xs text-white/90">విశాఖపట్నం 98 వార్డుల నీటి సరఫరా సూచిక</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search ward number or area (e.g. 32, MVP, Seethamdhara, Gajuwaka)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-outline-variant/40 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-white border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-medium focus:outline-none"
            >
              <option value="all">All Zones (1 to 8)</option>
              <option value="Zone I">Zone I (Bheemili & Rushikonda)</option>
              <option value="Zone II">Zone II (Seethamdhara & HB)</option>
              <option value="Zone III">Zone III (MVP & Waltair)</option>
              <option value="Zone IV">Zone IV (South & Poorna Mkt)</option>
              <option value="Zone V">Zone V (Gajuwaka & Auto Nagar)</option>
              <option value="Zone VI">Zone VI (Gopalapatnam & NAD)</option>
              <option value="Zone VII">Zone VII (Steel Plant & Duvvada)</option>
              <option value="Zone VIII">Zone VIII (Pendurthi)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-medium focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Supplying Now">Supplying Now (Active)</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Low Pressure Alert">Low Pressure Alert</option>
              <option value="Maintenance">Maintenance</option>
            </select>

            <span className="ml-auto text-[11px] text-on-surface-variant self-center">
              Showing {filteredWards.length} of 98 Wards
            </span>
          </div>
        </div>

        {/* Ward List Grid */}
        <div className="p-4 overflow-y-auto space-y-2.5 divide-y divide-outline-variant/20">
          {filteredWards.map((ward) => {
            const isCurrent = ward.id === selectedWardId;
            return (
              <div
                key={ward.id}
                onClick={() => {
                  onSelectWard(ward);
                  onClose();
                }}
                className={`pt-2.5 pb-2.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-primary-fixed/40 border border-primary/40'
                    : 'hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isCurrent
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-primary'
                    }`}
                  >
                    W{ward.id}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-on-surface truncate">
                        {ward.name}
                      </span>
                      <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-1.5 py-0.2 rounded font-medium">
                        {ward.zone}
                      </span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant truncate mt-0.5">
                      {ward.feeder} • {ward.locality}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-primary block">{ward.timing}</span>
                    <span className="text-[10px] text-secondary font-bold block">
                      Water at: {ward.scheduledSupplyStartTime || ward.timing.split('–')[0]?.trim()}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">{ward.linePressure}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 ${
                      ward.status === 'Supplying Now'
                        ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                        : ward.status === 'Low Pressure Alert'
                        ? 'bg-surface-variant text-primary'
                        : ward.status === 'Maintenance'
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-surface-container-high text-on-surface'
                    }`}
                  >
                    {ward.status === 'Supplying Now' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                    )}
                    {ward.status}
                  </span>

                  <span className="material-symbols-outlined text-outline text-base">
                    chevron_right
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-low border-t border-outline-variant/30 flex justify-between items-center text-xs">
          <span className="text-[11px] text-on-surface-variant">
            Data synced with GVMC SCADA telemetry servers
          </span>
          <button
            onClick={onClose}
            className="bg-primary text-on-primary px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-primary-container transition"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
