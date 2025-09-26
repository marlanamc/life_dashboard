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
- **Data Persistence**: All data saved locally in browser

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

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

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

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
