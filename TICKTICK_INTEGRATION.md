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

2. **Option B: Use Pipedream**
   - Sign up at https://pipedream.com
   - Connect your TickTick account
   - Use their API endpoints

3. **Option C: Reverse Engineer (Advanced)**
   - Use browser dev tools to inspect TickTick's network requests
   - Extract authentication tokens and API endpoints

### 2. Configure the Integration

1. Open the Life Dashboard
2. Click the settings gear (⚙️) in the top right
3. Scroll down to the "Integrations" section
4. Click "Connect to TickTick"
5. Enter your API token when prompted

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
