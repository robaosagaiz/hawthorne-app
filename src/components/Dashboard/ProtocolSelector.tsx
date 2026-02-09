/**
 * ProtocolSelector — Dropdown to choose which protocol period to view
 * Shows current protocol by default, allows switching to older ones or "all"
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { fetchGoalHistory, type Patient } from '../../services/apiService';

export interface ProtocolPeriod {
  label: string;
  since?: string; // startDate (DD-MM-YYYY)
  until?: string; // endDate (DD-MM-YYYY), undefined = ongoing
  isCurrent: boolean;
}

interface ProtocolSelectorProps {
  grupoId: string;
  onPeriodChange: (period: ProtocolPeriod) => void;
  compact?: boolean;
}

const ProtocolSelector: React.FC<ProtocolSelectorProps> = ({ grupoId, onPeriodChange, compact = false }) => {
  const [protocols, setProtocols] = useState<ProtocolPeriod[]>([]);
  const [selected, setSelected] = useState<ProtocolPeriod | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!grupoId) return;

    fetchGoalHistory(grupoId).then(history => {
      if (history.length === 0) return;

      const periods: ProtocolPeriod[] = [];

      // History comes newest first from API
      history.forEach((h: Patient, i: number) => {
        const isCurrent = i === 0 && !h.endDate;
        const startFormatted = h.startDate || '?';
        const endFormatted = h.endDate || 'presente';

        periods.push({
          label: isCurrent
            ? `Protocolo Atual (${startFormatted})`
            : `${startFormatted} → ${endFormatted}`,
          since: h.startDate,
          until: h.endDate || undefined,
          isCurrent,
        });
      });

      // Add "Todos os dados" option
      if (history.length > 1) {
        periods.push({
          label: 'Todos os protocolos',
          since: undefined,
          until: undefined,
          isCurrent: false,
        });
      }

      setProtocols(periods);

      // Default to current protocol
      const current = periods.find(p => p.isCurrent) || periods[0];
      setSelected(current);
      onPeriodChange(current);
    });
  }, [grupoId]);

  if (protocols.length <= 1) return null; // Only 1 protocol, no selector needed

  const handleSelect = (period: ProtocolPeriod) => {
    setSelected(period);
    setOpen(false);
    onPeriodChange(period);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors text-gray-700 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        }`}
      >
        <Calendar size={compact ? 14 : 16} className="text-teal-500" />
        <span className="font-medium">{selected?.label || 'Protocolo'}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-lg min-w-[240px] py-1 overflow-hidden">
            {protocols.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSelect(p)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors flex items-center gap-2 ${
                  selected?.label === p.label ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'
                }`}
              >
                {p.isCurrent && <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />}
                {!p.isCurrent && !p.since && <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />}
                {!p.isCurrent && p.since && <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />}
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProtocolSelector;
