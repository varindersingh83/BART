# BART
Tool to catch bart on time.

## Development
1. Install dependencies: `npm install`
2. Build TypeScript: `npm run build`
3. Run dev server + TypeScript watch: `npm run dev`

The compiled JavaScript is output to `assets/javascript/app.js` from `src/app.ts`.
The local dev server runs at `http://localhost:5173` and proxies the BART API to avoid CORS.
Set a custom API key with `BART_API_KEY=your_key npm run dev` if the default public key is rejected.

https://varindersingh83.github.io/BART/
