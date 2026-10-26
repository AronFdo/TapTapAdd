import { z } from "zod";

/**
 * Card codes are printed into the NFC tag and QR code as
 * `https://{ROOT_DOMAIN}/c/{code}` and are permanent once issued.
 *
 * Ten characters from Crockford's base32 alphabet (no i, l, o or u), so codes
 * are unguessable (50 bits) and easy to read aloud. The database generates
 * them with `gen_card_code()`; this schema validates them at the edges.
 */
export const CARD_CODE_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
export const CARD_CODE_LENGTH = 10;

export const CardCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(new RegExp(`^[${CARD_CODE_ALPHABET}]{${CARD_CODE_LENGTH}}$`), "Not a card code");

export const CARD_STATUSES = ["unassigned", "assigned", "inactive"] as const;
export const CardStatusSchema = z.enum(CARD_STATUSES);

export type CardCode = z.infer<typeof CardCodeSchema>;
export type CardStatus = z.infer<typeof CardStatusSchema>;
