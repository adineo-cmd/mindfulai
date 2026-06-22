import React, { useRef, useState, useEffect } from 'react';
import { Video, VideoOff, AlertCircle } from 'lucide-react';

export default function WebcamPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // Hidden canvas for frame capture
  const wsRef = useRef<WebSocket | null>(null);      // WebSocket connection
  const frameIntervalRef = useRef<number | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [emotion, setEmotion] = useState<string>('Neutral');
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Cleanup on component unmount
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
        
        // Connect to the FastAPI WebSocket
        connectWebSocket();
      }
    } catch (err) {
      setError('Camera access denied or not available.');
    }
  };

  const connectWebSocket = () => {
    // Connect to the endpoint we built in facial_stream.py
    const ws = new WebSocket('ws://localhost:8000/ws/facial-emotion');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected to backend');
      startFrameCapture(); // Start sending frames once connected
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
    // Capture and send a frame every 1000ms (matches backend throttle)
    frameIntervalRef.current = window.setInterval(() => {
      if (videoRef.current && canvasRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        // Match canvas size to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to base64 JPEG (0.8 quality to save bandwidth)
          const base64Image = canvas.toDataURL('image/jpeg', 0.8);
          
          // Send to backend
          wsRef.current.send(base64Image);
        }
      }
    }, 1000);
  };

  const stopCamera = () => {
    // 1. Stop frame capture interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // 2. Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // 3. Stop camera hardware tracks
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
      {/* Hidden canvas used strictly for extracting frames in-memory */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Live Emotion Check</h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-red-600 animate-pulse' : 'bg-slate-400'}`} />
          {isActive ? 'Processing Locally' : 'Inactive'}
        </span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`h-full w-full object-cover ${!isActive ? 'opacity-50' : ''}`} 
        />
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <Video className="h-12 w-12 mb-2 opacity-50" />
            <span className="text-sm">Camera is off</span>
          </div>
        )}
        {isActive && (
          <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/60 backdrop-blur-sm p-3 text-white">
            <p className="text-xs text-slate-300 mb-1">Detected State</p>
            <div className="flex items-end justify-between">
                <p className="text-lg font-semibold">{emotion}</p>
                {confidence > 0 && <p className="text-xs text-slate-300">{Math.round(confidence * 100)}% confidence</p>}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-sage-50 p-3 text-xs text-sage-800 flex gap-2">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Privacy Notice:</strong> Video frames are processed locally and sent securely to our local AI. 
          Raw video is never saved or transmitted to external servers.
        </p>
      </div>

      <div className="flex gap-3">
        {!isActive ? (
          <button onClick={startCamera} className="btn-primary flex-1 gap-2">
            <Video className="h-4 w-4" /> Start Check-in
          </button>
        ) : (
          <button onClick={stopCamera} className="btn-secondary flex-1 gap-2 text-red-700 hover:bg-red-50 hover:border-red-200">
            <VideoOff className="h-4 w-4" /> Stop Camera
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  );
}