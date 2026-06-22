import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { api } from '../../lib/apiClient';

export default function ExportButtons() {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(format);
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
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex gap-3">
      <button 
        onClick={() => handleExport('csv')} 
        disabled={isExporting !== null}
        className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
      >
        {isExporting === 'csv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Export CSV
      </button>
      <button 
        onClick={() => handleExport('pdf')} 
        disabled={isExporting !== null}
        className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
      >
        {isExporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Export PDF
      </button>
    </div>
  );
}