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

// Decodes vCard 2.1 QUOTED-PRINTABLE text ("=D8=B3=D8=A7…") as UTF-8, so
// names exported from Android in Arabic (or any script) come through intact.
function decodeQuotedPrintable(text: string): string {
  const encoder = new TextEncoder();
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const hex = text.slice(i + 1, i + 3);
    if (text[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      const ch = String.fromCodePoint(text.codePointAt(i) ?? 0);
      bytes.push(...encoder.encode(ch));
      i += ch.length - 1;
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function unescapeVcf(value: string): string {
  return value.replace(/\\([nN,;:\\])/g, (_, c: string) => (c === "n" || c === "N" ? " " : c));
}

// Reads a contacts file (.vcf / vCard 2.1, 3.0 or 4.0) as exported from an
// iPhone's or Android phone's Contacts app, or from Google Contacts. Each
// contact becomes one guest; when a contact has several numbers the mobile
// one is used, then the preferred one, then the first.
export function parseVcf(text: string, dial: string): ImportRow[] {
  // A line starting with a space or tab continues the one before it. vCard
  // 2.1 quoted-printable values instead end a line with "=" to continue.
  const raw = text.replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const lines: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    let line = raw[i];
    const head = line.slice(0, Math.max(0, line.indexOf(":")));
    if (/QUOTED-PRINTABLE/i.test(head)) {
      while (line.endsWith("=") && i + 1 < raw.length) line = line.slice(0, -1) + raw[++i];
    }
    lines.push(line);
  }

  const rows: ImportRow[] = [];
  let card: { fn: string; n: string; tels: { value: string; types: string }[] } | null = null;

  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const [rawName, ...params] = line.slice(0, colon).split(";");
    const prop = rawName.replace(/^[^.]*\./, "").toUpperCase();
    const paramText = params.join(";").toUpperCase();
    let value = line.slice(colon + 1);
    if (params.some((p) => /^(ENCODING=)?QUOTED-PRINTABLE$/i.test(p.trim()))) value = decodeQuotedPrintable(value);

    if (prop === "BEGIN" && value.trim().toUpperCase() === "VCARD") {
      card = { fn: "", n: "", tels: [] };
    } else if (!card) {
      continue;
    } else if (prop === "FN") {
      card.fn = unescapeVcf(value).trim();
    } else if (prop === "N") {
      const [family = "", given = ""] = value.split(/(?<!\\);/).map((p) => unescapeVcf(p).trim());
      card.n = [given, family].filter(Boolean).join(" ");
    } else if (prop === "TEL") {
      const number = value.trim().replace(/^tel:/i, "");
      if (number) card.tels.push({ value: number, types: paramText });
    } else if (prop === "END" && value.trim().toUpperCase() === "VCARD") {
      const tel =
        card.tels.find((t) => /CELL|MOBILE|IPHONE/.test(t.types)) ??
        card.tels.find((t) => /PREF/.test(t.types)) ??
        card.tels[0];
      const name = (card.fn || card.n).replace(/\s+/g, " ").trim();
      const phone = withCountryCode(tel?.value ?? "", dial);
      if (name || phone) rows.push({ name, phone, seats: "1" });
      card = null;
    }
  }
  return rows;
}

export async function readGuestFile(file: File, dial: string): Promise<ImportRow[]> {
  if (/\.vcf$/i.test(file.name) || /vcard|directory/i.test(file.type)) {
    return parseVcf(await file.text(), dial);
  }
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
