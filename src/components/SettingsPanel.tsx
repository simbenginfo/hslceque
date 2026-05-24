/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings, Check, AlertCircle, RefreshCw, Radio, Link2, Globe, Database, HelpCircle } from 'lucide-react';
import { AppScriptService } from '../services/api';

interface SettingsPanelProps {
  onConfigChange: () => void;
  currentMode: 'live' | 'demo';
  currentUrl: string;
}

export default function SettingsPanel({ onConfigChange, currentMode, currentUrl }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setUrlInput(currentUrl);
  }, [currentUrl]);

  const handleSave = () => {
    AppScriptService.setWebAppUrl(urlInput.trim());
    if (urlInput.trim()) {
      AppScriptService.setMode('live');
    } else {
      AppScriptService.setMode('demo');
    }
    setTestResult(null);
    onConfigChange();
  };

  const handleToggleMode = (mode: 'live' | 'demo') => {
    if (mode === 'live' && !AppScriptService.getWebAppUrl()) {
      setTestResult({
        success: false,
        message: 'Please provide an Apps Script Web App URL before switching to Live Sync mode.'
      });
      return;
    }
    AppScriptService.setMode(mode);
    setTestResult(null);
    onConfigChange();
  };

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setTestResult({ success: false, message: 'URL field is empty. Paste your Google Web App URL first.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Direct testing url
      const testUrl = `${urlInput.trim()}?action=subjects`;
      const response = await fetch(testUrl, { redirect: 'follow' });
      const json = await response.json();

      if (json.success) {
        setTestResult({
          success: true,
          message: `Success! Successfully loaded ${json.data.subjects?.length || 0} subjects from your Google Sheet.`
        });
        // Auto save on successful connection test!
        AppScriptService.setWebAppUrl(urlInput.trim());
        AppScriptService.setMode('live');
        onConfigChange();
      } else {
        setTestResult({
          success: false,
          message: json.error || 'Server responded with success: false. Please check your sheet tabs configuration.'
        });
      }
    } catch (err: any) {
      console.error('Connection test failed:', err);
      // Let's provide a helpful breakdown of potential Apps Script issues
      setTestResult({
        success: false,
        message: 'Network check failed. Ensure you deployed your Web App with Access: "Anyone" and authorized permissions. CORS transfers are supported.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-sm overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left font-sans font-medium text-amber-50 hover:bg-amber-500/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-sm">
            <Settings className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-serif italic text-amber-50 tracking-wide">Database & Connection Management</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Currently using: {currentMode === 'live' ? (
                <span className="text-amber-500 font-bold font-mono">Live Google Sheets Sync</span>
              ) : (
                <span className="text-amber-300 font-bold font-mono">High-Fidelity Demo Database</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentMode === 'live' ? (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-amber-300"></span>
          )}
          <span className="text-xs font-mono text-gray-500 uppercase bg-[#0a0a0a] px-2 py-0.5 rounded-sm border border-[#222]">
            {currentMode}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-[#222] bg-[#0d0d0d] space-y-5 rounded-sm">
          {/* Top Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Demo Mode Button */}
            <button
              onClick={() => handleToggleMode('demo')}
              className={`p-4 rounded-sm border text-left transition-all duration-250 ${
                currentMode === 'demo'
                  ? 'bg-amber-950/20 border-amber-500/60 shadow-md'
                  : 'bg-[#0a0a0a] border-[#222] hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <Database className={`w-4 h-4 ${currentMode === 'demo' ? 'text-amber-500' : 'text-gray-500'}`} />
                <span className="font-serif italic text-sm text-amber-50">Local Demo Database</span>
              </div>
              <p className="text-xs text-gray-400 leading-normal font-sans">
                Perfect for quick, latency-free testing. Features pre-loaded subjects like Mathematics and Science, with sample HSLC questions.
              </p>
            </button>

            {/* Live Mode Button */}
            <button
              onClick={() => handleToggleMode('live')}
              className={`p-4 rounded-sm border text-left transition-all duration-250 ${
                currentMode === 'live'
                  ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                  : 'bg-[#0a0a0a] border-[#222] hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <Globe className={`w-4 h-4 ${currentMode === 'live' ? 'text-amber-500' : 'text-gray-500'}`} />
                <span className="font-serif italic text-sm text-amber-50">Live Custom Sheet Integration</span>
              </div>
              <p className="text-xs text-gray-400 leading-normal font-sans">
                Powers real database reads/writes of HSLC questions directly on your active Google Sheet via Google Apps Script.
              </p>
            </button>
          </div>

          {/* Web App URL Form */}
          <div className="space-y-4 bg-[#0a0a0a] p-4 rounded-sm border border-[#222] animate-fadeIn">
            <label className="block text-xs font-mono font-medium text-gray-400">
              Google Apps Script Web App Deployment URL:
            </label>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-600">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfy.../exec"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-[#060606] pl-9 pr-4 py-2 border border-[#222] rounded-sm font-mono text-xs text-gray-300 placeholder-gray-650 focus:outline-none focus:border-amber-500"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 bg-[#161616] border border-[#222] hover:border-amber-500/30 text-gray-200 text-xs font-bold uppercase tracking-widest rounded-sm flex items-center gap-1.5 transition-colors font-sans max-sm:flex-1 justify-center"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Test Status
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-widest rounded-sm flex items-center gap-1 transition-colors max-sm:flex-1 justify-center"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Config
                </button>
              </div>
            </div>

            {/* Test Results Banner */}
            {testResult && (
              <div className={`mt-3 p-3.5 rounded-sm flex items-start gap-2.5 transition-all text-xs border ${
                testResult.success 
                  ? 'bg-amber-950/20 border-amber-900/50 text-amber-200' 
                  : 'bg-rose-950/20 border-rose-900/50 text-rose-300'
              }`}>
                {testResult.success ? (
                  <Check className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" />
                )}
                <div className="leading-relaxed font-sans">{testResult.message}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
