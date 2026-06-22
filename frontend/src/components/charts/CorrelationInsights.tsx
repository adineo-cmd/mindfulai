import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface Stat {
  label: string;
  val: number;
}

export default function CorrelationInsights() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getCorrelationData();
        const data = res.data;
        
        // Simple logic to calculate match rates
        // Map mood scores (1-5) to expected facial emotions
        const moodToEmotion: Record<number, string[]> = {
          1: ['sad', 'angry', 'fear'],
          2: ['sad', 'tense'],
          3: ['neutral'],
          4: ['happy', 'neutral'],
          5: ['happy', 'surprise']
        };

        let matches = 0;
        let total = 0;

        // Index facial emotions by date for quick lookup
        const facialByDate: Record<string, string> = {};
        data.facial.forEach((f: any) => { 
          facialByDate[f.date] = f.emotion.toLowerCase(); 
        });

        // Compare self-reported mood with facial emotion on the same day
        data.self_reported.forEach((m: any) => {
          const facialEmotion = facialByDate[m.date];
          if (facialEmotion) {
            total++;
            const expectedEmotions = moodToEmotion[m.mood] || [];
            if (expectedEmotions.includes(facialEmotion)) {
              matches++;
            }
          }
        });

        const matchRate = total > 0 ? Math.round((matches / total) * 100) : 0;
        const discrepancyRate = total > 0 ? 100 - matchRate : 0;

        setStats([
          { label: 'Self-reported mood matches facial expression', val: matchRate },
          { label: 'Discrepancy detected (Masking or different context)', val: discrepancyRate }
        ]);
      } catch (err) {
        console.error('Failed to fetch correlation data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Mood vs. Facial Emotion Correlation</h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Calculating correlation...
        </div>
      ) : stats.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">Not enough data to calculate correlation yet.</p>
      ) : (
        <div className="space-y-4">
          {/* FIX: Added the missing 'key' prop here */}
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-700">{stat.label}</span>
                <span className="font-medium text-slate-900">{stat.val}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-plum-500 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${stat.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs text-slate-500 mt-4 italic">
        Note: Discrepancies are normal and often indicate moments where we mask our true feelings. 
        This is a prompt for gentle self-reflection, not a cause for alarm.
      </p>
    </div>
  );
}