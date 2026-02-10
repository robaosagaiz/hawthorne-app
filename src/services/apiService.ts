/**
 * API Service - Reads data from Hawthorne Backend API (Google Sheets)
 * Falls back to Firestore if API is unavailable
 */

import type { DailyLog, UserProfile } from '../types';
import { auth } from './firebase';
import { showError } from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Helper: get auth headers for API calls
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

// Authenticated fetch wrapper
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  });
}

// Extended types for API data
export interface Patient {
  id: string;
  grupo: string;
  name: string;
  startDate: string;
  endDate: string;
  targets: {
    energy: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  initialWeight: number;
  finalWeight: number;
  goal: string;
  medication: string;
  email: string;
}

export interface Report {
  id: string;
  grupo: string;
  date: string;
  dateTime: string;
  energy: number;
  protein: number;
  carbs: number;
  fats: number;
  micronutrients: string;
  consolidation: string;
  dailyGuidance: string;
  overview: string;
}

// Check if API is available
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000) 
    });
    const data = await response.json();
    return data.status === 'ok' && data.sheetsConnected;
  } catch {
    return false;
  }
}

// Fetch all patients from API
export async function fetchPatientsFromApi(): Promise<Patient[]> {
  try {
    const response = await authFetch(`${API_BASE}/api/patients`);
    if (!response.ok) throw new Error('Failed to fetch patients');
    return await response.json();
  } catch (error) {
    showError('Erro ao carregar pacientes', error);
    return [];
  }
}

// Fetch specific patient
export async function fetchPatientFromApi(grupoId: string): Promise<Patient | null> {
  try {
    const response = await authFetch(`${API_BASE}/api/patients/${encodeURIComponent(grupoId)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    showError('Erro ao carregar paciente', error);
    return null;
  }
}

// Fetch daily logs for a patient (formatted for Dashboard)
export async function fetchDailyLogsFromApi(grupoId: string, since?: string, until?: string): Promise<DailyLog[]> {
  try {
    const qp = new URLSearchParams();
    if (since) qp.set('since', since);
    if (until) qp.set('until', until);
    const params = qp.toString() ? `?${qp.toString()}` : '';
    const response = await authFetch(`${API_BASE}/api/daily-logs/${encodeURIComponent(grupoId)}${params}`);
    if (!response.ok) throw new Error('Failed to fetch daily logs');
    return await response.json();
  } catch (error) {
    showError('Erro ao carregar registros diários', error);
    return [];
  }
}

// Fetch detailed reports for a patient
export async function fetchReportsFromApi(grupoId: string, since?: string, until?: string): Promise<Report[]> {
  try {
    const qp = new URLSearchParams();
    if (since !== undefined && since !== null) qp.set('since', since);
    if (until) qp.set('until', until);
    const params = qp.toString() ? `?${qp.toString()}` : '';
    const response = await authFetch(`${API_BASE}/api/reports/${encodeURIComponent(grupoId)}${params}`);
    if (!response.ok) throw new Error('Failed to fetch reports');
    return await response.json();
  } catch (error) {
    showError('Erro ao carregar relatórios', error);
    return [];
  }
}

// Convert Patient to UserProfile format (for Dashboard compatibility)
export function patientToUserProfile(patient: Patient): UserProfile {
  return {
    uid: patient.grupo,
    email: patient.email || '',
    name: patient.name,
    phone: patient.grupo, // Using grupo as phone identifier
    role: 'patient',
    targets: {
      energy: patient.targets.energy,
      protein: patient.targets.protein,
      carbs: patient.targets.carbs,
      fats: patient.targets.fats,
      weight: patient.finalWeight || patient.initialWeight
    },
    currentWeight: patient.initialWeight
  };
}

// Fetch goal history for a patient
export async function fetchGoalHistory(grupoId: string): Promise<Patient[]> {
  try {
    const response = await authFetch(`${API_BASE}/api/patients/${encodeURIComponent(grupoId)}/goal-history`);
    if (!response.ok) throw new Error('Failed to fetch goal history');
    return await response.json();
  } catch (error) {
    showError('Erro ao carregar histórico', error);
    return [];
  }
}

// Update goals for a patient
export async function updateGoals(grupoId: string, goals: { energy: number; protein: number; carbs: number; fats: number }): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await authFetch(`${API_BASE}/api/patients/${encodeURIComponent(grupoId)}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goals)
    });
    return await response.json();
  } catch (error) {
    showError('Erro ao atualizar metas', error);
    return { success: false, message: 'Erro de conexão' };
  }
}

// Start new protocol for a patient
export async function startNewProtocol(grupoId: string, data: {
  energy: number; protein: number; carbs: number; fats: number;
  initialWeight: number; goal?: string; medication?: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await authFetch(`${API_BASE}/api/patients/${encodeURIComponent(grupoId)}/new-protocol`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    showError('Erro ao iniciar protocolo', error);
    return { success: false, message: 'Erro de conexão' };
  }
}

// Find patient by name (for user lookup)
export async function findPatientByName(name: string): Promise<Patient | null> {
  const patients = await fetchPatientsFromApi();
  return patients.find(p => 
    p.name.toLowerCase().includes(name.toLowerCase())
  ) || null;
}

// Find patient by email
export async function findPatientByEmail(email: string): Promise<Patient | null> {
  const patients = await fetchPatientsFromApi();
  return patients.find(p => 
    p.email?.toLowerCase() === email.toLowerCase()
  ) || null;
}
