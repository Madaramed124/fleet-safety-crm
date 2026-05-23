import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fromPath } from 'pdf2pic';
import AnthropicSDK from '@anthropic-ai/sdk';

const { Client: Anthropic } = AnthropicSDK;

const app = express();
app.use(cors());
app.use(express.json({ limit: '30mb' }));

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

async function convertPdfFirstPageToBase64(pdfBase64) {
  const tmpDir = '/tmp';
  const ts = Date.now();
  const pdfPath = path.join(tmpDir, `upload-${ts}.pdf`);
  const outPrefix = path.join(tmpDir, `page-${ts}`);

  const buffer = Buffer.from(pdfBase64, 'base64');
  await fs.writeFile(pdfPath, buffer);

  const options = {
    format: 'png',
    width: 1200,
    height: 1600,
    density: 150,
    saveFilename: path.basename(outPrefix),
    savePath: tmpDir,
  };

  await fromPath(pdfPath, options)(1);

  const outFile = `${outPrefix}_1.png`;
  const outData = await fs.readFile(outFile);

  try { await fs.unlink(pdfPath); } catch (e) {}
  try { await fs.unlink(outFile); } catch (e) {}

  return outData.toString('base64');
}

async function callClaudeVision(base64Image, mediaType) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY env var');

  const client = new Anthropic({ apiKey });
  const prompt = `You are given a single image of an inspection or accident report. Extract the following fields and return ONLY valid JSON, no markdown, no explanation, no backticks. The JSON keys must be: caseCode, date, driverName, carrierName, violationType, severity, status, notes. Use ISO date format (YYYY-MM-DD) for date, return null when a field is not found.`;
  const input = `${prompt}\n\nDATA_URI: data:${mediaType};base64,${base64Image}`;

  const response = await client.complete({
    prompt: input,
    model: CLAUDE_MODEL,
    max_tokens_to_sample: 1024,
  });

  const text = typeof response === 'string' ? response : response.completion || response.output_text;
  if (!text) throw new Error('No text output from Anthropic response');

  const cleaned = text.replace(/```[\s\S]*?```/g, '').replace(/`/g, '').trim();
  try { return JSON.parse(cleaned); } catch (e) { return { __raw: cleaned }; }
}

app.post('/api/extract-inspection', async (req, res) => {
  try {
    const { base64, mediaType } = req.body;
    if (!base64 || !mediaType) return res.status(400).json({ error: 'base64 and mediaType required' });

    let imageBase64 = base64;
    if (mediaType === 'application/pdf' || mediaType === 'application/x-pdf') {
      imageBase64 = await convertPdfFirstPageToBase64(base64);
    }

    const extracted = await callClaudeVision(imageBase64, mediaType === 'application/pdf' ? 'image/png' : mediaType);
    return res.json({ extracted });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
  console.log(`Extraction server listening on port ${port}`);
});

server.on('error', (error) => {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
    console.warn(`Extraction server port ${port} is already in use. Assuming another instance is running.`);
    server.close(() => {
      process.exit(0);
    });
    return;
  }

  throw error;
});
