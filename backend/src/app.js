import cors from 'cors';
import express from 'express';
import { customAlphabet } from 'nanoid';
import { pool } from './db.js';

const createId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) || true }));
app.use(express.json());

function serializeCountdown(row) {
  return {
    id: row.id,
    title: row.title,
    targetDate: new Date(row.target_date).toISOString(),
    themeAccent: row.theme_accent || null,
    createdAt: new Date(row.created_at).toISOString()
  };
}

function isValidAccent(value) {
  return value === undefined || value === null || /^#[0-9a-fA-F]{6}$/.test(value);
}

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok' });
  } catch (error) {
    response.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});

app.post('/api/countdowns', async (request, response, next) => {
  const { title, targetDate, themeAccent } = request.body ?? {};
  const parsedDate = new Date(targetDate);

  if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 255) {
    return response.status(400).json({ error: 'Title is required and must be 255 characters or fewer.' });
  }
  if (!targetDate || Number.isNaN(parsedDate.getTime())) {
    return response.status(400).json({ error: 'Target date must be a valid ISO timestamp.' });
  }
  if (!isValidAccent(themeAccent)) {
    return response.status(400).json({ error: 'Theme accent must be a six-digit hex color.' });
  }

  try {
    const id = createId();
    const result = await pool.query(
      `INSERT INTO countdowns (id, title, target_date, theme_accent)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, target_date, theme_accent, created_at`,
      [id, title.trim(), parsedDate.toISOString(), themeAccent || null]
    );
    response.status(201).json({ countdown: serializeCountdown(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/countdowns/:id', async (request, response, next) => {
  try {
    const result = await pool.query(
      'SELECT id, title, target_date, theme_accent, created_at FROM countdowns WHERE id = $1',
      [request.params.id]
    );
    if (result.rowCount === 0) {
      return response.status(404).json({ error: 'Countdown not found.' });
    }
    response.json({ countdown: serializeCountdown(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Something went wrong on the server.' });
});

export default app;
