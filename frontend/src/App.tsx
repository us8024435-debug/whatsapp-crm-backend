import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  RefreshCw,
  Server,
} from 'lucide-react';
import {
  fetchLeads,
  getStoredApiKey,
  setStoredApiKey,
  checkBackendHealth,
  ApiError,
  API_BASE_URL,
} from './lib/api';
import type { Lead } from './lib/api';
import { ApiKeyPanel } from './components/ApiKeyPanel';
import { SummaryCards } from './components/SummaryCards';
import { DemoInboundForm } from './components/DemoInboundForm';
import { LeadList } from './components/LeadList';

export default function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  // Initialize API key and check server health
  useEffect(() => {
    const stored = getStoredApiKey();
    if (stored) {
      setApiKey(stored);
    }

    // Ping live backend health
    checkBackendHealth()
      .then((res) => setBackendHealthy(res.ok))
      .catch(() => setBackendHealthy(false));
  }, []);

  // Fetch leads handler
  const loadLeads = useCallback(
    async (keyToUse?: string) => {
      const activeKey = keyToUse !== undefined ? keyToUse : apiKey;

      if (!activeKey.trim()) {
        setLeads([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetched = await fetchLeads(activeKey);
        setLeads(fetched);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to fetch leads from backend.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey]
  );

  // Trigger fetch whenever apiKey updates (if key is present)
  useEffect(() => {
    if (apiKey.trim()) {
      loadLeads(apiKey);
    }
  }, [apiKey, loadLeads]);

  // Handle lead updated inline
  const handleLeadUpdated = (updatedLead: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l)));
  };

  // Helper to quickly fill default key from leadlist
  const handleSetDefaultKey = () => {
    const defaultKey = 'mindclub-crm-secret-key-2026';
    setApiKey(defaultKey);
    setStoredApiKey(defaultKey);
    loadLeads(defaultKey);
  };

  return (
    <section className="bg-[#F5F5F5] px-6 py-16 md:py-24 min-h-screen text-neutral-900 selection:bg-neutral-200">
      <div className="max-w-[88rem] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Intro & API Configuration                    */}
        {/* ========================================================= */}
        <div className="space-y-8 lg:sticky lg:top-12">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-500 bg-black/5 px-3 py-1 rounded-full">
                MindClub CRM
              </span>
              
              {backendHealthy !== null && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    backendHealthy
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  }`}
                  title={API_BASE_URL}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      backendHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <Server className="w-3 h-3" />
                  {backendHealthy ? 'Backend Live' : 'Backend Connecting...'}
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-black leading-[1.08]">
              WhatsApp CRM Dashboard
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 font-light leading-relaxed max-w-xl">
              Capture WhatsApp-style enquiries, create leads, save customer messages, and manage
              follow-ups from one clean CRM workspace.
            </p>
          </div>

          {/* Quick Action Link / Button in fintech style */}
          <div>
            <button
              type="button"
              onClick={() => loadLeads()}
              disabled={isLoading || !apiKey.trim()}
              className="inline-flex items-center gap-3 text-black text-base font-medium group disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center group-hover:bg-white transition-colors border border-black/5 shadow-xs">
                <RefreshCw className={`w-4 h-4 text-neutral-800 ${isLoading ? 'animate-spin' : ''}`} />
              </span>
              <span className="group-hover:translate-x-0.5 transition-transform">
                {isLoading ? 'Refreshing CRM data...' : 'Refresh lead workspace'}
              </span>
            </button>
          </div>

          {/* API Key Panel */}
          <ApiKeyPanel
            onKeyChange={(newKey) => {
              setApiKey(newKey);
              if (newKey.trim()) {
                loadLeads(newKey);
              }
            }}
            onRefreshLeads={() => loadLeads()}
            isLoading={isLoading}
          />

          {/* Environment & Backend Connection Info */}
          <div className="p-5 rounded-3xl bg-white/40 border border-black/5 text-xs text-neutral-500 space-y-2 max-w-md">
            <div className="flex items-center justify-between font-mono text-[11px] text-neutral-700">
              <span className="text-neutral-400">Endpoint:</span>
              <a
                href={`${API_BASE_URL}/health`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline text-neutral-900 truncate max-w-[220px]"
                title={API_BASE_URL}
              >
                whatsapp-crm-backend-1-8j7r.onrender.com
              </a>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Environment:</span>
              <span className="font-medium text-neutral-800">Production / Render Docker</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Active Authentication:</span>
              <span className="font-medium text-neutral-800">
                {apiKey.trim() ? 'Bearer Token configured' : 'Awaiting Secret Key'}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Large Rounded CRM Workspace Card             */}
        {/* ========================================================= */}
        <div className="relative rounded-3xl overflow-hidden min-h-[720px] bg-white border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="relative z-10 p-8 md:p-10 lg:p-12 space-y-8">
            {/* Right Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-black/5 pb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-black">
                  Live CRM Workspace
                </h2>
                <p className="text-sm md:text-base text-neutral-500 mt-1 max-w-lg">
                  Test inbound enquiries, review new leads, and update lead status from your deployed
                  WhatsApp CRM backend.
                </p>
              </div>

              {/* Status pill button */}
              <button
                type="button"
                onClick={() => loadLeads()}
                disabled={isLoading}
                className="inline-flex items-center gap-3 text-black text-sm font-medium group shrink-0"
              >
                <span className="w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center group-hover:bg-white transition-colors border border-black/10 shadow-xs">
                  <ArrowRight className="w-4 h-4 text-neutral-800 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="hidden sm:inline">Sync Live</span>
              </button>
            </div>

            {/* 1. Summary Cards (Total, New, Contacted, Converted) */}
            <div>
              <SummaryCards leads={leads} isLoading={isLoading} />
            </div>

            {/* 2. Demo Inbound Simulator Form */}
            <div>
              <DemoInboundForm onSuccess={() => loadLeads()} />
            </div>

            {/* 3. Lead Records List with status change, filters, and all states */}
            <div>
              <LeadList
                leads={leads}
                isLoading={isLoading}
                error={error}
                apiKey={apiKey}
                onRefresh={() => loadLeads()}
                onLeadUpdated={handleLeadUpdated}
                onUseDefaultKey={handleSetDefaultKey}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
