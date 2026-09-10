/**
 * Standardize timestamp display across the platform:
 * Date: DD MMM YYYY (e.g., "05 Aug 2026")
 * Time: hh:mm:ss AM/PM (e.g., "05:10:39 PM")
 * Combined: "05 Aug 2026, 05:10:39 PM"
 * Converts UTC timestamps to user's local timezone.
 */

export function formatDate(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "N/A";

  const dateObj = parseToDate(dateInput);
  if (!dateObj || isNaN(dateObj.getTime())) {
    return String(dateInput);
  }

  return formatDateTimeObject(dateObj);
}

export function formatDateOnly(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "N/A";
  const dateObj = parseToDate(dateInput);
  if (!dateObj || isNaN(dateObj.getTime())) return String(dateInput);
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatTimeOnly(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "N/A";
  const dateObj = parseToDate(dateInput);
  if (!dateObj || isNaN(dateObj.getTime())) return String(dateInput);

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");

  return `${strHours}:${minutes}:${seconds} ${ampm}`;
}

function parseToDate(dateInput: string | number | Date): Date | null {
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === "number") return new Date(dateInput);

  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;

    // Handle timestamp strings like YYYYMMDD_HHMMSS
    if (/^\d{8}_\d{6}$/.test(trimmed)) {
      const year = parseInt(trimmed.substring(0, 4), 10);
      const month = parseInt(trimmed.substring(4, 6), 10) - 1;
      const day = parseInt(trimmed.substring(6, 8), 10);
      const hour = parseInt(trimmed.substring(9, 11), 10);
      const minute = parseInt(trimmed.substring(11, 13), 10);
      const second = parseInt(trimmed.substring(13, 15), 10);
      // Construct UTC date and return
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }

    // Handle SQL format "YYYY-MM-DD HH:MM:SS" or ISO without Z / offset
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(trimmed)) {
      // Treat as UTC by appending 'Z' if no timezone offset is specified
      return new Date(trimmed.replace(" ", "T") + "Z");
    }

    return new Date(trimmed);
  }

  return null;
}

function formatDateTimeObject(date: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");

  return `${day} ${month} ${year}, ${strHours}:${minutes}:${seconds} ${ampm}`;
}

