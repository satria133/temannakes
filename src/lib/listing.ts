import { HIGHLIGHT_DAYS_BEFORE, LISTING_WINDOW_DAYS } from "@/lib/constants";

export function isWithinListingWindow(eventDate: Date, now = new Date()) {
  const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= -1 && diffDays <= LISTING_WINDOW_DAYS;
}

export function isHighlighted(eventDate: Date, now = new Date()) {
  const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= HIGHLIGHT_DAYS_BEFORE;
}
