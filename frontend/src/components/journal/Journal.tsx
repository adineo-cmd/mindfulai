import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, RefreshCw, Loader2, BookOpen, XCircle } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface Connector {
  name: string;
  icon: string;
  oauth_required: boolean;
}

interface ConnectedSource {
  id: number;
  source_type: string;
  source_name: string;
  is_connected: boolean;
  last_sync?: string;
}

interface ImportedNote {
  id: number;
  title: string;
  content: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  created_at: string;
}

export default function Journal() {
  const [availableConnectors, setAvailableConnectors] = useState<Record<string, Connector>>({});
  const [connectedSources, setConnectedSources] = useState<ConnectedSource[]>([]);
  const [importedNotes, setImportedNotes] = useState<ImportedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [showAuthModal, setShowAuthModal] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load available connectors
      const connectorsRes = await api.getAvailableConnectors();
      setAvailableConnectors(connectorsRes.connectors || {});
      
      // Load connected sources (you'll need to add this endpoint)
      try {
        const sourcesRes = await api.getConnectedSources();
        setConnectedSources(sourcesRes.sources || []);
      } catch (err) {
        console.log('No connected sources yet');
      }
      
      // Load imported notes
      const notesRes = await api.getImportedNotes();
      setImportedNotes(notesRes.notes || []);
      
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectSource = async (sourceType: string) => {
    setConnecting(sourceType);
    setShowAuthModal(sourceType);
  };

  const handleConnect = async (sourceType: string) => {
    try {
      const result = await api.connectSource({
        source_type: sourceType,
        auth_code: authCode || 'mock_token'
      });
      
      // Add to connected sources
      setConnectedSources(prev => [...prev, {
        id: result.id,
        source_type: result.source_type,
        source_name: result.source_name,
        is_connected: result.is_connected
      }]);
      
      setShowAuthModal(null);
      setAuthCode('');
    } catch (err) {
      console.error('Failed to connect:', err);
    } finally {
      setConnecting(null);
    }
  };

  const syncSource = async (sourceId: number) => {
    setSyncing(sourceId);
    try {
      const result = await api.syncSource({ source_id: sourceId });
      
      // Update last sync time
      setConnectedSources(prev => 
        prev.map(source => 
          source.id === sourceId 
            ? { ...source, last_sync: result.last_sync }
            : source
        )
      );
      
      // Reload notes
      const notesRes = await api.getImportedNotes();
      setImportedNotes(notesRes.notes || []);
      
    } catch (err) {
      console.error('Failed to sync:', err);
    } finally {
      setSyncing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green';
      case 'negative': return 'text-red';
      default: return 'text-amber';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-center py-20 text-cream3">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading journal integrations...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="page-title">Journal Integrations</h1>
        <p className="page-sub">Connect your favorite note-taking apps to sync your thoughts and track your emotional patterns.</p>
      </div>

      <div className="space-y-8">
        {/* Available Connectors */}
        <div>
          <h2 className="text-lg font-semibold text-cream mb-4">Available Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(availableConnectors).map(([key, connector]) => {
              const isConnected = connectedSources.some(s => s.source_type === key);
              
              return (
                <div key={key} className="card">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{connector.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-cream">{connector.name}</h3>
                        {isConnected && (
                          <CheckCircle className="h-4 w-4 text-green" />
                        )}
                      </div>
                      <p className="text-xs text-cream3 mb-3">
                        {connector.oauth_required ? 'OAuth authentication required' : 'Local connection'}
                      </p>
                      
                      {isConnected ? (
                        <div className="flex items-center gap-2 text-xs text-green">
                          <CheckCircle className="h-3 w-3" />
                          Connected
                        </div>
                      ) : (
                        <button 
                          onClick={() => connectSource(key)}
                          disabled={connecting === key}
                          className="btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-50"
                        >
                          {connecting === key ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4" />
                              Connect
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connected Sources */}
        {connectedSources.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-cream mb-4">Connected Sources</h2>
            <div className="space-y-3">
              {connectedSources.map(source => (
                <div key={source.id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-cream">{source.source_name}</h3>
                        <CheckCircle className="h-4 w-4 text-green" />
                      </div>
                      {source.last_sync && (
                        <p className="text-xs text-cream3">
                          Last synced: {formatDate(source.last_sync)}
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => syncSource(source.id)}
                      disabled={syncing === source.id}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {syncing === source.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3" />
                          Sync Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Imported Notes */}
        <div>
          <h2 className="text-lg font-semibold text-cream mb-4">
            Imported Notes ({importedNotes.length})
          </h2>
          
          {importedNotes.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen className="h-10 w-10 text-cream3 opacity-50 mx-auto mb-3" />
              <p className="text-cream3 text-sm">No imported notes yet. Connect and sync a source to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {importedNotes.map(note => (
                <div key={note.id} className="card">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-amber bg-[rgba(232,168,76,0.10)] px-2 py-0.5 rounded">
                          {note.source}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getSentimentColor(note.sentiment)} bg-[rgba(255,255,255,0.05)]`}>
                          {note.sentiment}
                        </span>
                        <span className="text-xs text-cream3">{formatDate(note.created_at)}</span>
                      </div>
                      {note.title && (
                        <h3 className="text-sm font-semibold text-cream mb-1">{note.title}</h3>
                      )}
                      <p className="text-sm text-cream2">{note.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="disclaimer">
          <p className="text-sm text-cream3">
            <strong className="text-amber">Privacy Notice:</strong> We only access the notes you explicitly share with MindfulAI. 
            All sentiment analysis happens locally on your device. You can disconnect and delete synced data at any time.
          </p>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-cream">
                Connect {availableConnectors[showAuthModal]?.name}
              </h3>
              <button 
                onClick={() => setShowAuthModal(null)}
                className="text-cream3 hover:text-cream"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-cream2 mb-4">
              Enter your authentication code or token to connect to {availableConnectors[showAuthModal]?.name}.
            </p>
            
            <input
              type="text"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Auth code or token"
              className="w-full mb-4"
            />
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleConnect(showAuthModal)}
                className="btn-primary flex-1"
              >
                Connect
              </button>
              <button 
                onClick={() => setShowAuthModal(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}