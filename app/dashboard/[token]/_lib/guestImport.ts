// Turns a host's spreadsheet (CSV or Excel) or picked phone contacts into
// guest rows for the import preview. Browser-only helpers; the server checks
// every row again (lib/guestRules.ts) when they're added.

export type ImportRow = { name: string; phone: string; seats: string };

// Numbers typed without a country code get the host's chosen one: "+961…" and
// "00961…" are kept, a leading 0 (local format) is replaced by the code, and
// short local numbers get the code in front. Longer numbers without + are
// assumed to already start with a country code.
export function withCountryCode(raw: string, dial: string): string {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  if (text.startsWith("+") || text.startsWith("00")) return text;
  const digits = text.replace(/\D/g, "");
  const code = dial.replace(/\D/g, "");
  if (!code) return digits;
  if (digits.startsWith("0")) return code + digits.replace(/^0+/, "");
  if (digits.length <= 8) return code + digits;
  return digits;
}

// Splits CSV text into rows (quotes, doubled quotes and newlines inside
// quotes handled). Uses ; when the first line has more ; than , (Excel in
// many locales saves CSV that way).
export function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

// Reads the guest columns from a sheet's rows. With a header row, columns are
// found by name (name / phone, number, whatsapp, mobile / seats, guests,
// people); without one, they're taken as name, number, seats in that order.
export function rowsToGuests(cells: unknown[][], dial: string): ImportRow[] {
  const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();
  if (cells.length === 0) return [];
  const header = cells[0].map((c) => text(c).toLowerCase());
  const find = (re: RegExp) => header.findIndex((h) => re.test(h));
  let nameCol = find(/name|guest name|full/);
  let phoneCol = find(/phone|number|whats|mobile|tel|cell/);
  let seatsCol = find(/seat|guests|people|pax|count|nb/);
  const hasHeader = nameCol !== -1 || phoneCol !== -1;
  if (!hasHeader) {
    nameCol = 0;
    phoneCol = 1;
    seatsCol = 2;
  }
  // "Number of guests" contains "number": prefer the seats meaning for it.
  if (phoneCol !== -1 && phoneCol === seatsCol) phoneCol = header.findIndex((h, i) => i !== seatsCol && /phone|whats|mobile|tel|cell|number/.test(h));
  const body = hasHeader ? cells.slice(1) : cells;
  return body
    .map((r) => ({
      name: text(r[nameCol]),
      phone: withCountryCode(text(r[phoneCol]), dial),
      seats: seatsCol === -1 ? "1" : text(r[seatsCol]) || "1",
    }))
    .filter((r) => r.name || r.phone);
}

export async function readGuestFile(file: File, dial: string): Promise<ImportRow[]> {
  if (/\.(xlsx)$/i.test(file.name)) {
    // Loaded only when a spreadsheet is picked; reads the first sheet.
    const { readSheet } = await import("read-excel-file/browser");
    const sheet = await readSheet(file);
    return rowsToGuests(sheet as unknown[][], dial);
  }
  return rowsToGuests(parseCsv(await file.text()), dial);
}

// The browser's contact picker (Android Chrome); absent elsewhere.
type ContactsManager = {
  select: (props: string[], opts: { multiple: boolean }) => Promise<{ name?: string[]; tel?: string[] }[]>;
};

export function contactPicker(): ContactsManager | null {
  if (typeof navigator === "undefined") return null;
  const c = (navigator as unknown as { contacts?: ContactsManager }).contacts;
  return c && typeof c.select === "function" ? c : null;
}

export async function pickContacts(dial: string): Promise<ImportRow[]> {
  const picker = contactPicker();
  if (!picker) return [];
  const picked = await picker.select(["name", "tel"], { multiple: true });
  return picked
    .map((p) => ({
      name: (p.name?.[0] ?? "").trim(),
      phone: withCountryCode(p.tel?.[0] ?? "", dial),
      seats: "1",
    }))
    .filter((r) => r.name || r.phone);
}
