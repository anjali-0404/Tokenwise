# TokenWise Agent
npm install && npm run dev  → http://localhost:3000
Routes: / (landing), /signup, /login, /dashboard (agent console)
Backend: app/api/agent/route.js (routing, cache, failover, budget, privacy, approvals), app/api/auth/route.js
To use real models, replace the simulated call in app/api/agent/route.js with a Bifrost gateway request (cloud) and Ollama (local).
