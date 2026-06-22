import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, BookOpen } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface JournalEntry {
  id: number;
  mood_score: number;
  note: string;
  created_at: string;
}

export default function Journal() {
  // Form State
  const [mood, setMood] = useState(3);
  const [entry, setEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // History State
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch real journal history on load
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.getJournalHistory();
        setHistory(res.data || []);
      } catch (err) {
        console.error('Failed to fetch journal history', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  // Handle form submission via API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop standard HTML form submission!
    if (!entry.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      // FIX: Sends JSON and includes the JWT token automatically!
      await api.submitJournal({ 
        mood_score: mood, 
        note: entry 
      });
      
      setSuccessMsg('Entry saved successfully. Thank you for sharing.');
      setEntry(''); // Clear textarea
      setMood(3);  // Reset slider

      // Refresh the history list
      const res = await api.getJournalHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to save journal entry', err);
      setSuccessMsg('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format dates nicely
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Daily Journal</h1>
      
      {/* Journal Form */}
      <div className="card mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="mood" className="block text-sm font-medium text-slate-700 mb-2">
              How are you feeling right now? (1-5)
            </label>
            <input 
              type="range" 
              id="mood" 
              value={mood} 
              onChange={(e) => setMood(parseInt(e.target.value))}
              min="1" 
              max="5" 
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sage-600" 
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Very Low</span>
              <span>Neutral</span>
              <span>Very High</span> {/* FIX: Added missing > */}
            </div>
          </div>
          
          <div>
            <label htmlFor="entry" className="block text-sm font-medium text-slate-700 mb-2">
              What's on your mind?
            </label>
            <textarea 
              id="entry" 
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              rows={5} 
              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-sage-500 focus:ring-sage-500 text-sm p-3" 
              placeholder="Take your time. There's no right or wrong way to write this."
            />
          </div>

          {successMsg && (
            <div className={`text-sm p-3 rounded-lg ${successMsg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-sage-50 text-sage-700'}`}>
              {successMsg}
            </div>
          )}

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting || !entry.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Entries History */}
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Entries</h2>
      
      {loadingHistory ? (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading history...
        </div>
      ) : history.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-slate-400">
          <BookOpen className="h-10 w-10 opacity-50 mb-3" />
          <p className="text-sm">No journal entries yet. Write your first one above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(entry => (
            <div key={entry.id} className="card flex gap-4">
              <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full bg-sage-100 text-sage-700 font-bold text-sm">
                {entry.mood_score}/5
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{formatDate(entry.created_at)}</p>
                <p className="text-sm text-slate-800">{entry.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}