# Mission Control API

Real-time agent management API for OpenClaw. **NO MOCK DATA** - integrates directly with OpenClaw CLI tools.

## Features

- ✅ **Real-time agent list** - sessions_list + subagents
- ✅ **Agent logs** - sessions_history integration
- ✅ **Kill agents** - subagents kill command
- ✅ **Spawn agents** - sessions_spawn integration
- ✅ **Token tracking** - Cost calculation with real pricing
- ✅ **Burn rate monitoring** - Tokens/hour with cost estimation

## Architecture

```
agents.html (Frontend)
    ↓ HTTP requests
API Server (api/agents.js)
    ↓ CLI commands
OpenClaw Gateway
    ↓ Tool calls
sessions_list, subagents, sessions_history, sessions_spawn
```

## Quick Start

### 1. Start API Server

```bash
cd /root/.openclaw/workspace/projects/mission-control-dashboard
node api/agents.js
```

API runs on **http://localhost:19002** (avoids conflict with OpenClaw gateway on 19000).

### 2. Start Frontend

```bash
python3 -m http.server 8080
```

Open **http://localhost:8080/agents.html**

### 3. Or Both Together

```bash
npm run dev
```

## Endpoints

### GET /api/agents
List all active sessions and subagents with stats.

**Response:**
```json
{
  "success": true,
  "timestamp": 1234567890,
  "agents": [
    {
      "sessionId": "agent:main:telegram:...",
      "displayName": "telegram:g-second-brain",
      "model": "claude-sonnet-4-5",
      "totalTokens": 45000,
      "contextTokens": 200000,
      "ageMs": 120000,
      "status": "active"
    }
  ],
  "stats": {
    "total": 1,
    "active": 1,
    "totalCost": "0.23",
    "avgBurnRate": "0.15"
  }
}
```

### GET /api/agents/:sessionKey/logs
Get message history for a session.

**Response:**
```json
{
  "success": true,
  "sessionKey": "agent:main:...",
  "messageCount": 15,
  "messages": [
    {
      "role": "user",
      "content": "Build the dashboard",
      "timestamp": 1234567890
    }
  ]
}
```

### POST /api/agents/:sessionKey/kill
Kill a subagent (only works for spawned subagents, not main sessions).

**Response:**
```json
{
  "success": true,
  "message": "Killed subagent: ..."
}
```

### POST /api/agents/spawn
Spawn a new isolated agent.

**Request:**
```json
{
  "task": "Find all bugs in the codebase",
  "model": "claude-sonnet-4-5"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Spawned agent for task: Find all bugs...",
  "sessionKey": "agent:subagent:..."
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "status": "ok"
}
```

## Implementation Details

### Real Data Sources

- **sessions_list** → All active OpenClaw sessions
- **subagents list** → Active spawned agents
- **sessions_history** → Message logs for debugging
- **sessions_spawn** → Create new isolated agents
- **subagents kill** → Terminate runaway agents

### Token Cost Calculation

Uses real pricing for common models:
- Claude Sonnet 4.5: $3/M input, $15/M output
- Claude Opus 4: $15/M input, $75/M output
- Gemini 2.5 Flash: $0.075/M input, $0.30/M output
- GPT-4: $30/M input, $60/M output

Estimates 70% input / 30% output token ratio.

### Burn Rate Formula

```
tokens_per_hour = total_tokens / (age_ms / 3600000)
cost_per_hour = (tokens_per_hour / 1M) × avg_model_price
```

Alerts when:
- **>$2/hr** → Warning (yellow)
- **>$5/hr** → Danger (red)

### Context Usage Alerts

Warns when session uses >80% of context window (default 200K tokens).

## Deployment

### Local Development
```bash
node api/agents.js
```

### Production (Cloudflare Workers)

The API needs to run as a separate service since Cloudflare Pages is static-only. Options:

1. **Cloudflare Workers** - Deploy as worker with KV storage
2. **VPS/Server** - Run as persistent Node.js service
3. **Fly.io** - Deploy as container with auto-scaling

For now, run locally and use ngrok/tunneling for remote access:

```bash
node api/agents.js &
npx ngrok http 19002
```

Update `API_BASE` in agents.html to ngrok URL.

## Security

- ✅ CORS enabled for development
- ⚠️ No authentication (add API keys for production)
- ⚠️ Rate limiting recommended
- ⚠️ Input validation on spawn endpoint

## Troubleshooting

**Error: "Failed to list agents"**
- Check OpenClaw gateway is running: `openclaw gateway status`
- Verify CLI access: `openclaw agent sessions_list`

**Error: "Killing regular sessions not yet supported"**
- Can only kill subagents, not main sessions
- Use `openclaw gateway restart` to reset main sessions

**Empty agent list**
- Normal if no active agents
- Spawn test agent: `openclaw agent sessions_spawn --task "Test" --mode run`

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Agent performance graphs (token usage over time)
- [ ] Cost alerts (email/Telegram when >$X/day)
- [ ] Agent templates (predefined tasks)
- [ ] Multi-gateway support (connect to remote OpenClaw instances)
- [ ] Authentication/authorization
- [ ] Agent logs streaming
- [ ] Token usage forecasting
