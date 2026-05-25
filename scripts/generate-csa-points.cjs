const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const workbookPath = path.resolve(process.cwd(), 'CSA_points_cheat_sheet.xlsx');
const outputPath = path.resolve(process.cwd(), 'src/data/csaPoints.json');

const requiredSheets = [
  'Unsafe Driving',
  'Driver Fitness',
  'Vehicle Maint',
  'Cargo-Related',
  'Fatigued Driving',
  'Controlled Substances'
];

if (!fs.existsSync(workbookPath)) {
  throw new Error(`Missing workbook at ${workbookPath}. Place CSA_points_cheat_sheet.xlsx in the repo root and rerun this script.`);
}

const workbook = XLSX.readFile(workbookPath);
const missingSheets = requiredSheets.filter((sheet) => !workbook.SheetNames.includes(sheet));

if (missingSheets.length > 0) {
  throw new Error(`Missing sheets: ${missingSheets.join(', ')}`);
}

const lookup = {};

for (const sheetName of requiredSheets) {
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

  for (const row of rows) {
    const section = String(row['Section number'] || row['Section Number'] || '').trim();
    const description = String(row['Violation Description'] || '').trim();
    const group = String(row['Violation Group'] || '').trim();
    const severity = Number(row['Severity Weight']);
    const weight = Number(row['Time Weight']);

    if (!section) {
      continue;
    }

    const normalizedKey = section.toLowerCase();

    lookup[normalizedKey] = {
      description,
      group,
      category: sheetName,
      severity: Number.isFinite(severity) ? severity : 0,
      weight: Number.isFinite(weight) ? weight : 0
    };
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(lookup, null, 2)}\n`);

console.log(`Wrote ${Object.keys(lookup).length} CSA lookup entries to ${outputPath}`);
