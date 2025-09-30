# Complete Pipedream + TickTick Setup Guide

This guide walks you through setting up Pipedream as a proxy to connect your Life Dashboard with TickTick, bypassing CORS restrictions.

## 🎯 What This Achieves

- **Bypasses CORS**: Routes API calls through Pipedream instead of directly from browser
- **Real TickTick Integration**: Actual task creation, updates, and syncing
- **Secure**: Uses your own Pipedream workflow with optional API key protection
- **Reliable**: No more mock mode - real data flows between systems

## 📋 Prerequisites

- TickTick account with API access
- Pipedream account (free tier available)
- Your Life Dashboard project

## 🚀 Step-by-Step Setup

### Step 1: Get Your TickTick API Token

1. **Log into TickTick** in your browser
2. **Open Developer Tools** (F12 or right-click → Inspect)
3. **Go to Network tab** and filter by "Fetch/XHR"
4. **Perform any action** in TickTick (like creating a task)
5. **Look for API requests** and find the `Authorization` header
6. **Copy the token** (it looks like: `1AE6F69232DE59211DA472CCEEB565A5...`)

**Alternative Method:**
- Use browser extension like "Requestly" to intercept API calls
- Check Local Storage for TickTick session data
- Use the `ticktick-py` Python library for easier extraction

### Step 2: Create Pipedream Workflow

1. **Sign up at [Pipedream](https://pipedream.com)**
2. **Create New Workflow**:
   - Click "New Workflow"
   - Choose "HTTP / Webhook" trigger
   - Copy the webhook URL (you'll need this)

3. **Add Code Step for TickTick API Proxy**:
   ```javascript
   export default defineComponent({
     async run({ steps, $ }) {
       const { ticktickEndpoint, ticktickMethod, ticktickHeaders, ticktickBody } = steps.trigger.event;

       // Make the request to TickTick API
       const response = await fetch(`https://api.ticktick.com/api/v2${ticktickEndpoint}`, {
         method: ticktickMethod,
         headers: ticktickHeaders,
         body: ticktickBody ? JSON.stringify(ticktickBody) : undefined
       });

       const data = await response.json();

       if (!response.ok) {
         throw new Error(`TickTick API error: ${response.status} - ${JSON.stringify(data)}`);
       }

       return {
         success: true,
         data: data,
         status: response.status
       };
     },
   })
   ```

4. **Configure the Workflow**:
   - The webhook trigger receives requests from your dashboard
   - The code step forwards the request to TickTick's API using your token
   - Returns the TickTick response back to your dashboard

5. **Deploy the Workflow**:
   - Click "Deploy" to make it live
   - Copy the webhook URL (format: `https://abc123def.pipedream.net`)

### Step 3: Configure Your Project

1. **Create Environment File**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`**:
   ```env
   # Replace with your actual Pipedream webhook URL
   VITE_TICKTICK_PROXY_URL=https://your-workflow-id.pipedream.net
   
   # Optional: Add a shared secret for security
   VITE_TICKTICK_PROXY_KEY=your-secret-key-123
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

### Step 4: Test the Integration

1. **Open the test page**: `test-pipedream-integration.html` in your browser
2. **Enter your Pipedream URL** and test the connection
3. **Enter your TickTick token** and test the API
4. **Verify everything works** before proceeding

### Step 5: Connect in Your Dashboard

1. **Open your Life Dashboard**
2. **Go to Settings** (gear icon)
3. **Find TickTick Integration** section
4. **Click "Connect to TickTick"**
5. **Enter your TickTick API token**
6. **Start syncing tasks!**

## 🔧 Advanced Configuration

### Adding API Key Security

To add an extra layer of security:

1. **In your Pipedream workflow**, modify the first code step:
   ```javascript
   export default defineComponent({
     async run({ steps, $ }) {
       const { method, url, headers, body } = steps.trigger.event;
       
       // Check for API key
       const apiKey = headers['x-api-key'];
       const expectedKey = 'your-secret-key-123'; // Set this in Pipedream
       
       if (apiKey !== expectedKey) {
         return {
           status: 401,
           data: { error: 'Unauthorized' }
         };
       }
       
       // ... rest of the code
     },
   })
   ```

2. **Set the same key** in your `.env.local`:
   ```env
   VITE_TICKTICK_PROXY_KEY=your-secret-key-123
   ```

### Custom Endpoint Mapping

If you need different endpoint mapping, modify the URL replacement logic:

```javascript
// Instead of:
const ticktickEndpoint = url.replace('/api/ticktick', '');

// Use:
const ticktickEndpoint = url.replace('/your-custom-path', '');
```

## 🐛 Troubleshooting

### Common Issues

**"Proxy Connection Failed"**
- Verify your `VITE_TICKTICK_PROXY_URL` is correct
- Check that your Pipedream workflow is deployed
- Test the webhook URL directly in browser

**"CORS Still Occurring"**
- Ensure you're using the proxy URL, not direct TickTick API
- Restart your development server after changing `.env.local`
- Check browser console for the actual request URLs

**"TickTick API Errors"**
- Verify your TickTick token is valid and not expired
- Check Pipedream workflow execution logs
- Test with a simple API call first

**"Workflow Not Responding"**
- Check Pipedream workflow is deployed and active
- Verify the workflow steps are correctly configured
- Look at Pipedream execution logs for errors

### Debug Steps

1. **Check Environment Variables**:
   ```javascript
   console.log('Proxy URL:', import.meta.env.VITE_TICKTICK_PROXY_URL);
   console.log('Proxy Key:', import.meta.env.VITE_TICKTICK_PROXY_KEY);
   ```

2. **Test Pipedream Directly**:
   ```bash
   curl -X GET "https://your-workflow-id.pipedream.net" \
        -H "Content-Type: application/json"
   ```

3. **Check Browser Network Tab**:
   - Look for requests going to your Pipedream URL
   - Verify headers are being sent correctly
   - Check response status and data

## 📊 Monitoring

### Pipedream Dashboard
- Monitor workflow executions
- Check error rates and response times
- View detailed logs for debugging

### Browser Console
- Enable debug mode: `localStorage.setItem('debug_ticktick', 'true')`
- Check for CORS errors or network failures
- Verify API responses

## 🔒 Security Considerations

- **API Keys**: Store in environment variables, never commit to git
- **Pipedream Access**: Use strong passwords and 2FA
- **Token Rotation**: Regularly update your TickTick token
- **HTTPS Only**: Always use HTTPS for webhook URLs

## 🚀 Next Steps

Once your integration is working:

1. **Test Task Syncing**: Create tasks in your dashboard and sync to TickTick
2. **Test Brain Dump**: Convert brain dump items to TickTick tasks
3. **Monitor Performance**: Check Pipedream logs for any issues
4. **Set up Monitoring**: Consider adding error alerts in Pipedream

## 📚 Additional Resources

- [Pipedream Documentation](https://pipedream.com/docs/)
- [TickTick API Reference](https://developer.ticktick.com/)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Environment Variables in Vite](https://vitejs.dev/guide/env-and-mode.html)

## 🆘 Getting Help

If you run into issues:

1. **Check the test page**: `test-pipedream-integration.html`
2. **Review Pipedream logs**: Look at workflow execution details
3. **Browser console**: Check for JavaScript errors
4. **GitHub Issues**: Report bugs or ask questions

---

**Happy Syncing! 🎉**

Your Life Dashboard should now be able to seamlessly sync with TickTick through Pipedream, giving you the best of both worlds.
