const XLSX = require('xlsx');
const wb = XLSX.readFile('DS_PHONG_THI_SBD_CHINH_XAC.xlsx');

console.log('Sheet names:', wb.SheetNames);

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const range = ws['!ref'];
  console.log(`\n=== Sheet: "${name}" | Range: ${range} ===`);
  
  // Try reading all data with header option
  const data1 = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log('Total rows (raw):', data1.length);
  
  // Print first 15 rows to find where data starts
  const maxShow = Math.min(15, data1.length);
  for (let i = 0; i < maxShow; i++) {
    if (data1[i] && data1[i].length > 0) {
      console.log(`Row ${i}:`, JSON.stringify(data1[i]));
    }
  }
  
  // Print last 3 rows
  console.log('--- Last 3 ---');
  for (let i = Math.max(0, data1.length - 3); i < data1.length; i++) {
    if (data1[i] && data1[i].length > 0) {
      console.log(`Row ${i}:`, JSON.stringify(data1[i]));
    }
  }
}
