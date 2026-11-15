// CSV export for the dashboard's lists, run in the browser on rows it
// already has.

// Spreadsheet apps run any cell starting with = + - @ (or tab/CR) as a
// formula. Names and messages are typed by guests or hosts, so a "name" like
// =HYPERLINK(...) would otherwise become live on the host's machine. A
// leading apostrophe makes the app treat it as plain text (OWASP's
// recommended fix). Only for typed text: numbers and dates come from the app.
export function sheetText(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number) {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(fileName: string, header: string[], rows: (string | number)[][]) {
  const text = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
