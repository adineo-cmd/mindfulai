import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface DataPoint {
  date: string;
  mood: number;
}

// Helper to format "YYYY-MM-DD" to "Oct 25"
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function MoodTrendChart() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getMoodTrends(days);
        // Assuming apiClient returns the data array directly
        setData(res.data || []); 
      } catch (err) {
        console.error('Failed to fetch mood trends:', err);
        setError('Unable to load mood trends');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Mood Trends</h3>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                days === d ? 'bg-white text-sage-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px] flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-xs">Loading trends...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <TrendingUp className="h-8 w-8 opacity-50" />
            <p className="text-xs text-center">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <TrendingUp className="h-8 w-8 opacity-50" />
            <p className="text-xs text-center">No mood logs in the last {days} days.<br />Start journaling to see your trends!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={formatDate} // FIX: Formats "2023-10-25" to "Oct 25"
              />
              <YAxis 
                domain={[1, 5]} 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                ticks={[1, 2, 3, 4, 5]} // FIX: Forces integer ticks (no 2.5 or 3.7)
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelFormatter={formatDate} // FIX: Formats date in the hover tooltip too
              />
              <Line 
                type="monotone" 
                dataKey="mood" 
                stroke="#527f52" 
                strokeWidth={3} 
                dot={{ fill: '#527f52', r: 4 }} 
                activeDot={{ r: 6, fill: '#3e633e' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}