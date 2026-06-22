const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Helper to get the JWT token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  isJsonResponse: boolean = true // Flag to handle file downloads (PDF/CSV)
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  // Inject the JWT token automatically for protected routes
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...getAuthHeaders(), 
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    // Try to parse the specific error detail from FastAPI
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMessage = errorData.detail;
    } catch (e) {
      // Ignore parse error if response isn't JSON
    }
    throw new Error(errorMessage);
  }
  
  // If it's a file download, return the Blob, NOT JSON
  if (!isJsonResponse) {
    return response.blob() as unknown as T;
  }
  
  return response.json();
}

export const api = {
  // ==========================================
  // AUTH (Login / Register)
  // ==========================================
  register: (email: string, password: string) => 
    apiRequest(`/api/auth/register`, { method: 'POST', body: JSON.stringify({ email, password }) }),
  
  login: (email: string, password: string) => 
    apiRequest(`/api/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) }),

  // ==========================================
  // CHAT (AI Companion)
  // ==========================================
  sendChatMessage: (message: string) => 
    apiRequest(`/api/chat`, { method: 'POST', body: JSON.stringify({ message }) }),

  // ==========================================
  // JOURNAL (Mood Logs)
  // ==========================================
  submitJournal: (data: any) => 
    apiRequest(`/api/journal`, { method: 'POST', body: JSON.stringify(data) }),
  
  getJournalHistory: () => 
    apiRequest(`/api/journal`),

  // ==========================================
  // ANALYTICS (Charts & Insights)
  // ==========================================
  // FIX: Changed paths from /api/analytics/... to /api/mood/... to match your backend!
  getMoodTrends: (days: number) => 
    apiRequest(`/api/mood/trends?days=${days}`),
  
  getEmotionDistribution: () => 
    apiRequest(`/api/mood/emotions`),
  
  getHeatmapData: () => 
    apiRequest(`/api/mood/heatmap`), 
  
  // FIX: Backend uses /risk-score, not /risk
  getRiskScore: (days: number) => 
    apiRequest(`/api/mood/risk-score?days=${days}`), 
  
  getCorrelationData: () => 
    apiRequest(`/api/mood/correlation`),

  // ==========================================
  // PRIVACY & CONSENT
  // ==========================================
  getConsent: () => 
    apiRequest(`/api/privacy/consent`),
  
  updateConsent: (data: any) => 
    apiRequest(`/api/privacy/consent`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteData: () => 
    apiRequest(`/api/privacy/data`, { method: 'DELETE' }),

  // ==========================================
  // EXPORTS (PDF / CSV)
  // ==========================================
  // FIX: Backend has separate endpoints for PDF and CSV. 
  // We pass `false` at the end so it returns a Blob instead of trying to parse JSON.
  exportPDF: (days: number = 30) => 
    apiRequest(`/api/mood/export/pdf?days=${days}`, {}, false),
  
  exportCSV: () => 
    apiRequest(`/api/mood/export/csv`, {}, false),

  // ==========================================
  // CONNECTORS (Notion, Google Keep, etc.)
  // ==========================================
  getAvailableConnectors: () => 
    apiRequest(`/api/connectors/available`),
  
  connectSource: (source_type: string, auth_code?: string) => 
    apiRequest(`/api/connectors/connect`, { method: 'POST', body: JSON.stringify({ source_type, auth_code }) }),
  
  syncSource: (source_id: number) => 
    apiRequest(`/api/connectors/sync`, { method: 'POST', body: JSON.stringify({ source_id }) }),
  
  getImportedNotes: () => 
    apiRequest(`/api/connectors/notes`),

  // ==========================================
  // EMOTION ANALYSIS (REST endpoints)
  // ==========================================
  analyzeText: (text: string) => 
    apiRequest(`/api/text-emotion/analyze`, { method: 'POST', body: JSON.stringify({ text }) }),
  
  analyzeFace: (image_base64: string) => 
    apiRequest(`/api/facial-emotion/analyze`, { method: 'POST', body: JSON.stringify({ image_base64 }) }),
};