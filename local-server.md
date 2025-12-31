# Local Development with HTTPS

If you want to test with HTTPS locally (optional):

## Option 1: Netlify CLI (Easiest)
```bash
npm install -g netlify-cli
netlify dev
```
This runs your site at `https://localhost:8888` with a valid cert.

## Option 2: mkcert (Manual)
```bash
# Install mkcert
choco install mkcert  # Windows
brew install mkcert   # Mac

# Create local certificate
mkcert -install
mkcert localhost 127.0.0.1

# Use with http-server
npx http-server -S -C localhost+1.pem -K localhost+1-key.pem
```

## Option 3: Just Use HTTP
For local development, the "Not secure" warning is **normal and safe** when:
- Testing on `localhost` or `127.0.0.1`
- Not entering real passwords or sensitive data
- Only you can access it (not exposed to internet)

The warning only matters in production (your live Netlify site).
