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
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://100.114.182.121:5173', process.env.FRONTEND_URL].filter(Boolean),
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
const FOODLOG_SPREADSHEET_ID = process.env.FOODLOG_SPREADSHEET_ID || '1JbOJLbY3EOSGUnQgrStELX5MZQ8XZXw0Zld2vajToKo';
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

// ==================== SHEETS CACHE (60s TTL) ====================
// Prevents rate-limiting from Google Sheets API when admin views trigger many calls

const _sheetsCache = new Map(); // key → { data, ts }
const CACHE_TTL_MS = 60_000; // 60 seconds

async function cachedSheetsGet(spreadsheetId, range) {
  const key = `${spreadsheetId}::${range}`;
  const cached = _sheetsCache.get(key);
  if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
    return cached.data;
  }
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const data = res.data.values || [];
  _sheetsCache.set(key, { data, ts: Date.now() });
  return data;
}

// Invalidate cache for a spreadsheet (call after writes)
function invalidateCache(spreadsheetId) {
  for (const key of _sheetsCache.keys()) {
    if (key.startsWith(spreadsheetId + '::')) {
      _sheetsCache.delete(key);
    }
  }
}

// ==================== HELPERS ====================

// Standard error response with rate-limit detection
function sendError(res, error, label = 'Operation failed') {
  const msg = error?.message || String(error);
  const isRateLimit = msg.includes('Quota exceeded');
  const status = isRateLimit ? 429 : 500;
  console.error(`${label}:`, msg);
  res.status(status).json({ error: label, details: msg, retryable: isRateLimit });
}

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
    activityTargets: {
      workoutsPerWeek: parseInt(row.meta_treinos_sem) || 3,
      cardioMinutes: parseInt(row.meta_cardio_min) || 30,
      stepsPerDay: parseInt(row.meta_passos_dia) || 5000,
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

// Get all goal rows from Goals sheet (cached)
async function getAllGoalRows() {
  const rows = await cachedSheetsGet(SPREADSHEET_ID, 'Goals!A1:W500');
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
    sendError(res, error, 'Failed to fetch patients');
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
    sendError(res, error, 'Failed to fetch patient');
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
    sendError(res, error, 'Failed to fetch goal history');
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
    invalidateCache(SPREADSHEET_ID);

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

// Update activity targets for a patient
app.post('/api/patients/:grupoId/activity-targets', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { grupoId } = req.params;
    const { workoutsPerWeek, cardioMinutes, stepsPerDay } = req.body;

    // Find patient's row in Goals
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Goals!B:B'
    });
    const rows = response.data.values || [];
    let targetRow = -1;
    // Find the LAST row with this grupo (latest goal)
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i][0] === grupoId) {
        targetRow = i + 1; // 1-indexed
        break;
      }
    }

    if (targetRow < 1) return res.status(404).json({ error: 'Patient not found' });

    // Update columns U, V, W on that row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Goals!U${targetRow}:W${targetRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          String(workoutsPerWeek ?? 3),
          String(cardioMinutes ?? 30),
          String(stepsPerDay ?? 5000),
        ]]
      }
    });

    invalidateCache(SPREADSHEET_ID);
    console.log(`✅ Activity targets updated for ${grupoId}: ${workoutsPerWeek} treinos, ${cardioMinutes}min cardio, ${stepsPerDay} passos`);

    res.json({
      success: true,
      message: 'Activity targets updated',
      activityTargets: { workoutsPerWeek, cardioMinutes, stepsPerDay }
    });
  } catch (error) {
    console.error('Error updating activity targets:', error);
    res.status(500).json({ error: 'Failed to update activity targets', details: error.message });
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

    invalidateCache(SPREADSHEET_ID);
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
    const rows = await cachedSheetsGet(SPREADSHEET_ID, 'Reports!A1:O500');
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
    sendError(res, error, 'Failed to fetch reports');
  }
});

// Get daily logs for dashboard
// Helper: normalize DD-MM-YYYY to YYYY-MM-DD
function normalizeDateStr(d) {
  if (!d) return null;
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [dd, mm, yyyy] = d.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(d)) {
    const [dd, mm, yyyy] = d.split('-');
    return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
  }
  return d;
}

// GET /api/food-logs/:grupoId — Individual meal entries (granular, real-time)
app.get('/api/food-logs/:grupoId', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { grupoId } = req.params;
    const rows = await cachedSheetsGet(FOODLOG_SPREADSHEET_ID, 'food logs!A1:N2500');
    if (rows.length < 2) return res.json([]);

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const rawData = rowsToObjects(headers, dataRows);

    const foodLogs = rawData
      .filter(r => r.ID === grupoId)
      .map(r => ({
        id: r.msg_id || `${r.Date}-${r.Time}`,
        date: normalizeDateStr(r.Date),
        time: r.Time || null,
        client: r.Client || null,
        food: r.Food || null,
        overview: r.Overview || null,
        energy: parseFloat(r.Calories) || 0,
        protein: parseFloat(r.Protein) || 0,
        carbs: parseFloat(r.Carbs) || 0,
        fats: parseFloat(r.Fat) || 0,
        picture: r.Picture || null,
        fromImage: r.from_image === 'TRUE',
      }))
      .sort((a, b) => {
        const dateComp = (a.date || '').localeCompare(b.date || '');
        if (dateComp !== 0) return dateComp;
        return (a.time || '').localeCompare(b.time || '');
      });

    res.json(foodLogs);
  } catch (error) {
    console.error('Error fetching food logs:', error);
    sendError(res, error, 'Failed to fetch food logs');
  }
});

// GET /api/daily-logs/:grupoId — Aggregated daily totals (from food logs + Reports fallback)
app.get('/api/daily-logs/:grupoId', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { grupoId } = req.params;

    // 1. Try food logs first (granular, real-time)
    let dailyMap = new Map();
    try {
      const flRows = await cachedSheetsGet(FOODLOG_SPREADSHEET_ID, 'food logs!A1:N2500');
      if (flRows.length >= 2) {
        const headers = flRows[0];
        const dataRows = flRows.slice(1);
        const rawData = rowsToObjects(headers, dataRows);

        for (const r of rawData) {
          if (r.ID !== grupoId) continue;
          const date = normalizeDateStr(r.Date);
          if (!date) continue;
          const energy = parseFloat(r.Calories) || 0;
          const protein = parseFloat(r.Protein) || 0;
          const carbs = parseFloat(r.Carbs) || 0;
          const fats = parseFloat(r.Fat) || 0;
          if (dailyMap.has(date)) {
            const existing = dailyMap.get(date);
            existing.energy += energy;
            existing.protein += protein;
            existing.carbs += carbs;
            existing.fats += fats;
          } else {
            dailyMap.set(date, {
              id: `fl-${date}-${grupoId}`,
              date,
              energy,
              protein,
              carbs,
              fats,
              weight: null,
            });
          }
        }
      }
    } catch (flErr) {
      console.error('Food logs fetch failed, falling back to Reports:', flErr.message);
    }

    // 2. If no food logs found, fall back to Reports (consolidated)
    if (dailyMap.size === 0) {
      const rows = await cachedSheetsGet(SPREADSHEET_ID, 'Reports!A1:O500');
      if (rows.length >= 2) {
        const headers = rows[0];
        const dataRows = rows.slice(1);
        const rawData = rowsToObjects(headers, dataRows);
        for (const r of rawData) {
          if (r.grupo !== grupoId || r.delete === 'TRUE') continue;
          const date = r.date_time ? r.date_time.split('T')[0] : r.data_referencia;
          if (!date) continue;
          dailyMap.set(date, {
            id: r.UID || `${r.data_referencia}-${r.grupo}`,
            date,
            energy: parseFloat(r.totalCalories) || 0,
            protein: parseFloat(r.totalProtein) || 0,
            carbs: parseFloat(r.totalCarbs) || 0,
            fats: parseFloat(r.totalFat) || 0,
            weight: r.peso ? parseFloat(r.peso.replace(',', '.')) : null,
          });
        }
      }
    }

    let dailyLogs = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    // Filter by protocol start date if ?since= is provided
    const since = req.query.since;
    if (since) {
      const sinceNorm = normalizeDateStr(since) || since;
      dailyLogs = dailyLogs.filter(l => l.date >= sinceNorm);
    }

    res.json(dailyLogs);
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    sendError(res, error, 'Failed to fetch daily logs');
  }
});

// Get activities for a patient (weight, exercise, steps)
app.get('/api/activities/:grupoId', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { grupoId } = req.params;
    const rows = await cachedSheetsGet(SPREADSHEET_ID, 'Activities!A1:H500');
    if (rows.length < 2) return res.json([]);

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const rawData = rowsToObjects(headers, dataRows);

    const activities = rawData
      .filter(r => r.grupo === grupoId)
      .map(r => ({
        grupo: r.grupo,
        date: r.date,
        type: r.type, // peso, forca, cardio, passos
        durationMin: r.duration_min ? parseInt(r.duration_min) : null,
        value: r.value ? parseFloat(r.value.replace(',', '.')) : null,
        notes: r.notes || '',
        source: r.source || 'manual',
        dateTime: r.date_time || ''
      }))
      .sort((a, b) => {
        // Sort by actual date (date column) first, then by dateTime for same-day entries
        const dateA = normalizeDateStr(a.date || '');
        const dateB = normalizeDateStr(b.date || '');
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.dateTime || '').localeCompare(b.dateTime || '');
      });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    sendError(res, error, 'Failed to fetch activities');
  }
});

// Get energy model (TDEE v2) for a patient
app.get('/api/energy-model/:grupoId', async (req, res) => {
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not initialized' });

  try {
    const { grupoId } = req.params;

    // 1) Fetch patient profile from Goals sheet (sex, age, height, PAL)
    const goalsRows = await cachedSheetsGet(SPREADSHEET_ID, 'Goals!A1:W50');
    if (goalsRows.length < 2) return res.status(404).json({ error: 'No patient data' });

    const goalsHeaders = goalsRows[0];
    const goalsData = goalsRows.slice(1).map(r => rowsToObjects(goalsHeaders, [r])[0]);
    const patient = goalsData.find(p => p.grupo === grupoId && !p.data_final);
    if (!patient) return res.status(404).json({ error: 'Patient not found or protocol ended' });

    const profile = {
      sex: (patient.sexo || 'M').toUpperCase(),
      age: parseInt(patient.idade) || 35,
      height_cm: parseInt(patient.altura_cm) || 170,
      PAL0: parseFloat(patient.nivel_atividade === 'moderado' ? '1.6' :
                        patient.nivel_atividade === 'sedentario' ? '1.4' :
                        patient.nivel_atividade === 'ativo' ? '1.75' :
                        patient.nivel_atividade === 'muito_ativo' ? '1.9' : '1.6')
    };

    // 2) Fetch weight data from Activities sheet
    const actRows = await cachedSheetsGet(SPREADSHEET_ID, 'Activities!A1:H500');
    const actHeaders = actRows[0] || [];
    const actData = actRows.slice(1).map(r => rowsToObjects(actHeaders, [r])[0]);
    const weightRecords = actData
      .filter(r => r.grupo === grupoId && r.type === 'peso' && r.value)
      .map(r => ({
        date: normalizeDate(r.date),
        weight_kg: parseFloat(String(r.value).replace(',', '.'))
      }));

    // 3) Fetch food log data (EI_rep) from Reports tab (same spreadsheet)
    const foodRows = await cachedSheetsGet(SPREADSHEET_ID, 'Reports!A1:O500');
    const foodHeaders = foodRows[0] || [];
    const foodData = foodRows.slice(1).map(r => rowsToObjects(foodHeaders, [r])[0]);
    const foodRecords = foodData
      .filter(r => r.grupo === grupoId && r.delete !== 'TRUE')
      .map(r => ({
        date: r.date_time ? r.date_time.split('T')[0] : r.data_referencia,
        EI_rep_kcal: parseFloat(String(r.totalCalories || '0').replace(',', '.'))
      }))
      .filter(r => r.EI_rep_kcal > 0);

    // 4) Merge into unified series (all dates)
    const allDates = new Set([
      ...weightRecords.map(w => w.date),
      ...foodRecords.map(f => f.date)
    ]);

    const weightMap = new Map(weightRecords.map(w => [w.date, w.weight_kg]));
    const foodMap = new Map(foodRecords.map(f => [f.date, f.EI_rep_kcal]));

    const series = Array.from(allDates).sort().map(date => ({
      date,
      weight_kg: weightMap.get(date) || null,
      EI_rep_kcal: foodMap.get(date) || null
    }));

    // 5) Return raw data + profile for client-side calculation
    res.json({
      profile,
      series,
      patient_name: patient.identificacao || grupoId,
      records: {
        weights: weightRecords.length,
        food_logs: foodRecords.length,
        total_days: allDates.size
      }
    });
  } catch (error) {
    console.error('Error computing energy model:', error);
    const isRateLimit = error.message && error.message.includes('Quota exceeded');
    const status = isRateLimit ? 429 : 500;
    res.status(status).json({ error: 'Failed to compute energy model', details: error.message, retryable: isRateLimit });
  }
});

// Helper: normalize date DD-MM-YYYY → YYYY-MM-DD
function normalizeDate(d) {
  if (!d) return d;
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [dd, mm, yyyy] = d.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }
  return d;
}

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
