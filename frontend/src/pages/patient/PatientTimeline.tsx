import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Patient } from '../../types/patient';
import type { ActionLog, ActionLogEntityType, ActionLogType } from '../../types/actionLog';
import { usePatientTimeline } from '../../hooks/usePatientTimeline';

// ============================================================================
// Visual Config: Entity Styles & Emojis
// ============================================================================
const ENTITY_CONFIG: Record<
  ActionLogEntityType,
  { label: string; emoji: string; colorClass: string; badgeClass: string; borderClass: string }
> = {
  visit_note: {
    label: 'Visit Note',
    emoji: '📝',
    colorClass: 'bg-blue-600 text-white',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    borderClass: 'border-l-blue-500',
  },
  prescription: {
    label: 'Prescription',
    emoji: '💊',
    colorClass: 'bg-emerald-600 text-white',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderClass: 'border-l-emerald-500',
  },
  lab_test: {
    label: 'Lab Order',
    emoji: '🔬',
    colorClass: 'bg-amber-600 text-white',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    borderClass: 'border-l-amber-500',
  },
  treatment_plan: {
    label: 'Treatment Plan',
    emoji: '📋',
    colorClass: 'bg-purple-600 text-white',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    borderClass: 'border-l-purple-500',
  },
  document: {
    label: 'Document',
    emoji: '📄',
    colorClass: 'bg-indigo-600 text-white',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    borderClass: 'border-l-indigo-500',
  },
};

const ACTION_CONFIG: Record<ActionLogType, { label: string; emoji: string; badge: string }> = {
  CREATED: {
    label: 'Created',
    emoji: '✨',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  UPDATED: {
    label: 'Updated',
    emoji: '✏️',
    badge: 'bg-slate-100 text-slate-800',
  },
  STATUS_CHANGE: {
    label: 'Status Change',
    emoji: '🔄',
    badge: 'bg-blue-100 text-blue-800',
  },
};

const ALL_ENTITY_TYPES: ActionLogEntityType[] = [
  'visit_note',
  'treatment_plan',
  'prescription',
  'lab_test',
  'document',
];

export const PatientTimeline: React.FC = () => {
  const { patient } = useOutletContext<{ patient: Patient }>();
  const { data: logs, isLoading, isError, error } = usePatientTimeline(patient.id);

  // Filter state: Set of active entity types
  const [selectedTypes, setSelectedTypes] = useState<Set<ActionLogEntityType>>(
    new Set(ALL_ENTITY_TYPES)
  );

  const toggleType = (type: ActionLogEntityType) => {
    const next = new Set(selectedTypes);
    if (next.has(type)) {
      // Don't allow unchecking everything; if last one, keep it or toggle all
      if (next.size > 1) {
        next.delete(type);
      }
    } else {
      next.add(type);
    }
    setSelectedTypes(next);
  };

  const handleSelectAll = () => {
    setSelectedTypes(new Set(ALL_ENTITY_TYPES));
  };

  const filteredLogs = logs?.filter((log) => selectedTypes.has(log.entity_type)) || [];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Patient Activity Timeline</h2>
          <p className="text-xs text-slate-500">
            Audit trail of clinical records, modifications, orders, and status transitions.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleSelectAll}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
              selectedTypes.size === ALL_ENTITY_TYPES.length
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All
          </button>

          {ALL_ENTITY_TYPES.map((type) => {
            const config = ENTITY_CONFIG[type];
            const isSelected = selectedTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                  isSelected
                    ? `${config.badgeClass} font-semibold shadow-xs`
                    : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'
                }`}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Timeline View */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Loading patient activity trail...
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs rounded-md">
          Failed to load timeline: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {!isLoading && !isError && filteredLogs.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-sm font-medium text-slate-700">No activities recorded</p>
          <p className="text-xs text-slate-400 mt-1">
            No events match the selected category filters.
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredLogs.length > 0 && (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6 my-4 ml-3">
          {filteredLogs.map((log) => (
            <TimelineCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Timeline Node Card (Expandable JSON & Diff View)
// ============================================================================
const TimelineCard: React.FC<{ log: ActionLog }> = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const entity = ENTITY_CONFIG[log.entity_type] || ENTITY_CONFIG.visit_note;
  const action = ACTION_CONFIG[log.action] || ACTION_CONFIG.CREATED;

  const dateFormatted = new Date(log.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="relative group">
      {/* Node Badge on Timeline Axis */}
      <div
        className={`absolute -left-[37px] sm:-left-[45px] top-1.5 w-8 h-8 rounded-full ${entity.colorClass} border-4 border-slate-50 flex items-center justify-center text-xs shadow-xs`}
        title={entity.label}
      >
        <span>{entity.emoji}</span>
      </div>

      {/* Card Body */}
      <div
        className={`bg-white rounded-lg border border-slate-200 border-l-4 ${entity.borderClass} shadow-xs hover:border-slate-300 transition-all p-4`}
      >
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${entity.badgeClass}`}
            >
              {entity.label}
            </span>

            <span
              className={`text-[11px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${action.badge}`}
            >
              <span>{action.emoji}</span>
              <span>{action.label}</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {dateFormatted}
          </div>
        </div>

        {/* Narrative Context & Summary */}
        <div className="py-2.5">
          <TimelineEventSummary log={log} />

          {/* Actor info */}
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-2">
            <span>By:</span>
            <strong className="text-slate-600 font-medium">
              {log.actor?.name || 'Authorized Staff'}
            </strong>
            <span>•</span>
            <span className="font-mono text-[10px]">ID: {log.entity_id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Expandable JSON Details Toggle */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <span>{isExpanded ? '▲ Hide Full Payload' : '▼ View Payload & Changes'}</span>
          </button>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            {/* Status change visual diff if available */}
            {log.action === 'STATUS_CHANGE' && (
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center gap-3 text-xs">
                <span className="text-slate-500 font-medium">Transition:</span>
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono uppercase text-[11px]">
                  {log.details.old_status || 'Unknown'}
                </span>
                <span className="text-slate-400">➔</span>
                <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded font-mono uppercase text-[11px]">
                  {log.details.new_status}
                </span>
              </div>
            )}

            {/* Document rename diff if available */}
            {log.entity_type === 'document' && log.action === 'UPDATED' && (
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1">
                {log.details.old_name && log.details.old_name !== log.details.name && (
                  <div>
                    <span className="text-slate-400">Renamed from: </span>
                    <span className="font-mono text-slate-600 line-through mr-1">
                      {log.details.old_name}
                    </span>
                    <span>➔ </span>
                    <strong className="text-slate-800 font-mono">{log.details.name}</strong>
                  </div>
                )}
                {log.details.old_type && log.details.old_type !== log.details.type && (
                  <div>
                    <span className="text-slate-400">Type changed from: </span>
                    <span className="font-mono text-slate-600 line-through mr-1">
                      {log.details.old_type}
                    </span>
                    <span>➔ </span>
                    <strong className="text-slate-800 font-mono">{log.details.type}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Raw JSON viewer */}
            <div className="relative rounded-md overflow-hidden bg-slate-900 text-slate-100 text-[11px] p-3">
              <span className="absolute top-2 right-2 text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                JSONB Details
              </span>
              <pre className="overflow-x-auto font-mono leading-relaxed max-h-60">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// HELPER: Formatted Narrative Summary
// ============================================================================
const TimelineEventSummary: React.FC<{ log: ActionLog }> = ({ log }) => {
  const { entity_type, action, details } = log;

  // Visit Note
  if (entity_type === 'visit_note') {
    const complaint = details.chief_complaint || 'General Consultation';
    const assessment = details.assessment;
    return (
      <div className="text-xs text-slate-700">
        <p className="font-medium text-slate-900">
          Encounter: <span className="font-semibold">{complaint}</span>
        </p>
        {assessment && (
          <p className="text-slate-500 mt-0.5 line-clamp-2">
            Assessment: {assessment}
          </p>
        )}
      </div>
    );
  }

  // Prescription
  if (entity_type === 'prescription') {
    const meds = details.prescriptions || [];
    return (
      <div className="text-xs text-slate-700">
        <p className="font-medium text-slate-900">
          Medication Regimen ({meds.length} item{meds.length === 1 ? '' : 's'})
        </p>
        {meds.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            meds.map((m: any, i: number) => (
              <span
                key={m.id || i}
                className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]"
              >
                <strong>{m.name}</strong> {m.dosage ? `(${m.dosage})` : ''} - {m.frequency}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Lab Test
  if (entity_type === 'lab_test') {
    return (
      <div className="text-xs text-slate-700">
        <p className="font-medium text-slate-900">
          {details.procedure}
        </p>
        <p className="text-slate-500 mt-0.5">
          Lab Vendor: <strong className="text-slate-700">{details.lab_name || 'In-House / Unspecified'}</strong>
          {details.status && (
            <span className="ml-2 font-mono uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
              {details.status}
            </span>
          )}
        </p>
      </div>
    );
  }

  // Treatment Plan
  if (entity_type === 'treatment_plan') {
    const title = details.details?.title || 'Treatment Plan';
    const steps = details.details?.steps || [];
    return (
      <div className="text-xs text-slate-700">
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-slate-500 mt-0.5">
          Contains {steps.length} procedural step{steps.length === 1 ? '' : 's'}
          {details.status && (
            <span className="ml-2 font-mono uppercase text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
              {details.status}
            </span>
          )}
        </p>
      </div>
    );
  }

  // Document
  if (entity_type === 'document') {
    return (
      <div className="text-xs text-slate-700">
        <p className="font-medium text-slate-900">{details.name || 'Clinical Document'}</p>
        <p className="text-slate-500 mt-0.5 capitalize">
          Category: <span className="font-medium text-slate-700">{details.type?.replace(/_/g, ' ') || 'Attachment'}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="text-xs text-slate-600">
      {action} on {entity_type}
    </div>
  );
};