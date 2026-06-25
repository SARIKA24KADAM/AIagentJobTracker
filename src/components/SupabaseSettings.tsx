import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Key, Database, Zap, HelpCircle } from 'lucide-react';
import { getSavedConfig, saveConfig, getConnectionMode, setConnectionMode, resetSupabaseClient } from '../supabase';
import { SupabaseConfig } from '../types';

interface SupabaseSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onModeChanged: () => void;
}

export default function SupabaseSettings({ isOpen, onClose, onModeChanged }: SupabaseSettingsProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [mode, setMode] = useState<'live' | 'sandbox'>('sandbox');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = getSavedConfig();
    if (saved) {
      setUrl(saved.url);
      setAnonKey(saved.anonKey);
    }
    setMode(getConnectionMode());
    setStatusMessage(null);
  }, [isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'live') {
      if (!url.trim() || !anonKey.trim()) {
        setStatusMessage('❌ Error: Both URL and Anon Key are required for Live mode.');
        return;
      }
      if (!url.trim().startsWith('https://')) {
        setStatusMessage('❌ Error: Supabase URL must start with https://');
        return;
      }

      saveConfig({
        url: url.trim(),
        anonKey: anonKey.trim()
      });
      setConnectionMode('live');
    } else {
      setConnectionMode('sandbox');
    }

    resetSupabaseClient();
    onModeChanged();
    setStatusMessage('✅ Connection settings saved successfully! Page reloading state.');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleClear = () => {
    saveConfig(null);
    setConnectionMode('sandbox');
    setMode('sandbox');
    setUrl('');
    setAnonKey('');
    resetSupabaseClient();
    onModeChanged();
    setStatusMessage('🧹 Cleared custom keys. Returned to local Sandbox mode.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col"
        id="supabase-settings-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4.5">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <h2 className="font-display text-base font-bold text-gray-900">
              Database Connection Engine
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            id="settings-close-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Toggle Mode */}
          <div className="space-y-1.5">
            <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Connection Mode</span>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setMode('sandbox')}
                className={`rounded-md py-2 text-center text-xs font-bold transition-all ${mode === 'sandbox' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                id="mode-toggle-sandbox"
              >
                Local Sandbox Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`rounded-md py-2 text-center text-xs font-bold transition-all ${mode === 'live' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                id="mode-toggle-live"
              >
                Live Supabase Mode
              </button>
            </div>
          </div>

          {/* Description of current mode */}
          {mode === 'sandbox' ? (
            <div className="rounded-lg bg-amber-50 p-3.5 border border-amber-100 text-amber-900 space-y-1.5 text-xs">
              <span className="font-bold flex items-center space-x-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Sandbox Mode (Zero Config)</span>
              </span>
              <p className="leading-relaxed text-amber-800">
                Data is isolated within your local browser sandbox (localStorage) and simulates exact Supabase behavior, schema logic, and auth states. Perfect for testing and demoing without creating a real database.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-indigo-50 p-3.5 border border-indigo-100 text-indigo-950 space-y-1 text-xs">
                <span className="font-bold flex items-center space-x-1.5">
                  <Database className="h-4 w-4 text-indigo-500" />
                  <span>Real-Time Database Sync</span>
                </span>
                <p className="leading-relaxed text-indigo-800">
                  Connect directly to your Supabase project. We never store your credentials server-side; they remain securely in your local browser instance to connect straight to your project endpoints.
                </p>
              </div>

              {/* Supabase URL */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Supabase URL</label>
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyz.supabase.co"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-8 text-xs font-mono focus:border-blue-500 focus:outline-none"
                    id="settings-url-input"
                  />
                  <Database className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>

              {/* Anon API key */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Supabase Anon API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-8 text-xs font-mono focus:border-blue-500 focus:outline-none"
                    id="settings-key-input"
                  />
                  <Key className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="text-xs font-medium p-2.5 rounded-lg border bg-gray-50 text-gray-700 text-center">
              {statusMessage}
            </div>
          )}

          {/* Buttons Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-gray-400 hover:text-red-500 hover:underline"
              id="settings-reset-button"
            >
              Reset to Defaults
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                id="settings-cancel-button"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
                id="settings-save-button"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
