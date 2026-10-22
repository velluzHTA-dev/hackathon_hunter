import type { Hackathon } from "./types";

// Myanmar and its main cities, in English and Burmese. Luma writes the country as "Myanmar (Burma)".
const MYANMAR =
  /\b(myanmar|burma|yangon|rangoon|mandalay|naypyidaw|nay pyi taw|bago|mawlamyine|taunggyi|pathein|monywa|myitkyina)\b|မြန်မာ|ရန်ကုန်|မန္တလေး|နေပြည်တော်/i;

/** Whether a hackathon takes place in (or is aimed at) Myanmar, from its title and location. */
export function isMyanmar(h: Pick<Hackathon, "title" | "location">): boolean {
  return MYANMAR.test(`${h.title}\n${h.location}`);
}
