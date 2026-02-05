# Cursor Bridge Service

Communication bridge between Excersys AI App and Cursor, with Slack integration support.

## 🎯 Purpose

This service enables bidirectional communication between:
- **Excersys AI App** → Can send messages/queries to Cursor
- **Cursor** → Can respond back through various channels
- **Slack** → Acts as a communication channel and notification system

## 🏗️ Architecture

```
Excersys AI App
    ↓ (webhook)
Cursor Bridge Service
    ↓ (API/Webhook)
Cursor
    ↓ (response)
Cursor Bridge Service
    ↓ (notification)
Slack / Excersys AI App
```

## 🚀 Quick Start

### 1. Installation

```bash
cd packages/cursor-bridge
npm install
```

### 2. Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Cursor Configuration
CURSOR_API_KEY=your_cursor_api_key
# OR
CURSOR_WEBHOOK_URL=https://your-cursor-instance.com/webhook

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-token
# OR
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Run

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Webhook (from Excersys AI App)
```
POST /webhook
Content-Type: application/json

{
  "message": "Your message to Cursor",
  "source": "excersys-ai-app",
  "metadata": {}
}
```

### Cursor Query
```
POST /cursor/query
Content-Type: application/json

{
  "query": "Your question for Cursor",
  "context": {},
  "options": {}
}
```

### Slack Events (for Slack integration)
```
POST /slack/events
```

### Slack Command
```
POST /slack/command
```

## 🔧 Configuration Options

### Cursor Integration

**Option 1: Cursor API Key**
- Set `CURSOR_API_KEY` and `CURSOR_API_URL`
- Uses official Cursor API (if available)

**Option 2: Cursor Webhook**
- Set `CURSOR_WEBHOOK_URL`
- Forwards messages to Cursor's webhook endpoint

**Option 3: Custom Integration**
- Modify `src/services/cursorService.ts` to implement custom integration

### Slack Integration

**Option 1: Slack Bot Token**
- Set `SLACK_BOT_TOKEN`
- Full API access, can reply in threads, etc.

**Option 2: Slack Webhook**
- Set `SLACK_WEBHOOK_URL`
- Simpler, for notifications only

## 📝 Usage Examples

### From Excersys AI App

```javascript
// Send message to Cursor
const response = await fetch('http://cursor-bridge:3001/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is the status of the deployment?',
    source: 'excersys-ai-app',
    metadata: { userId: 'user123' }
  })
});

const data = await response.json();
console.log(data.cursorResponse);
```

### Direct Cursor Query

```javascript
const response = await fetch('http://cursor-bridge:3001/cursor/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Analyze the codebase structure',
    context: { source: 'api' }
  })
});
```

### Slack Integration

1. **Configure Slack App:**
   - Create a Slack App at https://api.slack.com/apps
   - Add bot token scopes: `chat:write`, `app_mentions:read`, `channels:history`
   - Set Event Subscriptions URL: `https://your-domain.com/slack/events`
   - Add Slash Command: `/cursor` → `https://your-domain.com/slack/command`

2. **In Slack:**
   - Mention `@Cursor` in a channel
   - Or use `/cursor your question`

## 🧪 Testing

```bash
npm test
```

## 📊 Monitoring

- Health check: `GET /health`
- Logs: Check console output or log files in production
- Status endpoints: `/cursor/status` and `/slack/status` (via health check)

## 🔒 Security

- Use environment variables for sensitive data
- Implement authentication for webhook endpoints (add middleware)
- Use HTTPS in production
- Validate incoming requests

## 🚀 Deployment

1. Build the service:
   ```bash
   npm run build
   ```

2. Set environment variables in your deployment platform

3. Run the service:
   ```bash
   npm start
   ```

4. Configure reverse proxy (nginx, etc.) if needed

## 📚 Next Steps

1. **Configure Cursor Integration:**
   - Determine how Cursor exposes its API/webhook
   - Update `cursorService.ts` accordingly

2. **Set up Slack:**
   - Create Slack App
   - Configure webhook/events
   - Test integration

3. **Add Authentication:**
   - Implement API key authentication
   - Add request signing/verification

4. **Monitor & Log:**
   - Set up logging aggregation
   - Add metrics/monitoring

## 🤝 Contributing

This service is part of the PacDocSign monorepo. Follow the monorepo contribution guidelines.
