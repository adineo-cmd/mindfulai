import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Loader2, PieChart as PieChartIcon } from 'lucide-react';
import { api } from '../../lib/apiClient';

const COLORS = ['#527f52', '#7a5499', '#bca994', '#9bbd9b', '#d4c8b8', '#6b8e6b', '#8b6ba3'];

interface EmotionData {
  name: string;
  value: number;
}

export default function EmotionDistributionChart() {
  const [data, setData] = useState<EmotionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.getEmotionDistribution();
        // Backend returns { status: "success", data: [...] }
        // Assuming apiClient unwraps this, otherwise use response.data.data
        setData(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch emotion distribution:', err);
        setError('Unable to load emotion data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="card h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Emotion Distribution</h3>
      
      <div className="flex-1 min-h-[250px] flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-xs">Loading emotions...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <PieChartIcon className="h-8 w-8 opacity-50" />
            <p className="text-xs text-center">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <PieChartIcon className="h-8 w-8 opacity-50" />
            <p className="text-xs text-center">No emotion data yet.<br />Start journaling to see insights!</p>
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
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }} 
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}