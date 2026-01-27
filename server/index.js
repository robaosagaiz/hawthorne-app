/**
 * Hawthorne API Server
 * Reads patient data from Google Sheets and serves to the frontend
 * 
 * Endpoints:
 * - GET /api/health - Health check
 * - GET /api/patients - List all patients (from Goals sheet)
 * - GET /api/patients/:grupoId - Get specific patient
 * - GET /api/reports/:grupoId - Get reports for a patient
 * - GET /api/reports/:grupoId/:date - Get specific report
 */

import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001; // Fixed port for Hawthorne API

// CORS config - allow frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
}));

app.use(express.json());

// Google Sheets Config
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1OBQef2UZpkNWAMBIG2mX1RjoXVIolH1ja0jkE11J8GE';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Try multiple credential paths
const CREDENTIAL_PATHS = [
  join(__dirname, 'google-credentials.json'),
  join(__dirname, '..', 'google-credentials.json'),
  '/root/clawd/google-credentials.json'
];

let sheets = null;

async function initGoogleSheets() {
  for (const credPath of CREDENTIAL_PATHS) {
    if (existsSync(credPath)) {
      try {
        const credentials = JSON.parse(readFileSync(credPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: SCOPES
        });
        sheets = google.sheets({ version: 'v4', auth });
        console.log(`✅ Google Sheets initialized with credentials from: ${credPath}`);
        return true;
      } catch (err) {
        console.error(`Failed to init with ${credPath}:`, err.message);
      }
    }
  }
  console.error('❌ No valid Google credentials found!');
  return false;
}

// Helper: Parse sheet rows to objects
function rowsToObjects(headers, rows) {
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] || '';
    });
    return obj;
  });
}

// Helper: Parse Goals row to Patient object
function parsePatient(row) {
  return {
    id: row.grupo || row.UID,
    grupo: row.grupo,
    name: row.identificacao,
    startDate: row.data_inicio,
    endDate: row.data_final,
    targets: {
      energy: parseFloat(row.meta_calorica) || 0,
      protein: parseFloat(row.meta_proteina) || 0,
      carbs: parseFloat(row.meta_carboidrato) || 0,
      fats: parseFloat(row.meta_gordura) || 0,
    },
    initialWeight: parseFloat(row.peso_inicial?.replace(',', '.')) || 0,
    finalWeight: parseFloat(row.peso_final?.replace(',', '.')) || 0,
    goal: row.objetivo,
    medication: row.medicacao,
    email: row.Email
  };
}

// Helper: Parse Reports row to DailyLog object
function parseReport(row) {
  return {
    id: row.UID,
    grupo: row.grupo,
    date: row.data_referencia,
    dateTime: row.date_time,
    energy: parseFloat(row.totalCalories) || 0,
    protein: parseFloat(row.totalProtein) || 0,
    carbs: parseFloat(row.totalCarbs) || 0,
    fats: parseFloat(row.totalFat) || 0,
    micronutrients: row.micronutrientes,
    consolidation: row.consolidacao,
    dailyGuidance: row.orientacoes_dia,
    overview: row.panorama,
    deleted: row.delete === 'TRUE',
    status: row.status
  };
}

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    sheetsConnected: sheets !== null,
    timestamp: new Date().toISOString()
  });
});

// Get all patients
app.get('/api/patients', async (req, res) => {
  if (!sheets) {
    return res.status(503).json({ error: 'Google Sheets not initialized' });
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Goals!A1:O100'
    });

    const rows = response.data.values || [];
    if (rows.length < 2) {
      return res.json([]);
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const rawData = rowsToObjects(headers, dataRows);
    const patients = rawData.map(parsePatient).filter(p => p.grupo); // Filter out empty rows

    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients', details: error.message });
  }
});

// Get specific patient by grupo ID
app.get('/api/patients/:grupoId', async (req, res) => {
  if (!sheets) {
    return res.status(503).json({ error: 'Google Sheets not initialized' });
  }

  try {
    const { grupoId } = req.params;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Goals!A1:O100'
    });

    const rows = response.data.values || [];
    if (rows.length < 2) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const rawData = rowsToObjects(headers, dataRows);
    const patients = rawData.map(parsePatient);
    
    const patient = patients.find(p => p.grupo === grupoId || p.id === grupoId);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient', details: error.message });
  }
});

// Get reports for a patient
app.get('/api/reports/:grupoId', async (req, res) => {
  if (!sheets) {
    return res.status(503).json({ error: 'Google Sheets not initialized' });
  }

  try {
    const { grupoId } = req.params;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Reports!A1:N500' // Reports can be longer
    });

    const rows = response.data.values || [];
    if (rows.length < 2) {
      return res.json([]);
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const rawData = rowsToObjects(headers, dataRows);
    const allReports = rawData.map(parseReport);
    
    // Filter by grupo and exclude deleted
    const reports = allReports
      .filter(r => r.grupo === grupoId && !r.deleted)
      .sort((a, b) => {
        // Sort by date ascending
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateA.localeCompare(dateB);
      });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
  }
});

// Get daily logs formatted for the Dashboard (transformed from reports)
app.get('/api/daily-logs/:grupoId', async (req, res) => {
  if (!sheets) {
    return res.status(503).json({ error: 'Google Sheets not initialized' });
  }

  try {
    const { grupoId } = req.params;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Reports!A1:N500'
    });

    const rows = response.data.values || [];
    if (rows.length < 2) {
      return res.json([]);
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const rawData = rowsToObjects(headers, dataRows);
    
    // Transform to DailyLog format expected by frontend
    const dailyLogs = rawData
      .filter(r => r.grupo === grupoId && r.delete !== 'TRUE')
      .map(r => ({
        id: r.UID || `${r.data_referencia}-${r.grupo}`,
        date: r.date_time ? r.date_time.split('T')[0] : r.data_referencia,
        energy: parseFloat(r.totalCalories) || 0,
        protein: parseFloat(r.totalProtein) || 0,
        carbs: parseFloat(r.totalCarbs) || 0,
        fats: parseFloat(r.totalFat) || 0,
        weight: 0 // Weight not in reports, would need to come from Goals or separate tracking
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(dailyLogs);
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    res.status(500).json({ error: 'Failed to fetch daily logs', details: error.message });
  }
});

// ==================== START SERVER ====================

async function start() {
  const sheetsOk = await initGoogleSheets();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Hawthorne API Server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Patients: http://localhost:${PORT}/api/patients`);
    console.log(`   Sheets: ${sheetsOk ? '✅ Connected' : '❌ Not connected'}\n`);
  });
}

start();
