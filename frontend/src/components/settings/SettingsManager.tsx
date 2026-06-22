import React, { useState, useEffect } from 'react';
import { Loader2, Download, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface ConsentState {
  camera_consent: boolean;
  text_consent: boolean;
  analytics_consent: boolean;
}

export default function SettingsManager() {
  const [consent, setConsent] = useState<ConsentState>({
    camera_consent: true,
    text_consent: true,
    analytics_consent: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch initial consent state
  useEffect(() => {
    const fetchConsent = async () => {
      try {
        const res = await api.getConsent();
        if (res.data) {
          setConsent({
            camera_consent: res.data.camera_consent,
            text_consent: res.data.text_consent,
            analytics_consent: res.data.analytics_consent,
          });
        }
      } catch (err) {
        console.error('Failed to fetch consent', err);
      }
    };
    fetchConsent();
  }, []);

  // Handle Toggle Changes
  const handleToggle = async (key: keyof ConsentState, value: boolean) => {
    const newConsent = { ...consent, [key]: value };
    setConsent(newConsent); // Optimistic UI update
    
    setIsSaving(true);
    try {
      await api.updateConsent({ [key]: value });
      setMessage({ text: 'Preferences saved successfully.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to save preferences.', type: 'error' });
      setConsent(consent); // Revert on error
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Handle Data Export (PDF or CSV)
  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      // FIX: Call the specific function for the format
      const blob = format === 'pdf' 
        ? await api.exportPDF() as unknown as Blob 
        : await api.exportCSV() as unknown as Blob;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindfulai_wellness_report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage({ text: `Your ${format.toUpperCase()} report is downloading.`, type: 'success' });
    } catch (err) {
      console.error('Export failed', err);
      setMessage({ text: 'Failed to export data.', type: 'error' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Handle Data Deletion
  const handleDelete = async () => {
    if (!window.confirm("Are you absolutely sure? This will permanently delete all your journal entries, mood logs, and chat history. This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteData();
      setMessage({ text: 'All your data has been permanently deleted.', type: 'success' });
      localStorage.removeItem('access_token');
    } catch (err) {
      console.error('Deletion failed', err);
      setMessage({ text: 'Failed to delete data. Please try again.', type: 'error' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <>
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
          message.type === 'success' ? 'bg-sage-50 text-sage-800 border border-sage-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Data & Consent</h2>
        
        <div className="flex items-start justify-between gap-4 py-4 border-b border-slate-100">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-900">Local-Only Processing</span>
            <span className="text-xs text-slate-500">Process camera and text data on-device whenever possible. (Recommended)</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={consent.camera_consent && consent.text_consent}
              onChange={(e) => {
                handleToggle('camera_consent', e.target.checked);
                handleToggle('text_consent', e.target.checked);
              }}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sage-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage-600"></div>
          </label>
        </div>

        <div className="flex items-start justify-between gap-4 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-900">Anonymous Trend Analytics</span>
            <span className="text-xs text-slate-500">Allow anonymized, aggregated data to help improve the AI model for everyone.</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={consent.analytics_consent}
              onChange={(e) => handleToggle('analytics_consent', e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sage-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage-600"></div>
          </label>
        </div>
      </div>

      <div className="card border-red-100">
        <h2 className="text-lg font-semibold text-red-900 mb-4">Data Management</h2>
        <p className="text-sm text-slate-600 mb-6">
          You own your data. You can download a complete copy of your journal entries, mood logs, and chat history at any time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? 'Generating PDF...' : 'Export My Data (PDF)'}
          </button>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex-1 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            {isDeleting ? 'Deleting...' : 'Delete My Data Permanently'}
          </button>
        </div>
      </div>
    </>
  );
}