# Fleet Safety CRM - Quick Start Guide

## ⚡ 5-Minute Setup

### Windows Users

1. **Extract the project folder** to your desired location
2. **Double-click `start.bat`** in the project folder
3. Wait for Node.js modules to install (takes ~2-3 minutes on first run)
4. Your browser will automatically open to `http://localhost:5173`
5. ✅ Done! Start adding months and incidents

### macOS/Linux Users

1. **Extract the project folder** to your desired location
2. **Open Terminal** and navigate to the project:
   ```bash
   cd path/to/fleet-safety-crm
   ```
3. **Run the start script**:
   ```bash
   ./start.sh
   ```
4. Wait for Node.js modules to install (takes ~2-3 minutes on first run)
5. Your browser will automatically open to `http://localhost:5173`
6. ✅ Done! Start adding months and incidents

### Manual Setup (All Platforms)

If the scripts don't work, follow these steps:

1. **Extract the project folder**
2. **Open Terminal/Command Prompt** in the project directory
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```
5. Open your browser to the URL shown (usually `http://localhost:5173`)

## ✅ Verify Installation

You should see:
- A dark-themed interface with "Fleet Safety CRM" in the top-left
- An empty sidebar on the left with "Add Month" button
- An empty main area in the center

## 🎯 First Steps

### 1. Add Your First Month
- Click **"Add Month"** in the sidebar
- Type a month name (e.g., "January")
- Enter the year (e.g., 2024)
- Click **Add**

### 2. Add Your First Incident
- Click on the month you just created to select it
- Click **"Add Incident"** in the top right
- Choose **Traffic Ticket** or **Accident**
- Fill in:
  - Case Code: `CSO-2024-001`
  - Date: Select today's date
  - Driver Name: `John Smith`
  - Carrier Name: `ABC Trucking Co`
  - Status: `Open`
- Click **Create Incident**

### 3. Explore Features
- **Click the incident card** to expand and see details
- **Edit** - Modify the incident
- **Print** - Generate a PDF report
- **Delete** - Remove the incident
- **Search** - Type a driver name to filter

## 📂 Project Structure

```
fleet-safety-crm/
├── src/
│   ├── components/      # React components
│   ├── context/        # Global state management
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Helper functions
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── package.json        # Dependencies
├── tailwind.config.js  # Tailwind CSS config
├── vite.config.ts      # Vite config
├── README.md           # Full documentation
├── start.bat          # Windows quick start
├── start.sh           # macOS/Linux quick start
└── tsconfig.json      # TypeScript config
```

## 🛠️ Useful Commands

```bash
# Start development server (auto-reload on file changes)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📱 Screen Layout

```
┌─────────────────────────────────────┐
│         Sidebar           Main App  │
├────────┬──────────────────────────────┤
│        │ KPI Dashboard (4 cards)      │
│ Months │┌──────────────────────────────┤
│ Search │ Search Bar                   │
│        │┌──────────────────────────────┤
│        │ Add Incident Button          │
│        │┌──────────────────────────────┤
│        │ Incidents List               │
│        │ ├─ Date Header               │
│        │ │ ├─ Carrier 1               │
│        │ │ │ ├─ Incident Card         │
│        │ │ │ └─ Incident Card         │
│        │ │ └─ Carrier 2               │
│        │ │   └─ Incident Card         │
│        │ └─ Date Header               │
│        │   └─ ...                     │
└────────┴──────────────────────────────┘
```

## 🎨 UI Color Guide

| Element | Color | Meaning |
|---------|-------|---------|
| Sidebar Active | Cyan/Blue | Selected month |
| CSA/Severity Badges | Red/Amber/Green | High/Medium/Low risk |
| Status Badge | Green | Closed ✓ |
| Status Badge | Amber | Pending |
| Status Badge | Gray | Open |
| Delete Button | Red | Destructive action |
| Primary Button | Cyan | Create/Add action |

## 🔐 Data & Privacy

- **All data is stored locally** in your browser (localStorage)
- **No data is sent to any server**
- **Clearing browser data deletes everything** - back up regularly!
- **Share the data by exporting**: (future feature)

## ❓ Common Questions

**Q: Where is my data saved?**
A: In your browser's local storage. It persists between sessions unless you clear browser data.

**Q: Can I export/backup my data?**
A: Currently data is stored locally. Open Developer Tools (F12) → Application → Local Storage to see raw data.

**Q: How do I delete everything and start over?**
A: Clear your browser's site data for this domain, or delete the localStorage entries: `fleet_crm_months` and `fleet_crm_records`

**Q: Can I access this from another device?**
A: Not currently - data is stored locally on each browser. You'd need to manually export/import.

**Q: What if I get an error?**
A: Check the browser console (F12 → Console tab) for error messages. Most common issues are related to localStorage being full.

## 🐛 Troubleshooting

### "Command not found: npm"
- Node.js isn't installed. Download from https://nodejs.org/
- Restart your computer after installation

### Port 5173 already in use
- Another application is using the port
- In terminal, use: `npm run dev -- --port 5174`

### npm install fails
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

### Data disappeared
- Check localStorage in Developer Tools (F12 → Application)
- Browser storage was cleared or data corrupted
- This cannot be recovered - consider backing up regularly

### Print layout looks strange
- Use "Print to PDF" instead of system print
- Check "Print backgrounds" in print settings
- Use Chrome/Edge for best print results

## 📚 Next Steps

1. Read **README.md** for complete feature documentation
2. Explore the UI with sample data
3. Try adding different incident types (tickets vs accidents)
4. Test the search and filtering features
5. Generate a print report to see the PDF layout

## 🚀 Development Mode

While the dev server is running (`npm run dev`):
- Changes to files save instantly
- Browser auto-refreshes
- TypeScript errors shown in browser
- Full hot-reload support

Press **Ctrl+C** in the terminal to stop the server.

## 📞 Support

- Check README.md for detailed feature documentation
- Inspect browser console (F12) for error messages
- Verify Node.js version: `node --version` (should be 16 or higher)

---

**Happy incident tracking! 🚚📋**
