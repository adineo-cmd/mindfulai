import React, { useEffect, useState } from 'react';
import { Loader2, Grid3x3 } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface HeatmapData {
  day: string;
  week: number; // 0 = current week, 1 = last week, etc.
  value: number; // 1-5 mood score
}

const getColor = (value: number) => {
  // 0 = no data (slate), 1-5 = mood scale
  const colors = ['bg-slate-100', 'bg-plum-200', 'bg-plum-300', 'bg-sage-300', 'bg-sage-500'];
  return colors[value - 1] || 'bg-slate-100';
};

export default function MoodHeatmap() {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real data from the backend
        const response = await api.getHeatmapData();
        setData(response.data || []);
      } catch (err) {
        console.error('Failed to fetch heatmap data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Display weeks from oldest (left) to newest (right)
  const weeks = [3, 2, 1, 0]; 

  // Helper to find the mood value for a specific day and week
  const getValue = (day: string, week: number) => {
    const entry = data.find(d => d.day === day && d.week === week);
    return entry ? entry.value : 0; // 0 means no data for that day
  };

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Weekly Mood Heatmap</h3>
      
      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading heatmap...
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
          <Grid3x3 className="h-8 w-8 opacity-50" />
          <p className="text-xs text-center">No mood logs in the last 4 weeks.<br />Start journaling to see your patterns!</p>
        </div>
      ) : (
        <>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {/* Y-Axis: Days of the week */}
            <div className="flex flex-col justify-between py-1 text-xs text-slate-400 font-medium">
              {days.map(d => (
                <div key={d} className="h-8 flex items-center">{d}</div>
              ))}
            </div>
            
            {/* Grid: Columns = Weeks, Rows = Days */}
            <div 
              className="grid gap-2 flex-1 min-w-[200px]" 
              style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
            >
              {/* FIX: Iterate Days (rows) then Weeks (columns) so Y-axis labels align correctly */}
              {days.map(day => 
                weeks.map(week => {
                  const val = getValue(day, week);
                  return (
                    <div 
                      key={`${week}-${day}`} 
                      className={`h-8 rounded-md ${getColor(val)} transition-all hover:scale-105 cursor-pointer`}
                      title={`${day} (Week ${week}): Mood ${val > 0 ? val + '/5' : 'No data'}`}
                    />
                  );
                })
              )}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-end text-xs text-slate-500">
            <span>Low</span>
            {[1, 2, 3, 4, 5].map(v => (
              <div key={v} className={`w-4 h-4 rounded ${getColor(v)}`} />
            ))}
            <span>High</span>
          </div>
        </>
      )}
    </div>
  );
}