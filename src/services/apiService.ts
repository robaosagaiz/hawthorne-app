/**
 * API Service - Reads data from Hawthorne Backend API (Google Sheets)
 * Falls back to Firestore if API is unavailable
 */

import type { DailyLog, UserProfile } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    const response = await fetch(`${API_BASE}/api/patients`);
    if (!response.ok) throw new Error('Failed to fetch patients');
    return await response.json();
  } catch (error) {
    console.error('API Error (patients):', error);
    return [];
  }
}

// Fetch specific patient
export async function fetchPatientFromApi(grupoId: string): Promise<Patient | null> {
  try {
    const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(grupoId)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('API Error (patient):', error);
    return null;
  }
}

// Fetch daily logs for a patient (formatted for Dashboard)
export async function fetchDailyLogsFromApi(grupoId: string): Promise<DailyLog[]> {
  try {
    const response = await fetch(`${API_BASE}/api/daily-logs/${encodeURIComponent(grupoId)}`);
    if (!response.ok) throw new Error('Failed to fetch daily logs');
    return await response.json();
  } catch (error) {
    console.error('API Error (daily-logs):', error);
    return [];
  }
}

// Fetch detailed reports for a patient
export async function fetchReportsFromApi(grupoId: string): Promise<Report[]> {
  try {
    const response = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(grupoId)}`);
    if (!response.ok) throw new Error('Failed to fetch reports');
    return await response.json();
  } catch (error) {
    console.error('API Error (reports):', error);
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
