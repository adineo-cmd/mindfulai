import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';

interface Metric {
  title: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down' | 'neutral';
}

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([
    { title: 'Current Streak', value: '...', subtitle: 'Loading...', trend: 'neutral' },
    { title: 'Average Mood', value: '...', subtitle: 'Loading...', trend: 'neutral' },
    { title: 'Risk Indicator', value: '...', subtitle: 'Loading...', trend: 'neutral' }
  ]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch real data from the backend in parallel
        const [trendsRes, riskRes] = await Promise.all([
          api.getMoodTrends(7).catch(() => ({ data: [] })),
          api.getRiskScore(7).catch(() => ({ data: [] }))
        ]);

        const trends = trendsRes.data || [];
        
        // 1. Calculate Average Mood
        const avgMood = trends.length > 0 
          ? (trends.reduce((sum: number, t: any) => sum + t.mood, 0) / trends.length).toFixed(1) 
          : '0.0';

        // 2. Calculate Risk Indicator
        const risks = riskRes.data || [];
        const latestRisk = risks.length > 0 ? risks[risks.length - 1].score : 0;
        const riskLabel = latestRisk > 60 ? 'High' : latestRisk > 30 ? 'Medium' : 'Low';
        const riskTrend = latestRisk > 60 ? 'down' : 'up';

        // 3. Calculate Streak (FIXED: Count unique days in last 7 days)
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Filter trends to only last 7 days and count unique dates
        const recentTrends = trends.filter((t: any) => {
          const entryDate = new Date(t.date);
          return entryDate >= sevenDaysAgo;
        });
        
        // Get unique dates
        const uniqueDates = new Set(recentTrends.map((t: any) => {
          return new Date(t.date).toISOString().split('T')[0];
        }));
        
        const streak = uniqueDates.size;

        setMetrics([
          { title: 'Current Streak', value: `${streak} Days`, subtitle: 'Check-ins in the last 7 days', trend: streak > 0 ? 'up' : 'neutral' },
          { title: 'Average Mood', value: `${avgMood} / 5`, subtitle: 'Based on your recent logs', trend: parseFloat(avgMood) >= 3 ? 'up' : 'down' },
          { title: 'Risk Indicator', value: riskLabel, subtitle: 'Based on recent sentiment', trend: riskTrend }
        ]);
      } catch (err) {
        console.error('Failed to fetch metrics', err);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <>
      {metrics.map((m, i) => (
        <div key={i} className="card flex flex-col gap-2">
          <dt className="text-sm font-medium text-slate-500">{m.title}</dt>
          <dd className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900">{m.value}</span>
            {m.trend !== 'neutral' && (
              <span className={`text-sm font-medium ${m.trend === 'up' ? 'text-sage-600' : 'text-plum-600'}`}>
                {m.trend === 'up' ? '↑' : '↓'}
              </span>
            )}
          </dd>
          <dd className="text-xs text-slate-500">{m.subtitle}</dd>
        </div>
      ))}
    </>
  );
}