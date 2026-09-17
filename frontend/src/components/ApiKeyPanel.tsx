import { useState, useEffect } from 'react';
import { KeyRound, Check, Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey } from '../lib/api';

interface ApiKeyPanelProps {
  onKeyChange: (newKey: string) => void;
  onRefreshLeads?: () => void;
  isLoading?: boolean;
}

export const ApiKeyPanel: React.FC<ApiKeyPanelProps> = ({
  onKeyChange,
  onRefreshLeads,
  isLoading = false,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const existing = getStoredApiKey();
    if (existing) {
      setApiKey(existing);
      setIsSaved(true);
    }
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = apiKey.trim();
    if (trimmed) {
      setStoredApiKey(trimmed);
      setIsSaved(true);
      onKeyChange(trimmed);
      setStatusMessage('Key saved to session storage');
    } else {
      clearStoredApiKey();
      setIsSaved(false);
      onKeyChange('');
      setStatusMessage('Key cleared');
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleClear = () => {
    setApiKey('');
    clearStoredApiKey();
    setIsSaved(false);
    onKeyChange('');
    setStatusMessage('Key cleared');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleUseDefault = () => {
    const defaultKey = 'mindclub-crm-secret-key-2026';
    setApiKey(defaultKey);
    setStoredApiKey(defaultKey);
    setIsSaved(true);
    onKeyChange(defaultKey);
    setStatusMessage('Configured with live demo key');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="bg-white/70 backdrop-blur-md border border-black/5 rounded-3xl p-6 max-w-md shadow-sm transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-neutral-800">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">API Access Key</h3>
            <p className="text-xs text-neutral-500">Authorization Bearer token for protected APIs</p>
          </div>
        </div>

        {isSaved ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Saved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Unsaved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setIsSaved(false);
            }}
            placeholder="Enter Bearer API secret key"
            autoComplete="off"
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-black/10 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 transition-all font-mono tracking-tight"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 transition-colors"
            title={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2.5 text-neutral-900 text-sm font-medium group bg-neutral-100 hover:bg-neutral-200/80 px-4 py-2 rounded-full transition-all border border-black/5"
            >
              <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:scale-105">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>Save Key</span>
            </button>

            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>

          {onRefreshLeads && isSaved && (
            <button
              type="button"
              onClick={onRefreshLeads}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-black font-medium transition-colors"
              title="Refresh leads list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          )}
        </div>

        {statusMessage && (
          <div className="text-xs text-emerald-600 flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Preset key available:</span>
          <button
            type="button"
            onClick={handleUseDefault}
            className="text-neutral-900 hover:underline font-medium"
          >
            Fill Demo Key
          </button>
        </div>
      </form>
    </div>
  );
};
