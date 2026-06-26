const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const SOURCE_FILE = path.join(
  __dirname,
  '..',
  'data',
  'Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_20260626.xlsx'
);
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'rpl-medications.json');

const workbook = XLSX.readFile(SOURCE_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

const medications = rows
  .slice(1)
  .filter((row) => row[3] === 'Ludzki')
  .map((row) => ({
    rplId: String(row[0]),
    name: row[1],
    strength: row[7] ?? '',
    form: row[8] ?? '',
    leafletUrl: row[25] ?? null,
  }));

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(medications));
console.log(`Zapisano ${medications.length} produktów do ${OUTPUT_FILE}`);
