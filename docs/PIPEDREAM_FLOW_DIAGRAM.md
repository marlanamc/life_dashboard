# Pipedream + TickTick Integration Flow

## Architecture Overview

```
┌─────────────────┐    HTTPS Request    ┌─────────────────┐    API Call    ┌─────────────────┐
│                 │ ──────────────────► │                 │ ─────────────► │                 │
│  Life Dashboard │                     │  Pipedream      │                │  TickTick API   │
│  (Browser)      │                     │  Workflow       │                │  (api.ticktick.com) │
│                 │ ◄────────────────── │                 │ ◄───────────── │                 │
└─────────────────┘    JSON Response   └─────────────────┘    JSON Data   └─────────────────┘
```

## Detailed Flow

### 1. User Action in Dashboard
```
User clicks "Sync to TickTick" 
    ↓
Dashboard prepares task data
    ↓
Makes HTTPS request to Pipedream webhook
```

### 2. Pipedream Processing
```
Pipedream receives request
    ↓
Extracts TickTick API endpoint from URL
    ↓
Forwards request to TickTick API with user's token
    ↓
Handles response and error cases
    ↓
Returns processed data to dashboard
```

### 3. TickTick API Interaction
```
TickTick receives authenticated request
    ↓
Processes task creation/update
    ↓
Returns success/error response
    ↓
Pipedream forwards response to dashboard
```

## Request/Response Examples

### Dashboard → Pipedream
```http
POST https://abc123.pipedream.net/api/ticktick/task
Authorization: Bearer 1AE6F69232DE59211DA472CCEEB565A5...
Content-Type: application/json

{
  "title": "Complete project proposal",
  "content": "Duration: 120 minutes",
  "priority": 3,
  "tags": ["life-dashboard", "capacity-planner"]
}
```

### Pipedream → TickTick
```http
POST https://api.ticktick.com/api/v2/task
Authorization: Bearer 1AE6F69232DE59211DA472CCEEB565A5...
Content-Type: application/json

{
  "title": "Complete project proposal",
  "content": "Duration: 120 minutes",
  "priority": 3,
  "tags": ["life-dashboard", "capacity-planner"]
}
```

### TickTick → Pipedream → Dashboard
```json
{
  "success": true,
  "data": {
    "id": "task_123456",
    "title": "Complete project proposal",
    "status": 0,
    "createdTime": "2024-01-15T10:30:00Z"
  },
  "status": 200
}
```

## Benefits of This Architecture

### ✅ **CORS Bypass**
- Browser can't directly call TickTick API due to CORS
- Pipedream acts as a server-side proxy
- No CORS restrictions on server-to-server calls

### ✅ **Security**
- User's TickTick token never leaves their browser
- Pipedream workflow can be secured with API keys
- All communication over HTTPS

### ✅ **Reliability**
- Pipedream handles error cases and retries
- Detailed logging and monitoring
- No dependency on browser network policies

### ✅ **Flexibility**
- Easy to modify API mapping in Pipedream
- Can add additional processing or validation
- Supports any TickTick API endpoint

## Environment Configuration

```env
# .env.local
VITE_TICKTICK_PROXY_URL=https://abc123.pipedream.net
VITE_TICKTICK_PROXY_KEY=your-secret-key-123
```

## Error Handling Flow

```
Dashboard Request
    ↓
Pipedream Workflow
    ↓
TickTick API Call
    ↓
┌─ Success ─► Return Data to Dashboard
└─ Error ─► Log Error ─► Return Error to Dashboard
```

## Monitoring Points

1. **Dashboard Console**: Check for network errors
2. **Pipedream Logs**: Monitor workflow executions
3. **TickTick API**: Verify task creation/updates
4. **Browser Network Tab**: Inspect request/response flow

---

This architecture provides a robust, secure, and maintainable way to integrate TickTick with your Life Dashboard while working around browser limitations.
