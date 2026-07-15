export const phoneRegex = /^01[3-9]\d{8}$/;

export function phoneToEmail(phone: string) {
  return `${phone.trim()}@asikgame.app`;
}