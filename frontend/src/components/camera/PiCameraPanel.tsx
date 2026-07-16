import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Activity, AlertCircle, Camera, Radio } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface EmotionData {
  emotion: string;
  confidence: number;
  timestamp: number;
}

export default function PiCameraPanel() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('Waiting...');
  const [confidence, setConfidence] = useState<number>(0);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const [error, setError] = useState<string>('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll the backend REST API every 2 seconds
  const startPolling = () => {
    setError('');
    setIsConnected(true);
    
    const fetchLatest = async () => {
      try {
        const res = await api.getLatestPiEmotion();
        if (res.status === 'success' && res.data) {
          const data = res.data;
          
          if (data.is_active && data.emotion !== 'Waiting for Pi Camera...') {
            setCurrentEmotion(data.emotion);
            setConfidence(data.confidence || 0);
            
            // Add to history (avoid duplicates)
            setEmotionHistory(prev => {
              const latest = prev[0];
              if (latest && latest.emotion === data.emotion && latest.confidence === data.confidence) {
                return prev; // Skip duplicate
              }
              return [
                {
                  emotion: data.emotion,
                  confidence: data.confidence || 0,
                  timestamp: Date.now()
                },
                ...prev.slice(0, 9)
              ];
            });
          } else {
            setCurrentEmotion('Waiting for Pi Camera...');
            setConfidence(0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch Pi emotion:', err);
        setError('Cannot reach backend. Is it running?');
      }
    };
    
    // Fetch immediately
    fetchLatest();
    
    // Then poll every 2 seconds
    pollIntervalRef.current = setInterval(fetchLatest, 2000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsConnected(false);
    setCurrentEmotion('Waiting...');
    setConfidence(0);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const getEmotionColor = (emotion: string) => {
    const lower = emotion.toLowerCase();
    if (lower.includes('happy') || lower.includes('joy')) return 'text-green';
    if (lower.includes('sad') || lower.includes('fear')) return 'text-red';
    if (lower.includes('angry')) return 'text-[#e08080]';
    if (lower.includes('neutral')) return 'text-amber';
    return 'text-cream';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isConnected ? 'bg-green/20' : 'bg-bg3'
            }`}>
              {isConnected ? (
                <Radio className="h-6 w-6 text-green animate-pulse" />
              ) : (
                <Camera className="h-6 w-6 text-cream3" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-cream">Raspberry Pi 3B+</h3>
              <p className="text-xs text-cream3">CSI Camera Module • Edge AI Processing</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green/20 text-green border border-green/30' 
              : 'bg-bg3 text-cream3 border border-[rgba(255,200,120,0.10)]'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Monitoring
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Offline
              </>
            )}
          </div>
        </div>

        {!isConnected ? (
          <button
            onClick={startPolling}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Wifi className="h-4 w-4" />
            Start Monitoring
          </button>
        ) : (
          <button
            onClick={stopPolling}
            className="btn-danger w-full flex items-center justify-center gap-2"
          >
            <WifiOff className="h-4 w-4" />
            Stop Monitoring
          </button>
        )}
      </div>

      {/* Live Emotion Display */}
      {isConnected && (
        <div className="card text-center py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green/5 to-amber/5 pointer-events-none"></div>
          <div className="relative z-10">
            <Activity className={`h-20 w-20 mx-auto mb-6 ${
              currentEmotion !== 'Waiting for Pi Camera...' ? 'text-green animate-pulse' : 'text-cream3'
            }`} />
            <p className="text-xs uppercase tracking-widest text-cream3 mb-3">
              Live AI Analysis
            </p>
            <h2 className={`text-7xl font-display font-light mb-4 ${getEmotionColor(currentEmotion)}`}>
              {currentEmotion}
            </h2>
            {confidence > 0 && (
              <p className="text-base text-cream2">
                Confidence:{' '}
                <span className="text-amber font-semibold">
                  {(confidence * 100).toFixed(1)}%
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Emotion History */}
      {emotionHistory.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-cream mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Detections
          </h3>
          
          <div className="space-y-2">
            {emotionHistory.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg3 border border-[rgba(255,200,120,0.05)]"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${getEmotionColor(entry.emotion)}`}>
                    {entry.emotion}
                  </span>
                  <span className="text-xs text-cream3">
                    {(entry.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-cream3">
                  {formatTime(entry.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red/10 border border-red/30 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#e08080] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#e08080] font-medium">Connection Error</p>
            <p className="text-xs text-cream3 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="disclaimer">
        <p className="text-sm text-cream3">
          <strong className="text-amber">Setup Instructions:</strong>
        </p>
        <ol className="text-xs text-cream3 mt-2 space-y-1 list-decimal list-inside">
          <li>Ensure your Raspberry Pi is powered on and connected to the same network</li>
          <li>Run <code className="text-amber bg-bg3 px-1.5 py-0.5 rounded">python3 edge_camera.py</code> on the Pi</li>
          <li>The Pi will automatically connect to your backend and start streaming</li>
          <li>Click "Start Monitoring" above to view the live analysis</li>
        </ol>
      </div>

      {/* Architecture Info */}
      <div className="card bg-bg2 border-[rgba(255,200,120,0.15)]">
        <h3 className="text-sm font-semibold text-cream mb-3">🔧 Technical Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-cream3 mb-1">Edge Device</p>
            <p className="text-cream font-medium">Raspberry Pi 3B+</p>
            <p className="text-cream3">CSI Camera Module</p>
          </div>
          <div>
            <p className="text-cream3 mb-1">Processing</p>
            <p className="text-cream font-medium">Edge-to-Server</p>
            <p className="text-cream3">REST API Polling</p>
          </div>
          <div>
            <p className="text-cream3 mb-1">AI Models</p>
            <p className="text-cream font-medium">ViT + OpenCV</p>
            <p className="text-cream3">HuggingFace</p>
          </div>
        </div>
      </div>
    </div>
  );
}