# Monitor Pengumpulan Data RB melalui skm.go.id

Files:
- `index.html` -> Netlify frontend
- `netlify/functions/skm-api.js` -> generic Netlify-to-Apps-Script proxy
- `netlify.toml` -> Netlify configuration
- `Code.gs` -> paste into the Apps Script project bound to the backend Google Sheet

Netlify environment variable required:
- `APPS_SCRIPT_URL` = production Apps Script Web App `/exec` URL

The frontend calls:
`/.netlify/functions/skm-api`

All mutable business configuration should remain in Google Sheets / Apps Script.
