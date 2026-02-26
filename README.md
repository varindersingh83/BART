# BART
Tool to catch bart on time.

## Development
1. Install dependencies: `npm install`
2. Build TypeScript: `npm run build`
3. Run dev server + TypeScript watch: `npm run dev`

The compiled JavaScript is output to `assets/javascript/app.js` from `src/app.ts`.
The local dev server runs at `http://localhost:5173` and proxies the BART API to avoid CORS.
Set a custom API key with `BART_API_KEY=your_key npm run dev` if the default public key is rejected.

## GitHub Pages + Render Proxy
GitHub Pages is static, so `/api/etd` does not exist there. Use a Render proxy.

1. Create a new Render Web Service from this repo.
2. Set the root directory to `proxy`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variable `BART_API_KEY` (your key).
6. After Render gives you a URL, update `window.BART_PROXY_BASE` in `index.html`.

The frontend will call: `https://YOUR-RENDER-SERVICE.onrender.com/api/etd?orig=EMBR`.

https://varindersingh83.github.io/BART/
