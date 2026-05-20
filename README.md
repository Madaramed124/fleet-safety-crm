

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for build tooling
- **React Context API** for state management



### Adding a Month

1. Click **"Add Month"** in the sidebar
2. Enter the month name (e.g., "January") and year
3. Click **Add** to create the operational month
4. The month card shows a badge with the incident count

### Creating an Incident

1. Select a month from the sidebar
2. Click **"Add Incident"** in the top action bar
3. Choose **Traffic Ticket** or **Accident**
4. Fill in required fields:
   - Case Code (e.g., CSO-2024-001)
   - Date
   - Driver Name
   - Carrier Name
   - Status (Open, Pending, Closed)

#### For Traffic Tickets:
- Set CSA Severity (High, Medium, Low)
- Mark if attorney is assigned
- Mark if it's a recurring offense
- Add violations with codes, descriptions, and severity
- Add fines with descriptions and amounts

#### For Accidents:
- Set accident severity (Critical, Major, Minor)
- Mark if FMCSA recordable
- Mark if vehicle was towed
- Add injuries with descriptions and severity

### Viewing KPIs

- Select a month to see real-time aggregated data:
  - **Total Tickets** - Count of all traffic tickets
  - **Total Accidents** - Count of all accidents
  - **Total Violations** - Sum of all violations in tickets
  - **Total Fines** - Sum of all financial penalties

### Searching Incidents

1. Type in the search box at the top
2. Matching text in driver names, case codes, and carrier names will highlight instantly
3. Clear the search to see all incidents for the month

### Editing an Incident

1. Click on an incident card to expand it
2. Click the **Edit** button
3. Modify any fields (type cannot be changed)
4. Click **Update Incident**

### Deleting an Incident

1. Expand the incident card
2. Click **Delete**
3. Click **Confirm** to permanently remove the incident
4. Click **Cancel** to abort

### Printing an Incident

1. Expand the incident card
2. Click **Print**
3. The incident will open in print preview
4. Use your browser's print function to save as PDF or print to paper
5. The layout is optimized for black-and-white printing

## Data Structure

### Ticket Record
```typescript
{
  id: string
  monthId: string
  date: string
  caseCode: string
  driverName: string
  carrierName: string
  status: "Open" | "Pending" | "Closed"
  notes: string
  type: "ticket"
  csaSeverity: "High" | "Medium" | "Low"
  hasAttorney: boolean
  isRecurring: boolean
  violations: Violation[] // { id, code, description, severity }
  fines: Fine[] // { id, description, amount }
}
```

### Accident Record
```typescript
{
  id: string
  monthId: string
  date: string
  caseCode: string
  driverName: string
  carrierName: string
  status: "Open" | "Pending" | "Closed"
  notes: string
  type: "accident"
  severity: "Critical" | "Major" | "Minor"
  isFmcsaRecordable: boolean
  vehicleTowed: boolean
  injuries: Injury[] // { id, description, severity }
}
```

## Data Persistence

All data is automatically saved to browser localStorage under two keys:
- `fleet_crm_months` - Operational months
- `fleet_crm_records` - Incident records

Data persists across browser sessions. Clearing browser data will reset the application.

## Keyboard Shortcuts

- **Enter** - Submit forms in input fields
- **Escape** - Close modals and cancel operations

## Color Coding

| Color | Meaning |
|-------|---------|
| 🔵 Cyan | Active selections, links, primary actions |
| 🔴 Red | Critical severity, delete operations, FMCSA incidents |
| 🟡 Amber | Medium severity, warnings, search highlights |
| 🟢 Green | Closed cases, success states, low severity |

## Design Features

- **High-Contrast Dark Theme** - Optimized for readability and reduced eye strain
- **Responsive Layout** - Works on desktop and tablet
- **Non-Destructive Printing** - Print layout doesn't affect dashboard view
- **Smooth Animations** - Transitions and hover states for visual feedback
- **Professional Typography** - Monospace fonts for data, sans-serif for body text

## Performance

- Memoized filtering pipeline prevents unnecessary re-renders
- Efficient grouping and sorting algorithms
- Minimal bundle size with Vite
- Fast search with string matching

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any modern browser with ES2020 support

## Troubleshooting

### Data not persisting
- Check that localStorage is enabled in your browser
- Clear browser cache if data appears corrupted
- Open Developer Tools → Application → Local Storage to verify

### Search not highlighting
- Ensure you've typed in the search box
- Search is case-insensitive
- Matches partial strings (e.g., "john" matches "Johnny Smith")

### Print layout looks wrong
- Use "Print to PDF" instead of print preview
- Ensure "Print backgrounds" is enabled in print settings
- Set margins to minimal/none

## Support

For issues or feature requests, check the browser console (F12) for error messages.

## License

© 2026 Fleet Safety CRM. All rights reserved.
