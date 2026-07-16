import React, { useRef, useState, useEffect } from 'react';
import { Video, VideoOff, AlertCircle } from 'lucide-react';

export default function WebcamPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [emotion, setEmotion] = useState<string>('Neutral');
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        setError('');
        connectWebSocket();
      }
    } catch (err) {
      setError('Camera access denied or not available.');
    }
  };

  const connectWebSocket = () => {
    // 🔧 FIX: Dynamically construct WebSocket URL based on current hostname
    // This ensures it works when accessed from other devices on the network
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname;
    const wsUrl = `${wsProtocol}//${wsHost}:8000/ws/facial-emotion`;
    
    console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected to backend');
      startFrameCapture();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.emotion) {
          setEmotion(data.emotion);
          setConfidence(data.confidence);
        } else if (data.error) {
          setEmotion('No face detected');
          setConfidence(0);
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };

    ws.onerror = () => {
      setError('Connection to emotion analysis failed. Is the backend running?');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  const startFrameCapture = () => {
    frameIntervalRef.current = window.setInterval(() => {
      if (videoRef.current && canvasRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Image = canvas.toDataURL('image/jpeg', 0.8);
          wsRef.current.send(base64Image);
        }
      }
    }, 1000);
  };

  const stopCamera = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setEmotion('Neutral');
    setConfidence(0);
  };

  return (
    <div className="card flex flex-col gap-4">
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-cream">Live Emotion Check</h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isActive 
            ? 'bg-[rgba(106,158,106,0.2)] text-green border border-[rgba(106,158,106,0.3)]' 
            : 'bg-bg3 text-cream3 border border-[rgba(255,200,120,0.10)]'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-green animate-pulse' : 'bg-cream3'}`} />
          {isActive ? 'Processing Locally' : 'Inactive'}
        </span>
      </div>

      {/* Camera View */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900" style={{ minHeight: '400px' }}>  {/* Add minHeight */}
  <video
    ref={videoRef}
    autoPlay
    playsInline
    muted
    className={`h-full w-full object-cover ${!isActive ? 'opacity-50' : ''}`}
  />
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-cream3">
            <Video className="h-12 w-12 mb-2 opacity-50" />
            <span className="text-sm">Camera is off</span>
          </div>
        )}
      </div>

      {/* Emotion Display - BELOW the camera (not overlay) */}
      {isActive && (
        <div className="rounded-xl bg-bg2 border border-[rgba(255,200,120,0.15)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(255,187,106,0.15)] flex items-center justify-center">
                <span className="text-xl">🎭</span>
              </div>
              <div>
                <p className="text-xs text-cream3 mb-0.5">Detected Emotion</p>
                <p className="text-xl font-semibold text-amber">{emotion}</p>
              </div>
            </div>
            {confidence > 0 && (
              <div className="text-right">
                <p className="text-xs text-cream3 mb-0.5">Confidence</p>
                <p className="text-lg font-semibold text-green">{Math.round(confidence * 100)}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="disclaimer">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 inline-block mr-2" />
        <p className="inline">
          <strong className="text-amber">Privacy Notice:</strong> Video frames are processed locally and sent securely to our local AI. 
          Raw video is never saved or transmitted to external servers.
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isActive ? (
          <button onClick={startCamera} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Video className="h-4 w-4" /> Start Check-in
          </button>
        ) : (
          <button onClick={stopCamera} className="btn-danger flex-1 flex items-center justify-center gap-2">
            <VideoOff className="h-4 w-4" /> Stop Camera
          </button>
        )}
      </div>
      
      {error && <p className="text-xs text-[#e08080] text-center mt-2">{error}</p>}
    </div>
  );
}