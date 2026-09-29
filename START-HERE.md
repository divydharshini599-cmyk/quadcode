# StockPilot — Hackathon Quick Start

## 1. Start the website

Install Node.js 18+ if it is not already installed.

Open this folder in a terminal and run:

```bash
node server.js
```

Then open:

```text
http://localhost:5500
```

On Windows you can also double-click `start.bat`.

## 2. Real AI chatbot

The chatbot has a real server-side OpenAI integration. Your API key is **not** placed in frontend JavaScript.

1. Copy `.env.example` to `.env`.
2. Put your API key in `OPENAI_API_KEY`.
3. Restart `node server.js`.
4. Open StockPilot and click the ✦ AI button.
5. Ask questions such as:
   - Which products are risky?
   - Which items are slow moving?
   - How much inventory value is tied up in high-risk products?
   - What should I reorder first?
   - How can I reduce wastage?

If no API key is configured, the website still works and uses its built-in inventory assistant as a fallback.

## 3. Demo workspace vs real workspace

- **Create an account** starts with an empty business workspace.
- No sample products are inserted automatically.
- **Explore demo workspace** intentionally loads the prepared DD Palette Manufacturing / Aarav Components demo data.
- Existing v3 sample data is not migrated into the new v4 workspace.

## 4. Product controls

Inventory → `⋯` → Update product.

The modal supports:
- X close
- Cancel
- Escape key
- Click outside modal
- Save changes
- Delete Product with confirmation

## 5. GitHub

Commit the project files, but **never commit `.env`**. `.gitignore` already excludes `.env` and `.env.*`.

Important: GitHub Pages can host the frontend, but it cannot run `server.js`. The real AI chatbot requires the Node server to be running or deployed to a backend host. For a hackathon laptop demo, `node server.js` is enough.
