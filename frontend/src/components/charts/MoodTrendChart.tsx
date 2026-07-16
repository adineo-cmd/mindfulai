import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface RawDataPoint {
  date: string;
  mood: number;
}

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function MoodTrendChart() {
  const [days, setDays] = useState(7);
  const [rawData, setRawData] = useState<RawDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // NEW: For tab switching
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (rawData.length > 0) {
        setIsRefreshing(true); // Show subtle loading when switching tabs
      } else {
        setLoading(true); // Initial load
      }
      setError(null);
      
      try {
        const res = await api.getMoodTrends(days);
        const data = res.data || res;
        setRawData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch mood trends:', err);
        setError('Unable to load mood trends');
        setRawData([]);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };
    fetchData();
  }, [days]);

  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const grouped: Record<string, { total: number; count: number; dateObj: Date }> = {};

    rawData.forEach((point) => {
      let dateKey = point.date;
      try {
        const d = new Date(point.date);
        if (!isNaN(d.getTime())) {
          dateKey = d.toISOString().split('T')[0];
        }
      } catch (e) {
        // Ignore
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = { total: 0, count: 0, dateObj: new Date(point.date) };
      }
      grouped[dateKey].total += point.mood;
      grouped[dateKey].count += 1;
    });

    const sortedEntries = Object.entries(grouped).sort((a, b) => {
      return new Date(a[1].dateObj).getTime() - new Date(b[1].dateObj).getTime();
    });

    return sortedEntries.map(([key, group]) => ({
      date: formatDateLabel(group.dateObj.toISOString()),
      mood: parseFloat((group.total / group.count).toFixed(1)),
    }));
  }, [rawData]);

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-cream">Mood Trends</h3>
        <div className="flex bg-bg3 rounded-lg p-1 border border-[rgba(255,200,120,0.10)]">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                days === d 
                  ? 'bg-card text-amber border border-[rgba(232,168,76,0.20)] shadow-sm' 
                  : 'text-cream3 hover:text-cream2 hover:bg-[rgba(255,200,120,0.05)]'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px] flex items-center justify-center relative">
        {/* Loading Overlay - Only shows when switching tabs */}
        {isRefreshing && (
          <div className="absolute inset-0 bg-[rgba(30,25,20,0.5)] flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-amber" />
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-cream3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-xs">Loading trends...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-cream3">
            <TrendingUp className="h-8 w-8 opacity-50" />
            <p className="text-xs text-center">{error}</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-cream3">
            <TrendingUp className="h-8 w-8 opacity-50" />
            <p className="text-xs text-center">No mood logs in the last {days} days.<br />Start journaling to see your trends!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,200,120,0.15)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#9c8a72" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                domain={[1, 5]} 
                stroke="#9c8a72" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                ticks={[1, 2, 3, 4, 5]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#241e17',
                  border: '1px solid rgba(255,200,120,0.15)',
                  borderRadius: '12px',
                  color: '#f5ead8',
                  fontSize: '0.875rem'
                }}
                labelStyle={{
                  color: '#f0c070',
                  fontWeight: 600
                }}
                itemStyle={{
                  color: '#d4c4a8'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="mood" 
                stroke="#6a9e6a" 
                strokeWidth={3} 
                dot={{ fill: '#6a9e6a', r: 4, stroke: '#1a1510', strokeWidth: 2 }} 
                activeDot={{ r: 6, fill: '#3d6b3d', stroke: '#f0c070', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}