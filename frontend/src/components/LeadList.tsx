import { useState } from 'react';
import {
  Users,
  Phone,
  Calendar,
  KeyRound,
  AlertCircle,
  Clock,
  ChevronDown,
  Tag,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { updateLeadStatus, ApiError } from '../lib/api';
import type { Lead, LeadStatus } from '../lib/api';

interface LeadListProps {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  apiKey: string;
  onRefresh: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
  onUseDefaultKey?: () => void;
}

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  new: {
    label: 'New',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
  },
  contacted: {
    label: 'Contacted',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  interested: {
    label: 'Interested',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    border: 'border-purple-200',
  },
  follow_up_required: {
    label: 'Follow Up Required',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    border: 'border-orange-200',
  },
  converted: {
    label: 'Converted',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  closed: {
    label: 'Closed',
    bg: 'bg-neutral-100',
    text: 'text-neutral-600',
    dot: 'bg-neutral-400',
    border: 'border-neutral-200',
  },
};

const ALL_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'interested',
  'follow_up_required',
  'converted',
  'closed',
];

export const LeadList: React.FC<LeadListProps> = ({
  leads,
  isLoading,
  error,
  apiKey,
  onRefresh,
  onLeadUpdated,
  onUseDefaultKey,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setUpdatingId(leadId);
    setUpdateError(null);
    setStatusSuccess(null);

    try {
      const updated = await updateLeadStatus(leadId, newStatus, apiKey);
      onLeadUpdated(updated);
      setStatusSuccess(`Updated lead to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
      setTimeout(() => setStatusSuccess(null), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setUpdateError(err.message);
      } else {
        setUpdateError('Failed to update lead status.');
      }
      setTimeout(() => setUpdateError(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  // Filter leads by search and status
  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const nameMatch = lead.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = lead.contact?.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const titleMatch = lead.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && (searchQuery === '' || nameMatch || phoneMatch || titleMatch);
  });

  // State 1: Missing API Key State
  if (!apiKey.trim()) {
    return (
      <div className="bg-neutral-50/60 border border-neutral-200/80 rounded-3xl p-8 text-center my-4">
        <div className="w-12 h-12 rounded-full bg-black/5 mx-auto flex items-center justify-center text-neutral-800 mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-neutral-900 mb-1">
          Authorization Key Required
        </h3>
        <p className="text-sm text-neutral-500 max-w-md mx-auto mb-5">
          Enter your API secret key in the left panel to securely fetch and manage leads from your
          protected WhatsApp CRM backend.
        </p>

        {onUseDefaultKey && (
          <button
            type="button"
            onClick={onUseDefaultKey}
            className="inline-flex items-center gap-3 text-black text-sm font-medium group bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-full transition-all border border-black/5"
          >
            <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:scale-105">
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
            <span>Load with Default Demo Key</span>
          </button>
        )}
      </div>
    );
  }

  // State 2: Unauthorized API Key Error
  if (error && (error.toLowerCase().includes('unauthorized') || error.includes('401') || error.includes('403'))) {
    return (
      <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-8 text-center my-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 mx-auto flex items-center justify-center text-rose-600 mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-rose-950 mb-1">
          Unauthorized API Access
        </h3>
        <p className="text-sm text-rose-700 max-w-md mx-auto mb-4">
          The API key provided was not accepted by the backend server. Please verify the secret key entered in the left panel.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 text-sm text-rose-800 hover:text-rose-950 font-medium underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  // State 3: Generic Error State
  if (error && !leads.length && !isLoading) {
    return (
      <div className="bg-neutral-50/80 border border-neutral-200 rounded-3xl p-8 text-center my-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 mx-auto flex items-center justify-center text-rose-500 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-neutral-900 mb-1">
          Unable to Load Leads
        </h3>
        <p className="text-sm text-neutral-500 max-w-md mx-auto mb-4">
          {error}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filter controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neutral-500" />
          <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
            Lead Records ({filteredLeads.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black/10 transition-all w-36 sm:w-44"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black/10 transition-all cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {STATUS_CONFIG[st]?.label || st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications */}
      {statusSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{statusSuccess}</span>
        </div>
      )}

      {updateError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{updateError}</span>
        </div>
      )}

      {/* State 4: Loading Skeletons */}
      {isLoading && !leads.length && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-neutral-50/50 border border-neutral-200/60 rounded-2xl p-4 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-36 h-4 bg-neutral-200 rounded" />
                <div className="w-24 h-6 bg-neutral-200 rounded-full" />
              </div>
              <div className="w-48 h-3 bg-neutral-200 rounded" />
              <div className="w-full h-3 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* State 5: Empty Leads State */}
      {!isLoading && filteredLeads.length === 0 && (
        <div className="bg-neutral-50/50 border border-neutral-200/60 rounded-3xl p-8 text-center my-2">
          <div className="w-10 h-10 rounded-full bg-neutral-100 mx-auto flex items-center justify-center text-neutral-400 mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-1">
            {searchQuery || filterStatus !== 'all' ? 'No matching leads' : 'No CRM leads yet'}
          </h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Submit a message using the Inbound Simulator above to automatically generate your first WhatsApp lead.'}
          </p>
        </div>
      )}

      {/* Lead Cards List */}
      <div className="space-y-3">
        {filteredLeads.map((lead) => {
          const currentStatus = (lead.status as LeadStatus) || 'new';
          const statusMeta = STATUS_CONFIG[currentStatus] || {
            label: currentStatus,
            bg: 'bg-neutral-100',
            text: 'text-neutral-700',
            dot: 'bg-neutral-400',
            border: 'border-neutral-200',
          };
          const contactName = lead.contact?.name || 'Anonymous Contact';
          const contactPhone = lead.contact?.phone || 'No phone number';
          const isUpdating = updatingId === lead.id;

          return (
            <div
              key={lead.id}
              className="bg-neutral-50/60 hover:bg-neutral-50 border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-4 transition-all duration-150 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Contact name & phone */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-800 font-semibold text-sm shadow-xs">
                    {contactName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 tracking-tight leading-tight">
                      {contactName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      <span className="font-mono">{contactPhone}</span>
                      <span className="text-neutral-300">•</span>
                      <span className="text-[11px] capitalize text-neutral-400">{lead.source}</span>
                    </div>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative inline-block text-left">
                    <select
                      value={lead.status}
                      disabled={isUpdating}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-medium border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border} focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer disabled:opacity-50`}
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st} className="bg-white text-neutral-800">
                          {STATUS_CONFIG[st]?.label || st}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-2.5 top-2 pointer-events-none" />
                  </div>
                  {isUpdating && (
                    <div className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* Title and Notes */}
              {(lead.title || lead.notes) && (
                <div className="bg-white/90 border border-neutral-200/60 rounded-xl p-3 text-xs space-y-1.5">
                  {lead.title && (
                    <div className="flex items-center gap-1.5 font-medium text-neutral-800">
                      <Tag className="w-3 h-3 text-neutral-400" />
                      <span>{lead.title}</span>
                    </div>
                  )}
                  {lead.notes && (
                    <div className="flex items-start gap-1.5 text-neutral-600">
                      <FileText className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{lead.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer with timestamp */}
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-200/40">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(lead.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>ID: {lead.id.slice(0, 10)}...</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
