export const API_BASE_URL = 'https://whatsapp-crm-backend-1-8j7r.onrender.com';
export const STORAGE_KEY = 'mindclub_crm_api_key';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'follow_up_required'
  | 'converted'
  | 'closed';

export interface Contact {
  id: string;
  phone: string;
  name: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  contactId: string;
  status: LeadStatus | string;
  source: string;
  title: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: Contact;
}

export interface DemoInboundPayload {
  phone: string;
  name: string;
  message: string;
  interestType?: string;
}

export interface DemoInboundResponse {
  ok: boolean;
  contactCreated?: boolean;
  leadCreated?: boolean;
  messageSaved?: boolean;
  data?: {
    contact: { id: string; phone: string; name: string | null };
    lead: { id: string; status: string; contactId: string };
    message: { id: string; providerMessageId: string; text: string; direction: string };
  };
  error?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getStoredApiKey(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, key.trim());
  } catch (err) {
    console.error('Failed to save API key to sessionStorage', err);
  }
}

export function clearStoredApiKey(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear API key from sessionStorage', err);
  }
}

/**
 * Fetch all leads from the protected backend endpoint
 */
export async function fetchLeads(apiKey?: string): Promise<Lead[]> {
  const token = (apiKey ?? getStoredApiKey()).trim();

  if (!token) {
    throw new ApiError('API access key is required to view leads.', 401);
  }

  const res = await fetch(`${API_BASE_URL}/api/leads`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new ApiError('Unauthorized: Invalid or missing API key. Please verify your access key.', res.status);
  }

  if (!res.ok) {
    let errMsg = `Failed to fetch leads (${res.status} ${res.statusText})`;
    try {
      const body = await res.json();
      if (body.error) errMsg = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(errMsg, res.status);
  }

  const json = await res.json();
  return (json.data || []) as Lead[];
}

/**
 * Update the status of a specific lead
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus | string,
  apiKey?: string
): Promise<Lead> {
  const token = (apiKey ?? getStoredApiKey()).trim();

  if (!token) {
    throw new ApiError('API access key is required to update lead status.', 401);
  }

  const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new ApiError('Unauthorized: Unable to update status with this key.', res.status);
  }

  if (!res.ok) {
    let errMsg = `Failed to update status (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) errMsg = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(errMsg, res.status);
  }

  const json = await res.json();
  return json.data as Lead;
}

/**
 * Submit a simulated WhatsApp inbound message
 */
export async function sendDemoInbound(payload: DemoInboundPayload): Promise<DemoInboundResponse> {
  const res = await fetch(`${API_BASE_URL}/api/demo/inbound-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = `Failed to send demo message (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) {
        errMsg = body.details ? `${body.error}: ${JSON.stringify(body.details)}` : body.error;
      }
    } catch {
      // ignore
    }
    throw new ApiError(errMsg, res.status);
  }

  return await res.json();
}

/**
 * Check backend health status
 */
export async function checkBackendHealth(): Promise<{ ok: boolean; timestamp?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (!res.ok) return { ok: false };
    const json = await res.json();
    return { ok: json.ok === true || json.status === 'ok', timestamp: json.timestamp };
  } catch {
    return { ok: false };
  }
}
