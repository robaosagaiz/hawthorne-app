/**
 * Hawthorne API Server
 * Reads/writes patient data from Google Sheets and serves to the frontend
 * 
 * Endpoints:
 * - GET  /api/health - Health check
 * - GET  /api/patients - List all patients (latest goals per patient)
 * - GET  /api/patients/:grupoId - Get specific patient (latest goals)
 * - GET  /api/patients/:grupoId/goal-history - Get all goal changes for patient
 * - POST /api/patients/:grupoId/goals - Update goals (add new goal row)
 * - POST /api/patients/:grupoId/new-protocol - Start new protocol
 * - GET  /api/reports/:grupoId - Get reports for a patient
 * - GET  /api/daily-logs/:grupoId - Get daily logs for dashboard
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
const PORT = process.env.PORT || 3001;

// CORS config
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
}));

app.use(express.json());

// Serve static frontend in production
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('📦 Serving static frontend from:', distPath);
}

// Google Sheets Config
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1OBQef2UZpkNWAMBIG2mX1RjoXVIolH1ja0jkE11J8GE';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']; // Read+Write

const CREDENTIAL_PATHS = [
  join(__dirname, 'google-credentials.json'),
  join(__dirname, '..', 'google-credentials.json'),
  '/root/clawd/google-credentials.json'
];

let sheets = null;

async function initGoogleSheets() {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
      sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ Google Sheets initialized from GOOGLE_CREDENTIALS_JSON env var');
      return true;
    } catch (err) {
      console.error('Failed to init from env var:', err.message);
    }
  }

  for (const credPath of CREDENTIAL_PATHS) {
    if (existsSync(credPath)) {
      try {
        const credentials = JSON.parse(readFileSync(credPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
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

// ==================== HELPERS ====================

function rowsToObjects(headers, rows) {
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] || '';
    });
    return obj;
  });
}

function parseGoalRow(row) {
  return {
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
    email: row.Email || '',
  };
}

// Parse date string (dd-mm-yyyy or dd/mm/yyyy) to Date object
function parseDate(str) {
  if (!str) return null;
  const parts = str.replace(/\//g, '-').split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return null;
}

// Format date to dd-mm-yyyy
function formatDate(date) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

// Get all goal rows from Goals sheet
async function getAllGoalRows() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Goals!A1:O500'
  });
  const rows = response.data.values || [];
  if (rows.length < 2) return { headers: rows[0] || [], goals: [] };
  const headers = rows[0];
  const dataRows = rows.slice(1);
  const goals = rowsToObjects(headers, dataRows).filter(r => r.grupo);
  return { headers, goals };
}

// Get latest goal per patient (most recent startDate)
function getLatestGoals(allGoals) {
  const byGrupo = {};
  for (const g of allGoals) {
    const parsed = parseGoalRow(g);
    const date = parseDate(parsed.startDate);
    if (!byGrupo[parsed.grupo] || (date && (!byGrupo[parsed.grupo]._date || date > byGrupo[parsed.grupo]._date))) {
      byGrupo[parsed.grupo] = { ...parsed, _date: date, id: parsed.grupo };
    }
  }
  return Object.values(byGrupo).map(({ _date, ...rest }) => rest);
}

// Get goal history for a specific patient
function getGoalHistory(allGoals, grupoId) {
  return allGoals
    .filter(g => g.grupo === grupoId)
    .map(g => parseGoalRow(g))
    .sort((a, b) => {
      const da = parseDate(a.startDate);
      const db = parseDate(b.startDate);
      if (!da || !db) return 0;
      return db - da; // newest first
    });
}

// Get the active goal for a patient at a given date
function getGoalAtDate(goalHistory, dateStr) {
  const target = parseDate(dateStr);
  if (!target) return goalHistory[0]; // fallback to latest
  
  // goalHistory is sorted newest first
  for (const goal of goalHistory) {
    const start = parseDate(goal.startDate);
    const end = parseDate(goal.endDate);
    if (start && start <= target) {
      if (!end || end >= target) {
        return goal;
      }
    }
  }
  return goalHistory[goalHistory.length - 1]; // fallback to oldest
}

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
    weight: row.peso ? parseFloat(row.peso.replace(',', '.')) : null,
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

// Get all patients (latest goals)
app.get('/api/patients', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { goals } = await getAllGoalRows();
    const patients = getLatestGoals(goals);
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients', details: error.message });
  }
});

// Get specific patient (latest goals)
app.get('/api/patients/:grupoId', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { grupoId } = req.params;
    const { goals } = await getAllGoalRows();
    const patients = getLatestGoals(goals);
    const patient = patients.find(p => p.grupo === grupoId || p.id === grupoId);
    
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient', details: error.message });
  }
});

// Get goal history for a patient
app.get('/api/patients/:grupoId/goal-history', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { grupoId } = req.params;
    const { goals } = await getAllGoalRows();
    const history = getGoalHistory(goals, grupoId);
    
    if (history.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(history);
  } catch (error) {
    console.error('Error fetching goal history:', error);
    res.status(500).json({ error: 'Failed to fetch goal history', details: error.message });
  }
});

// Update goals (add new goal row for existing protocol)
app.post('/api/patients/:grupoId/goals', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { grupoId } = req.params;
    const { energy, protein, carbs, fats } = req.body;

    if (!energy || !protein || !carbs || !fats) {
      return res.status(400).json({ error: 'Missing required fields: energy, protein, carbs, fats' });
    }

    // Get current patient data
    const { goals } = await getAllGoalRows();
    const history = getGoalHistory(goals, grupoId);
    
    if (history.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const current = history[0]; // latest
    const today = formatDate(new Date());

    // Close current goal row: set endDate on previous entry
    // (We'll handle this by convention — the app reads latest startDate)

    // Append new goal row
    const newRow = [
      '', // UID
      grupoId,
      current.name,
      '', // date_time
      today, // data_inicio
      '', // data_final
      String(energy),
      String(protein),
      String(carbs),
      String(fats),
      String(current.initialWeight).replace('.', ','), // keep same initial weight
      '', // peso_final
      current.goal,
      current.medication,
      current.email
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Goals!A:O',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] }
    });

    console.log(`✅ Goals updated for ${current.name} (${grupoId}): ${energy}kcal, ${protein}g prot`);
    
    res.json({ 
      success: true, 
      message: 'Goals updated',
      newGoals: { energy, protein, carbs, fats, startDate: today }
    });
  } catch (error) {
    console.error('Error updating goals:', error);
    res.status(500).json({ error: 'Failed to update goals', details: error.message });
  }
});

// Start new protocol
app.post('/api/patients/:grupoId/new-protocol', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { grupoId } = req.params;
    const { energy, protein, carbs, fats, initialWeight, goal, medication } = req.body;

    if (!energy || !protein || !carbs || !fats || !initialWeight) {
      return res.status(400).json({ error: 'Missing required fields: energy, protein, carbs, fats, initialWeight' });
    }

    // Get current patient data
    const { goals } = await getAllGoalRows();
    const history = getGoalHistory(goals, grupoId);
    
    if (history.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const current = history[0];
    const today = formatDate(new Date());

    // Close previous protocol: update endDate on the current row
    // Find the row index of the current goal
    const allRows = goals;
    const currentRowIndex = allRows.findIndex(r => 
      r.grupo === grupoId && r.data_inicio === current.startDate
    );
    
    if (currentRowIndex >= 0) {
      // +2 because row 1 is header, and findIndex is 0-based
      const sheetRow = currentRowIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Goals!F${sheetRow}`, // data_final column
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[today]] }
      });
    }

    // Append new protocol row
    const newRow = [
      '', // UID
      grupoId,
      current.name,
      '', // date_time
      today, // data_inicio
      '', // data_final (open)
      String(energy),
      String(protein),
      String(carbs),
      String(fats),
      String(initialWeight).replace('.', ','),
      '', // peso_final
      goal || current.goal,
      medication || current.medication,
      current.email
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Goals!A:O',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] }
    });

    console.log(`✅ New protocol started for ${current.name} (${grupoId})`);
    
    res.json({ 
      success: true, 
      message: 'New protocol started',
      protocol: { 
        startDate: today, 
        energy, protein, carbs, fats, 
        initialWeight,
        goal: goal || current.goal 
      }
    });
  } catch (error) {
    console.error('Error starting new protocol:', error);
    res.status(500).json({ error: 'Failed to start new protocol', details: error.message });
  }
});

// Get reports for a patient
app.get('/api/reports/:grupoId', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { grupoId } = req.params;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Reports!A1:O500'
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return res.json([]);

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const rawData = rowsToObjects(headers, dataRows);
    const reports = rawData
      .map(parseReport)
      .filter(r => r.grupo === grupoId && !r.deleted)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
  }
});

// Get daily logs for dashboard
app.get('/api/daily-logs/:grupoId', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { grupoId } = req.params;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Reports!A1:O500'
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return res.json([]);

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const rawData = rowsToObjects(headers, dataRows);
    
    const dailyLogs = rawData
      .filter(r => r.grupo === grupoId && r.delete !== 'TRUE')
      .map(r => ({
        id: r.UID || `${r.data_referencia}-${r.grupo}`,
        date: r.date_time ? r.date_time.split('T')[0] : r.data_referencia,
        energy: parseFloat(r.totalCalories) || 0,
        protein: parseFloat(r.totalProtein) || 0,
        carbs: parseFloat(r.totalCarbs) || 0,
        fats: parseFloat(r.totalFat) || 0,
        weight: r.peso ? parseFloat(r.peso.replace(',', '.')) : null
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(dailyLogs);
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    res.status(500).json({ error: 'Failed to fetch daily logs', details: error.message });
  }
});

// SPA fallback
if (existsSync(distPath)) {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

// ==================== START ====================

async function start() {
  const sheetsOk = await initGoogleSheets();
  app.listen(PORT, () => {
    console.log(`\n🚀 Hawthorne API Server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Patients: http://localhost:${PORT}/api/patients`);
    console.log(`   Sheets: ${sheetsOk ? '✅ Connected (read+write)' : '❌ Not connected'}\n`);
  });
}

start();
