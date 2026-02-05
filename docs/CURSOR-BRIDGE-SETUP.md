# Cursor Bridge Setup Guide

## Overview

The Cursor Bridge service enables communication between **Excersys AI App** and **Cursor**. It provides:

- Webhook endpoint for Excersys AI App to send messages to Cursor
- Direct API endpoints for querying Cursor
- Slack integration for bidirectional communication
- Health monitoring and status checks

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd packages/cursor-bridge
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3001
NODE_ENV=development

# Cursor Configuration (choose one)
CURSOR_API_KEY=your_api_key_here
# OR
CURSOR_WEBHOOK_URL=https://your-cursor-instance.com/webhook

# Slack Configuration (choose one)
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_CHANNEL=#mpdm-omid--clawdbot_app--cursor-1
# OR
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_NOTIFICATIONS_ENABLED=true
```

### 3. Start the Service

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## 📡 Integration Methods

### Method 1: Webhook from Excersys AI App

Configure Excersys AI App to send webhooks to:

```
POST http://your-cursor-bridge:3001/webhook
Content-Type: application/json

{
  "message": "Your message to Cursor",
  "source": "excersys-ai-app",
  "metadata": {
    "userId": "user123",
    "sessionId": "session456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message forwarded to Cursor",
  "cursorResponse": "Response from Cursor...",
  "timestamp": "2026-02-05T12:00:00.000Z"
}
```

### Method 2: Direct API Query

```bash
curl -X POST http://localhost:3001/cursor/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the deployment status?",
    "context": {
      "source": "excersys-ai-app"
    }
  }'
```

### Method 3: Slack Integration

#### Setup Slack App

1. **Create Slack App:**
   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name: "Cursor Bridge"
   - Workspace: Select your workspace

2. **Configure Bot Token Scopes:**
   - Go to "OAuth & Permissions"
   - Add Bot Token Scopes:
     - `app_mentions:read`
     - `chat:write`
     - `channels:history`
     - `commands`

3. **Install App to Workspace:**
   - Click "Install to Workspace"
   - Copy the "Bot User OAuth Token" (starts with `xoxb-`)
   - Add to `.env` as `SLACK_BOT_TOKEN`

4. **Configure Event Subscriptions:**
   - Go to "Event Subscriptions"
   - Enable Events
   - Request URL: `https://your-domain.com/slack/events`
   - Subscribe to bot events:
     - `app_mention`
     - `message.channels`

5. **Add Slash Command (Optional):**
   - Go to "Slash Commands"
   - Create command: `/cursor`
   - Request URL: `https://your-domain.com/slack/command`
   - Description: "Query Cursor AI"

#### Using Slack Integration

**Option A: Mention @Cursor**
```
@Cursor What is the status of the deployment?
```

**Option B: Use Slash Command**
```
/cursor What is the status of the deployment?
```

## 🔧 Cursor Integration Options

### Option 1: Cursor API (if available)

If Cursor provides an official API:

```env
CURSOR_API_KEY=your_cursor_api_key
CURSOR_API_URL=https://api.cursor.sh
```

### Option 2: Cursor Webhook

If Cursor exposes a webhook endpoint:

```env
CURSOR_WEBHOOK_URL=https://your-cursor-instance.com/webhook
```

### Option 3: Custom Integration

Modify `src/services/cursorService.ts` to implement your custom integration:

```typescript
async sendToCursor(data: CursorMessage) {
  // Your custom implementation
  // e.g., HTTP request, WebSocket, etc.
}
```

## 🧪 Testing

### Test Webhook Endpoint

```bash
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message from Excersys AI App",
    "source": "excersys-ai-app"
  }'
```

### Test Health Check

```bash
curl http://localhost:3001/health
```

### Test Cursor Query

```bash
curl -X POST http://localhost:3001/cursor/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Test query"
  }'
```

### Run Unit Tests

```bash
npm test
```

## 📊 Monitoring

### Health Check

```bash
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-05T12:00:00.000Z",
  "service": "cursor-bridge",
  "version": "1.0.0",
  "checks": {
    "cursor": {
      "status": "available",
      "available": true
    },
    "slack": {
      "status": "healthy",
      "available": true
    }
  }
}
```

### Logs

- Development: Console output
- Production: Check `logs/` directory

## 🔒 Security Considerations

1. **Authentication:**
   - Add API key authentication to webhook endpoints
   - Implement request signing/verification

2. **HTTPS:**
   - Always use HTTPS in production
   - Configure SSL/TLS certificates

3. **Environment Variables:**
   - Never commit `.env` file
   - Use secure secret management in production

4. **Rate Limiting:**
   - Add rate limiting middleware
   - Prevent abuse

## 🚀 Deployment

### Docker (Example)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Environment Variables in Production

Set these in your deployment platform:
- `PORT`
- `CURSOR_API_KEY` or `CURSOR_WEBHOOK_URL`
- `SLACK_BOT_TOKEN` or `SLACK_WEBHOOK_URL`
- `NODE_ENV=production`

## 🔄 Workflow

```
┌─────────────────┐
│ Excersys AI App │
└────────┬────────┘
         │ POST /webhook
         ▼
┌─────────────────┐
│ Cursor Bridge   │
│   Service       │
└────────┬────────┘
         │ Forward
         ▼
┌─────────────────┐
│     Cursor      │
└────────┬────────┘
         │ Response
         ▼
┌─────────────────┐
│ Cursor Bridge   │
│   Service       │
└────────┬────────┘
         │ Notify
         ▼
┌─────────────────┐
│     Slack       │
│  (Optional)     │
└─────────────────┘
```

## 📝 Next Steps

1. **Configure Cursor Integration:**
   - Determine how Cursor exposes its API
   - Update `cursorService.ts` if needed

2. **Set up Slack:**
   - Create Slack App
   - Configure webhook/events
   - Test integration

3. **Add Authentication:**
   - Implement API key middleware
   - Add request validation

4. **Deploy:**
   - Set up production environment
   - Configure monitoring
   - Set up alerts

## 🆘 Troubleshooting

### Service won't start
- Check port availability: `lsof -i :3001`
- Verify environment variables are set
- Check logs for errors

### Cursor not responding
- Verify `CURSOR_API_KEY` or `CURSOR_WEBHOOK_URL` is correct
- Test Cursor endpoint directly
- Check network connectivity

### Slack integration not working
- Verify bot token is correct
- Check Slack app permissions
- Verify webhook URL is accessible
- Check Slack event subscriptions

## 📚 Additional Resources

- [Slack API Documentation](https://api.slack.com/)
- [Express.js Documentation](https://expressjs.com/)
- Service README: `packages/cursor-bridge/README.md`
