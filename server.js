const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 5500);
const HOST = process.env.HOST || '0.0.0.0';
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
const API_KEY = process.env.OPENAI_API_KEY || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res, status, body, type='application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

function json(res, status, obj) {
  send(res, status, JSON.stringify(obj), 'application/json; charset=utf-8');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error('Request too large'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function buildInstructions(context) {
  return `You are StockPilot Copilot, an AI business operations assistant inside StockPilot, an inventory intelligence application for Indian small and mid-sized businesses.

Your job is to answer questions using the user's current workspace data when relevant. Focus on inventory management, demand, sales, wastage, slow-moving stock, stock cover, reorder decisions, margin/cost leakage, and practical MSME operations. You can also explain how to use StockPilot.

Rules:
- Be practical and concise. Use Indian rupee amounts when discussing money.
- Never invent products, sales, revenue, suppliers, or metrics that are not present in the supplied context.
- If the workspace has no data, say that clearly and tell the user what data to enter.
- Distinguish calculated observations from recommendations.
- If asked for a calculation, calculate from the supplied data and show the key numbers.
- Do not claim to have performed an action unless the application actually performed it.
- You are an assistant, not an accountant, auditor, lawyer, or financial adviser.

CURRENT WORKSPACE DATA:
${JSON.stringify(context || {}, null, 2)}`;
}

function extractText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  const parts = [];
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

async function aiChat(message, context) {
  if (!API_KEY) {
    return {
      answer: '',
      configured: false,
      message: 'AI chatbot is not configured. Add OPENAI_API_KEY to .env and restart the server.'
    };
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: buildInstructions(context),
      input: message,
      max_output_tokens: 700
    })
  });

  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { payload = {}; }

  if (!response.ok) {
    const detail = payload?.error?.message || `OpenAI API returned HTTP ${response.status}`;
    throw new Error(detail);
  }

  const answer = extractText(payload);
  if (!answer) throw new Error('The AI returned an empty response.');
  return { answer, configured: true, model: MODEL };
}

function serveStatic(req, res) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname); }
  catch { return send(res, 400, 'Bad request', 'text/plain; charset=utf-8'); }

  if (pathname === '/') pathname = '/index.html';
  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT)) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': pathname.endsWith('.html') ? 'no-store' : 'public, max-age=3600' });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      return json(res, 200, { ok: true, aiConfigured: Boolean(API_KEY), model: MODEL });
    }

    if (req.method === 'POST' && req.url === '/api/chat') {
      const raw = await readBody(req);
      let body;
      try { body = JSON.parse(raw || '{}'); } catch { return json(res, 400, { error: 'Invalid JSON.' }); }
      const message = String(body.message || '').trim();
      if (!message) return json(res, 400, { error: 'Message is required.' });
      if (message.length > 4000) return json(res, 400, { error: 'Message is too long.' });

      try {
        const result = await aiChat(message, body.context || {});
        if (!result.configured) return json(res, 503, { error: result.message, configured: false });
        return json(res, 200, result);
      } catch (error) {
        console.error('[chat]', error.message);
        return json(res, 502, { error: error.message || 'AI request failed.', configured: Boolean(API_KEY) });
      }
    }

    if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
    return json(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'Server error.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`StockPilot running at http://localhost:${PORT}`);
  console.log(`AI chatbot: ${API_KEY ? `configured (${MODEL})` : 'fallback mode — add OPENAI_API_KEY to .env'}`);
});
