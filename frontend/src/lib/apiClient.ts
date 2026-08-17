const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Helper to get the currently selected user ID from localStorage
const getUserId = () => {
  return localStorage.getItem('current_user_id') || '1'; // Default to 1 if not set
};

export async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  isJsonResponse: boolean = true
): Promise<T> {
  let url = `${API_BASE}${endpoint}`;
  
  // ✅ CRITICAL FIX: Append user_id to the URL for ALL requests (GET, POST, PUT, DELETE)
  // This matches the `user_id: int = Query(default=1)` in your FastAPI backend.
  const separator = url.includes('?') ? '&' : '?';
  url += `${separator}user_id=${getUserId()}`;
  
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMessage = errorData.detail;
    } catch (e) {
      // Ignore parse error
    }
    throw new Error(errorMessage);
  }
 
  if (!isJsonResponse) {
    return response.blob() as unknown as T;
  }
  
  return response.json();
}

export const api = {
  // ==========================================
  // AUTH (Optional for this simple demo)
  // ==========================================
  register: (email: string, password: string) => 
    apiRequest(`/api/auth/register`, { method: 'POST', body: JSON.stringify({ email, password }) }),
  
  login: (email: string, password: string) => 
    apiRequest(`/api/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) }),

  // ==========================================
  // JOURNAL
  // ==========================================
  submitJournal: (data: any) => 
    apiRequest(`/api/journal`, { method: 'POST', body: JSON.stringify(data) }),
  
  getJournalHistory: () => 
    apiRequest(`/api/journal`),

  // ==========================================
  // ANALYTICS
  // ==========================================
  getMoodTrends: (days: number) => 
    apiRequest(`/api/mood/trends?days=${days}`),
  
  getEmotionDistribution: (source: 'all' | 'text' | 'facial' = 'all') =>
    apiRequest(`/api/mood/emotions?source=${source}`),
  
  getHeatmapData: () => 
    apiRequest(`/api/mood/heatmap`), 
  
  getRiskScore: (days: number) => 
    apiRequest(`/api/mood/risk-score?days=${days}`), 
  
  getCorrelationData: () => 
    apiRequest(`/api/mood/correlation`),

  // ==========================================
  // PRIVACY
  // ==========================================
  getConsent: () => 
    apiRequest(`/api/privacy/consent`),
  
  updateConsent: (data: any) => 
    apiRequest(`/api/privacy/consent`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteData: () => 
    apiRequest(`/api/privacy/data`, { method: 'DELETE' }),

  // ==========================================
  // EXPORTS
  // ==========================================
  exportPDF: (days: number = 7) => 
    apiRequest(`/api/mood/export/pdf?days=${days}`, {}, false),
  
  exportCSV: () => 
    apiRequest(`/api/mood/export/csv`, {}, false),

  // ==========================================
  // CONNECTORS
  // ==========================================
  getAvailableConnectors: () => 
    apiRequest(`/api/connectors/available`),
  
  getConnectedSources: () => 
    apiRequest(`/api/connectors/sources`),
  
  connectSource: (data: { source_type: string; auth_code?: string }) => 
    apiRequest(`/api/connectors/connect`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  syncSource: (data: { source_id: number }) => 
    apiRequest(`/api/connectors/sync`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  getImportedNotes: () => 
    apiRequest(`/api/connectors/notes`),

  // ==========================================
  // EMOTION ANALYSIS
  // ==========================================
  analyzeText: (text: string) => 
    apiRequest(`/api/text-emotion/analyze`, { method: 'POST', body: JSON.stringify({ text }) }),
  
  analyzeFace: (image_base64: string) => 
    apiRequest(`/api/facial-emotion/analyze`, { method: 'POST', body: JSON.stringify({ image_base64 }) }),

  // ==========================================
  // 🆕 PI CAMERA (External IoT Camera)
  // ==========================================
  getLatestPiEmotion: () => 
    apiRequest(`/api/pi-camera/latest`),
  
  getPiCameraStatus: () => 
    apiRequest(`/api/pi-camera/status`),
};