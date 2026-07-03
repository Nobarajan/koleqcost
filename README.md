# KoleqCost

Landed cost & profit calculator for collectors in Malaysia. Calculate landed cost, import estimate, resale price, eBay fees, COD profit, ROI, and break-even price — built with Next.js, Tailwind CSS, TypeScript, and shadcn/ui.

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the calculator — it's the homepage.

You can also use the convenience scripts:

```bash
npm run koleqcost       # starts the dev server (if needed) and opens the app in your browser
npm run koleqcost:stop  # stops the dev server
```

## Project structure

- `app/page.tsx` — homepage, renders the KoleqCost calculator
- `components/koleqcost/` — calculator UI components
- `lib/koleqcost/` — calculation logic, formatting, history, and storage helpers
- `app/api/rates/route.ts` — live USD/MYR exchange rate endpoint
- `components/ui/` — shadcn/ui primitives

## Notes

- This is a standalone app — no backend/database (e.g. Supabase) is connected.
- History is stored locally in the browser (localStorage).
- Optionally set `EXCHANGE_RATE_API_KEY` in `.env.local` for a keyed exchange rate provider; otherwise a free public API is used. See `.env.local.example`.
