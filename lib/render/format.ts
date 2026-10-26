import type { Profile } from "@/lib/schemas/profile";

/**
 * Display formatting for portfolio components. Fixed English month names
 * rather than Intl, so server and client output always match.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2021-03" → "Mar 2021", "2021" → "2021". */
export function formatPartialDate(date: string): string {
  const [year, month] = date.split("-");
  if (!month) return year ?? date;
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : date;
}

/** "Mar 2021 – Now", "2018 – Feb 2021", or a single date when only one is known. */
export function formatDateRange(start?: string, end?: string, current = false): string {
  const from = start ? formatPartialDate(start) : "";
  const to = current ? "Now" : end ? formatPartialDate(end) : "";
  if (from && to) return from === to ? from : `${from} – ${to}`;
  return from || to;
}

/** Up to two initials for the photo placeholder: "Jane Perera" → "JP". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Paragraphs from text separated by blank lines. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * The profile with every hidden field removed. public_sites already does this
 * in SQL; the renderer applies it again so previews match the live site and
 * a hidden field can never reach a component by mistake.
 */
export function visibleProfile(profile: Profile): Profile {
  const { email, phone, address, dateOfBirth } = profile.contact;
  return {
    ...profile,
    photo: profile.photo?.visible ? profile.photo : undefined,
    contact: {
      email: email?.visible ? email : undefined,
      phone: phone?.visible ? phone : undefined,
      address: address?.visible ? address : undefined,
      dateOfBirth: dateOfBirth?.visible ? dateOfBirth : undefined,
    },
    links: profile.links.filter((link) => link.visible),
  };
}
