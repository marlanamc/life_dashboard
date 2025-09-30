# TickTick Integration

This document explains how to set up and use the TickTick integration with the Life Dashboard.

## Overview

The TickTick integration allows you to sync tasks between your Life Dashboard and TickTick account. You can:

- Sync tasks from the Capacity Planner to TickTick
- Sync brain dump items to TickTick tasks
- View your TickTick lists and task counts
- Manage your TickTick connection

## Setup

### 1. Get TickTick API Access

TickTick doesn't have a public API, but there are community-driven solutions:

1. **Option A: Use ticktick-py (Python)**
   - Install: `pip install ticktick-py`
   - Follow the setup guide: https://lazeroffmichael.github.io/ticktick-py/

2. **Option B: Use Pipedream (Recommended)**
   - Sign up at https://pipedream.com
   - Create a workflow that acts as a proxy for TickTick API calls
   - Bypasses CORS restrictions by routing requests through Pipedream
   - See detailed setup instructions below

3. **Option C: Reverse Engineer (Advanced)**
   - Use browser dev tools to inspect TickTick's network requests
   - Extract authentication tokens and API endpoints

### 2. Configure the Integration

#### Option A: Using Pipedream (Recommended)

**Step 1: Set up Pipedream Workflow**

1. **Create Pipedream Account**:
   - Go to [https://pipedream.com](https://pipedream.com)
   - Sign up for a free account

2. **Create New Workflow**:
   - Click "New Workflow"
   - Choose "HTTP / Webhook" as the trigger
   - Copy the webhook URL (you'll need this later)

3. **Add Code Steps**:
   
   **Step 1 - API Proxy**:
   ```javascript
   export default defineComponent({
     async run({ steps, $ }) {
       const { method, url, headers, body } = steps.trigger.event;
       
       // Extract the TickTick API endpoint from the request
       const ticktickEndpoint = url.replace('/api/ticktick', '');
       const ticktickUrl = `https://api.ticktick.com/api/v2${ticktickEndpoint}`;
       
       // Forward the request to TickTick
       const response = await fetch(ticktickUrl, {
         method: method || 'GET',
         headers: {
           ...headers,
           'Content-Type': 'application/json',
           'Accept': 'application/json'
         },
         body: body ? JSON.stringify(body) : undefined
       });
       
       const data = await response.json();
       
       return {
         status: response.status,
         data: data,
         headers: Object.fromEntries(response.headers.entries())
       };
     },
   })
   ```

   **Step 2 - Error Handling**:
   ```javascript
   export default defineComponent({
     async run({ steps, $ }) {
       try {
         const result = steps.code.$return_value;
         
         if (result.status >= 400) {
           throw new Error(`TickTick API error: ${result.status} - ${JSON.stringify(result.data)}`);
         }
         
         return {
           success: true,
           data: result.data,
           status: result.status
         };
       } catch (error) {
         console.error('Pipedream TickTick proxy error:', error);
         
         return {
           success: false,
           error: error.message,
           status: 500
         };
       }
     },
   })
   ```

4. **Deploy the Workflow**:
   - Click "Deploy" to make your workflow live
   - Copy the webhook URL

**Step 2: Configure Environment Variables**

1. **Create Environment File**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`**:
   ```env
   # Replace with your actual Pipedream webhook URL
   VITE_TICKTICK_PROXY_URL=https://your-workflow-id.pipedream.net
   
   # Optional: Add a shared secret for security
   VITE_TICKTICK_PROXY_KEY=your-secret-key
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

**Step 3: Connect TickTick**

1. Open the Life Dashboard
2. Click the settings gear (⚙️) in the top right
3. Scroll down to the "Integrations" section
4. Click "Connect to TickTick"
5. Enter your TickTick API token when prompted

#### Option B: Direct Integration (Limited)

1. Open the Life Dashboard
2. Click the settings gear (⚙️) in the top right
3. Scroll down to the "Integrations" section
4. Click "Connect to TickTick"
5. Enter your API token when prompted

**Note**: Direct integration may fail due to CORS restrictions. Pipedream is recommended for reliable operation.

## Features

### Task Synchronization

**Capacity Planner Sync:**
- Syncs tasks from your capacity planner to TickTick
- Each task includes duration information
- Tasks are tagged with "life-dashboard" and "capacity-planner"

**Brain Dump Sync:**
- Converts brain dump items to TickTick tasks
- Preserves priority levels
- Tasks are tagged with "life-dashboard" and "brain-dump"

### Connection Management

- **Status Display**: Shows connection status (Connected/Disconnected)
- **List View**: Displays your TickTick lists and task counts
- **Re-sync**: Update existing syncs or sync new items
- **Disconnect**: Safely disconnect from TickTick

## API Endpoints Used

The integration uses TickTick's internal API endpoints:

- `GET /user/profile` - Get user information
- `GET /project` - Get user's lists/projects
- `GET /task` - Get tasks
- `POST /task` - Create new task
- `POST /task/{id}` - Update task
- `POST /task/{id}/complete` - Complete task
- `DELETE /task/{id}` - Delete task

## Data Mapping

### Priority Levels
- High → Priority 4
- Medium → Priority 3
- Low → Priority 2
- None → Priority 1

### Task Structure
```javascript
{
  title: "Task name",
  content: "Task description",
  projectId: "list_id",
  priority: 1-4,
  dueDate: "ISO_date_string",
  tags: ["life-dashboard", "source"],
  status: 0 // 0 = active, 1 = completed
}
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify your API token is correct
   - Check if the token has expired
   - Ensure you have the necessary permissions

2. **Sync Errors**
   - Check your internet connection
   - Verify TickTick service is available
   - Check browser console for detailed error messages

3. **Missing Lists**
   - Ensure you have at least one list in TickTick
   - Try disconnecting and reconnecting

### Pipedream-Specific Issues

4. **Proxy Connection Failed**
   - Verify your `VITE_TICKTICK_PROXY_URL` is correct
   - Check that your Pipedream workflow is deployed and active
   - Test the webhook URL directly in your browser (should return a response)

5. **CORS Still Occurring**
   - Ensure you're using the proxy URL, not direct TickTick API
   - Check that environment variables are loaded (restart dev server)
   - Verify the proxy URL format: `https://your-id.pipedream.net`

6. **API Key Authentication**
   - If using `VITE_TICKTICK_PROXY_KEY`, ensure it matches in Pipedream
   - Check Pipedream workflow logs for authentication errors
   - Verify the key is being sent in the `x-api-key` header

7. **Workflow Errors**
   - Check Pipedream workflow execution logs
   - Verify the workflow steps are correctly configured
   - Test with a simple GET request first

### Debug Mode

To enable debug logging, open browser console and run:
```javascript
localStorage.setItem('debug_ticktick', 'true');
```

## Security Notes

- API tokens are stored in browser's localStorage
- Tokens are not transmitted to external servers
- All API calls are made directly to TickTick's servers
- Consider using a dedicated API key for this integration

## Limitations

- Requires manual token setup (no OAuth flow)
- Limited to basic task operations
- No real-time sync (manual sync required)
- Dependent on TickTick's internal API stability

## Future Enhancements

- OAuth2 authentication flow
- Real-time bidirectional sync
- Task completion sync from TickTick to dashboard
- Bulk operations and batch sync
- Custom field mapping
- Sync conflict resolution

## Support

For issues with the integration:

1. Check the browser console for error messages
2. Verify your TickTick account and API access
3. Test with a simple task first
4. Check the GitHub issues for known problems

## Contributing

To improve the TickTick integration:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Test thoroughly
5. Submit a pull request

The integration code is located in:
- `src/ticktick-service.js` - API service class
- `src/ticktick-integration.js` - UI component
