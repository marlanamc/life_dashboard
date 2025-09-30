# Life Dashboard

A beautiful, ADHD-friendly life management dashboard with time-based theming and focus tools.

## Features

### 🎨 **Time-Based Theming**

- **Day Theme** (6AM - 12PM): Fresh morning vibes with purple accents
- **Afternoon Theme** (12PM - 6PM): Ocean breeze with teal tones
- **Dusk Theme** (6PM - 7PM): Sunset glow with warm oranges
- **Evening Theme** (7PM - 6AM): Cosmic night sky with blue highlights

### 🧠 **Brain Space**

- **Simple Brain Dump**: Quick capture of thoughts and ideas
- **Priority Organization**: Drag and drop items into High/Medium/Low priority sections
- **Unsorted Items**: Automatic overflow for unorganized thoughts

### ⚡ **Energy & Capacity**

- **Visual Capacity Circle**: Organic, glowing visualization of daily energy
- **Open Planner**: Task management with duration tracking
- **Real-time Updates**: Capacity visualization updates as you add/complete tasks
- **Task Cards**: Individual task management with delete functionality

### 📋 **Project Library**

- **Project Table**: Sortable, editable project management
- **Priority System**: High/Medium/Low priority with emoji indicators
- **Category Organization**: Organize projects by type
- **Delete Functionality**: Safe project deletion with confirmation dialogs
- **External Links**: GitHub repo and Obsidian note integration

### 🎯 **Focus Tools**

- **Top Three**: Daily priority focus system
- **Welcome Card**: Personalized greeting with calendar integration
- **Data Persistence**: Local-first storage with optional Firebase sync for multi-device access

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- (Optional) Pipedream account for TickTick integration

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd life-dashboard
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Optional: Firebase Cloud Sync

1. Create a Firebase project and enable Firestore (in native mode).
2. In **Build → Authentication**, enable the **Email/Password** sign-in provider. (Anonymous sign-in is optional.)
3. Add a web app in Firebase to obtain your Firebase config object.
4. Create a `.env` file in the project root and populate the following variables:

   ```bash
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   # Optional if you plan to use the Realtime Database API
   VITE_FIREBASE_DATABASE_URL=https://your-app.firebaseio.com
   ```

5. Restart the dev server so Vite picks up the new environment variables.

With Firebase configured, the dashboard will prompt you to sign in. Once authenticated, your brain dump items and projects sync to Firestore while still caching everything locally for offline use.

### Using the Built-in Login

- Launch `npm run dev` and open the dashboard — the auth overlay guides you through sign in or account creation.
- Use the **Sign up** tab to register a new account (email + password). We store the profile in Firebase Auth.
- After signing in, the account chip in the top-right shows the active user and offers a **Log out** button.
- When you sign out, everything remains locally so you can keep working offline until you sign in again.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Install as an App

The dashboard is now a Progressive Web App. After starting the dev server or opening the production build:

1. Visit the site in Chrome, Edge, or another PWA-capable browser.
2. Open the browser menu and choose **Install Life Dashboard** (or the install icon in the address bar).
3. Launch the installed app from your dock/launcher for a distraction-free, standalone experience.

Offline support keeps the core interface and theme assets available even when you lose connectivity.

## 🔗 Integrations

### TickTick Integration

The dashboard includes built-in TickTick integration for task synchronization:

- **Sync Capacity Tasks**: Send tasks from your capacity planner to TickTick
- **Sync Brain Dump**: Convert brain dump items to TickTick tasks
- **Real-time Updates**: View your TickTick lists and task counts

**Setup Options:**
1. **Pipedream (Recommended)**: Bypass CORS restrictions with a proxy workflow
2. **Direct Integration**: Limited due to browser CORS restrictions

**Quick Start:**
- See `PIPEDREAM_SETUP_GUIDE.md` for complete setup instructions
- Use `test-pipedream-integration.html` to test your configuration
- Check `TICKTICK_INTEGRATION.md` for detailed integration docs

## Project Structure

```
src/
├── life-dashboard.js      # Main application entry point
├── data-manager.js        # Local storage and data management
├── theme-controller.js    # Time-based theme switching
├── welcome-card.js        # Personalized greeting component
├── simple-brain-dump.js   # Brain dump functionality
├── enough-capacity.js     # Energy/capacity visualization
├── projects-table.js      # Project management table
├── top-three.js          # Daily focus priorities
└── styles.css            # Global styles and theming

public/
├── manifest.webmanifest   # PWA manifest describing icons and install behavior
├── service-worker.js      # Offline caching and install prompt support
└── icons/                 # Generated app icons for desktop/mobile launchers
```

## Key Components

### DataManager

Centralized data management with localStorage persistence and reactive updates.

### ThemeController

Automatic theme switching based on time of day with smooth transitions.

### Brain Dump

ADHD-friendly thought capture with priority organization and visual feedback.

### Capacity Visualization

Organic, animated circle showing daily energy levels with task integration.

### Project Management

Full-featured project table with sorting, filtering, and CRUD operations.

## Customization

### Adding New Themes

Themes are defined in `styles.css` using CSS custom properties. Each theme includes:

- Color palette (primary, secondary, muted, etc.)
- Background gradients
- Surface colors and glass effects
- Text contrast optimizations

### Extending Components

All components are ES6 classes with consistent patterns:

- `constructor(container, dataManager)`
- `init()` - Initialize and render
- `render()` - Update DOM
- `attachEventListeners()` - Handle user interactions

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test across all themes
5. Submit a pull request

## Acknowledgments

- Inspired by ADHD-friendly design principles
- Built with modern web technologies
- Designed for productivity and focus
