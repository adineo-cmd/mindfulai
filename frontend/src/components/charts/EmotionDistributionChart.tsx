import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { apiRequest } from '../../lib/apiClient';

const COLORS = ['#527f52', '#7a5499', '#bca994', '#9bbd9b', '#d4c8b8'];

interface EmotionData {
  name: string;
  value: number;
}

export default function EmotionDistributionChart() {
  const [source, setSource] = useState<'all' | 'text' | 'facial'>('all');
  const [data, setData] = useState<EmotionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Call the specific endpoint based on selected source
        const endpoint = source === 'text' 
          ? '/api/mood/emotions/text'
          : source === 'facial'
          ? '/api/mood/emotions/facial'
          : '/api/mood/emotions';
          
        const res = await apiRequest<{ status: string; data: EmotionData[] }>(endpoint);
        setData(res.data || []);
      } catch (err) {
        console.error('Failed to fetch emotion distribution:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [source]);

  if (loading) {
    return (
      <div className="card h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
        <p className="text-sm text-cream3 mt-2">Loading emotions...</p>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-cream">Emotion Distribution</h3>
        <div className="flex gap-2 bg-bg3 rounded-lg p-1">
          <button
            onClick={() => setSource('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              source === 'all' ? 'bg-green text-amber2' : 'text-cream3 hover:text-cream'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSource('text')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              source === 'text' ? 'bg-green text-amber2' : 'text-cream3 hover:text-cream'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setSource('facial')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              source === 'facial' ? 'bg-green text-amber2' : 'text-cream3 hover:text-cream'
            }`}
          >
            Facial
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px]">
        {data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-cream3">
            <svg className="h-12 w-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium">No emotion data yet</p>
            <p className="text-xs mt-1">
              {source === 'text' 
                ? 'Start journaling to see text-based emotion insights!'
                : source === 'facial'
                ? 'Use the camera to see facial emotion analysis!'
                : 'Start using the app to see emotion insights!'}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(30, 25, 20, 0.95)',
                  border: '1px solid rgba(255, 200, 120, 0.15)',
                  borderRadius: '8px',
                  color: '#FFE4C4'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-xs text-cream3">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}