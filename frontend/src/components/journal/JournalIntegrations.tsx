import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, XCircle, RefreshCw, Settings, Loader2 } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  lastSync?: string;
  syncStatus?: 'success' | 'error' | 'syncing';
  entryCount?: number;
}

interface SyncedEntry {
  id: string;
  source: string;
  title: string;
  content: string;
  date: string;
  moodScore?: number;
  sentiment?: string;
}

export default function JournalIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'notion',
      name: 'Notion',
      icon: '📝',
      description: 'Sync your Notion pages and databases to analyze mood patterns',
      connected: false,
      lastSync: undefined,
      syncStatus: undefined,
      entryCount: 0
    },
    {
      id: 'obsidian',
      name: 'Obsidian',
      icon: '💎',
      description: 'Connect your Obsidian vault for private, local-first journaling',
      connected: false,
      lastSync: undefined,
      syncStatus: undefined,
      entryCount: 0
    },
    {
      id: 'evernote',
      name: 'Evernote',
      icon: '🐘',
      description: 'Import your Evernote notebooks and track emotional trends',
      connected: false,
      lastSync: undefined,
      syncStatus: undefined,
      entryCount: 0
    },
    {
      id: 'google-keep',
      name: 'Google Keep',
      icon: '💡',
      description: 'Sync your Google Keep notes for mood analysis',
      connected: false,
      lastSync: undefined,
      syncStatus: undefined,
      entryCount: 0
    }
  ]);

  const [syncedEntries, setSyncedEntries] = useState<SyncedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await api.getIntegrations();
      if (response.data) {
        setIntegrations(response.data.integrations || []);
        setSyncedEntries(response.data.recentEntries || []);
      }
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectIntegration = async (integrationId: string) => {
    try {
      // Redirect to OAuth flow
      const response = await api.getOAuthUrl(integrationId);
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Failed to connect integration:', err);
    }
  };

  const disconnectIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    
    try {
      await api.disconnectIntegration(integrationId);
      setIntegrations(prev => 
        prev.map(int => 
          int.id === integrationId 
            ? { ...int, connected: false, lastSync: undefined, entryCount: 0 }
            : int
        )
      );
    } catch (err) {
      console.error('Failed to disconnect integration:', err);
    }
  };

  const syncIntegration = async (integrationId: string) => {
    setSyncing(integrationId);
    try {
      await api.syncIntegration(integrationId);
      await loadIntegrations(); // Reload to get updated data
    } catch (err) {
      console.error('Failed to sync integration:', err);
    } finally {
      setSyncing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <div class="space-y-8">
      {/* Integrations Grid */}
      <div>
        <h2 class="text-lg font-semibold text-cream mb-4">Connected Apps</h2>
        
        {loading ? (
          <div class="flex items-center justify-center py-12 text-cream3">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading integrations...
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map(integration => (
              <div key={integration.id} class="card">
                <div class="flex items-start gap-4">
                  <div class="text-4xl">{integration.icon}</div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="text-lg font-semibold text-cream">{integration.name}</h3>
                      {integration.connected && (
                        <CheckCircle className="h-4 w-4 text-green" />
                      )}
                    </div>
                    <p class="text-sm text-cream2 mb-3">{integration.description}</p>
                    
                    {integration.connected ? (
                      <div class="space-y-3">
                        <div class="flex items-center gap-4 text-xs text-cream3">
                          <span class="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </span>
                          {integration.lastSync && (
                            <span class="flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" />
                              Last sync: {formatDate(integration.lastSync)}
                            </span>
                          )}
                          {integration.entryCount !== undefined && (
                            <span>{integration.entryCount} entries synced</span>
                          )}
                        </div>
                        
                        <div class="flex gap-2">
                          <button 
                            onClick={() => syncIntegration(integration.id)}
                            disabled={syncing === integration.id}
                            class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {syncing === integration.id ? (
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
                          <button 
                            onClick={() => disconnectIntegration(integration.id)}
                            class="btn-danger text-xs py-1.5 px-3"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => connectIntegration(integration.id)}
                        class="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Connect {integration.name}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Synced Entries */}
      <div>
        <h2 class="text-lg font-semibold text-cream mb-4">Recent Synced Entries</h2>
        
        {syncedEntries.length === 0 ? (
          <div class="card text-center py-12">
            <div class="text-4xl mb-3 opacity-50">📝</div>
            <p class="text-cream3 text-sm">No synced entries yet. Connect an integration to get started!</p>
          </div>
        ) : (
          <div class="space-y-3">
            {syncedEntries.map(entry => (
              <div key={entry.id} class="card">
                <div class="flex items-start gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-xs text-amber bg-[rgba(232,168,76,0.10)] px-2 py-0.5 rounded">
                        {entry.source}
                      </span>
                      <span class="text-xs text-cream3">{formatDate(entry.date)}</span>
                    </div>
                    <h3 class="text-sm font-semibold text-cream mb-1">{entry.title}</h3>
                    <p class="text-sm text-cream2 line-clamp-2">{entry.content}</p>
                    
                    {entry.moodScore && (
                      <div class="mt-2 flex items-center gap-2">
                        <span class="text-xs text-cream3">Mood:</span>
                        <span class="text-sm font-semibold text-amber">{entry.moodScore}/5</span>
                        {entry.sentiment && (
                          <span class="text-xs text-cream3">({entry.sentiment})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div class="disclaimer">
        <p class="text-sm text-cream3">
          <strong class="text-amber">Privacy Notice:</strong> We only access the notes you explicitly share with MindfulAI. 
          All sentiment analysis happens locally on your device. You can disconnect and delete synced data at any time.
        </p>
      </div>
    </div>
  );
}