const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const outputPath = path.resolve(process.cwd(), 'src/data/csaPoints.json');

const requiredSheets = [
  'Unsafe Driving',
  'Driver Fitness',
  'Vehicle Maint',
  'Cargo-Related',
  'Fatigued Driving',
  'Controlled Substances'
];

const candidateWorkbookNames = [
  'CSA_points_cheat_sheet.xlsx',
  'CSA points cheat sheet.xlsx',
  'csa points cheaat sheet.xlsx'
];

const findWorkbookPath = () => {
  for (const candidate of candidateWorkbookNames) {
    const workbookPath = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(workbookPath)) {
      return workbookPath;
    }
  }

  const rootFiles = fs.readdirSync(process.cwd(), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.xlsx'))
    .map((entry) => path.resolve(process.cwd(), entry.name));

  for (const workbookPath of rootFiles) {
    try {
      const workbook = XLSX.readFile(workbookPath);
      if (requiredSheets.every((sheet) => workbook.SheetNames.includes(sheet))) {
        return workbookPath;
      }
    } catch (error) {
      // Ignore invalid or unreadable files and keep searching.
    }
  }

  throw new Error(`Missing workbook. Save one of: ${candidateWorkbookNames.join(', ')} in the repo root and rerun this script.`);
};

const getValue = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }

  return '';
};

const workbookPath = findWorkbookPath();
const workbook = XLSX.readFile(workbookPath);
const missingSheets = requiredSheets.filter((sheet) => !workbook.SheetNames.includes(sheet));

if (missingSheets.length > 0) {
  throw new Error(`Missing sheets: ${missingSheets.join(', ')}`);
}

const lookup = {};

for (const sheetName of requiredSheets) {
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

  for (const row of rows) {
    const section = String(getValue(row, ['Section', 'Section number', 'Section Number'])).trim();
    const description = String(getValue(row, [
      'Violation Description Shown on Driver/Vehicle Examination Report Given to CMV Driver after Roadside Inspection',
      'Violation Description'
    ])).trim();
    const group = String(getValue(row, ['Violation Group Description', 'Violation Group'])).trim();
    const severity = Number(getValue(row, ['Violation Severity Weight', 'Severity Weight']));
    const weight = Number(getValue(row, ['Violation Time Weight', 'Time Weight']));

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
