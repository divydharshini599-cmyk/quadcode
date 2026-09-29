# StockPilot — Inventory Intelligence

**Hack Day — Genesis Season 01 | St. Peter's College of Engineering and Technology**

Problem statement:

> **Inventory Loss & Wastage Risk in Small and Mid-Sized Indian Businesses**

StockPilot is a premium inventory-intelligence prototype for small manufacturers, wholesalers and retailers. It turns simple inventory and sales entries into risk signals, operational recommendations, reports and an AI business copilot.

## What is included

- Premium responsive dashboard
- Account creation and local sign-in flow
- Clean empty workspace for new users — **no sample products are injected automatically**
- Explicit **Explore demo workspace** containing prepared demo data
- Multiple business workspaces
- Inventory add / edit / delete
- Working Cancel, X, Escape and outside-click modal controls
- Sales recording with stock validation
- Sales and revenue analytics using Chart.js
- Inventory risk detection
- Slow-moving stock and inventory-value analysis
- Product catalogue
- Product photo upload / camera capture
- PDF, PowerPoint and Word exports
- Server-side AI chatbot using the OpenAI Responses API
- Built-in chatbot fallback when no API key is configured
- API key kept on the server and excluded from GitHub via `.gitignore`
- No frontend build step

## Quick start

### Requirements

- Node.js 18+
- An OpenAI API key for the real AI chatbot

### Run

```bash
node server.js
```

Open:

```text
http://localhost:5500
```

On Windows, you can double-click `start.bat`.

## Enable the real AI chatbot

Copy `.env.example` to `.env` and add your API key:

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.6-luna
PORT=5500
```

Restart the server after changing `.env`.

The browser sends the user's question and current business context to `/api/chat`. The Node server calls the OpenAI Responses API and returns the answer. The secret API key is never placed in `app.js`.

**Never commit `.env` to GitHub.**

## Demo mode

The login screen has **Explore demo workspace**.

Only when that button is clicked does StockPilot load:

- DD Palette Manufacturing
- Aarav Components
- Prepared products
- Revenue history
- Risk examples
- Activity examples

Creating an account instead starts with a clean `My Business` workspace with zero products and zero sales.

## Important local-storage reset

This v4 release intentionally does not migrate the old v3 sample dataset. If an old v3 workspace is already stored in your browser, the first v4 load will reset it to the clean workspace.

For a manual reset during testing, run in the browser console:

```js
localStorage.removeItem('stockpilotData');
localStorage.removeItem('stockpilotAccount');
localStorage.removeItem('stockpilotLogged');
location.reload();
```

Only use that reset when you intentionally want to erase local demo data.

## GitHub

Upload the repository files to a public GitHub repository. Do not upload `.env` or API keys.

The static frontend can be hosted on GitHub Pages, but **the real AI chatbot requires the Node backend** (`server.js`) to be running or deployed on a backend host. For tomorrow's offline hackathon demo, running `node server.js` on the presentation laptop is the simplest option.

## Hackathon demo flow

1. Start `node server.js`.
2. Open `http://localhost:5500`.
3. Click **Explore demo workspace**.
4. Show the Overview and risk radar.
5. Open Inventory and demonstrate `⋯ → Update product → Delete Product`.
6. Add a product and show that the dashboard updates.
7. Record a sale and show stock reducing immediately.
8. Open Sales & Analytics.
9. Open Product Catalogue and demonstrate photo upload.
10. Open the AI Copilot and ask:
    - `Which products are risky?`
    - `How much inventory value is tied up in high-risk products?`
    - `Which products are slow moving?`
    - `What should I reorder first?`
    - `How can I reduce wastage?`
11. Export the business report.
12. Switch to another business workspace.

## Architecture

```text
Browser
  │
  ├── index.html / style.css / app.js
  │       └── localStorage for prototype workspace data
  │
  └── /api/chat
          │
          ▼
     server.js (Node)
          │
          ▼
     OpenAI Responses API
```

## Prototype → production roadmap

The hackathon version is intentionally lightweight. A production SaaS version should add:

- PostgreSQL / Supabase persistence
- Secure authentication and password hashing
- Server-side authorization and tenant isolation
- Supplier and purchase-order workflows
- Barcode / OCR / computer-vision product recognition
- Stock movement ledger and audit history
- Real invoice import
- Cloud report generation
- Role-based owner/staff permissions
- Production monitoring and automated backups
