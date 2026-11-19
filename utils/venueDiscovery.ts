import type { BarResponse } from "../types/bar";

export type VenueFilters = { search: string; crowd: string; price: number | null };

export function filterVenues(venues: BarResponse[], filters: VenueFilters): BarResponse[] {
  const query = filters.search.trim().toLocaleLowerCase();
  return venues.filter((venue) =>
    (!query || `${venue.name} ${venue.address ?? ""} ${venue.category}`.toLocaleLowerCase().includes(query)) &&
    (!filters.crowd || venue.crowdLevel === filters.crowd) &&
    (filters.price === null || venue.priceTier === filters.price)
  );
}

export function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (degrees: number) => degrees * Math.PI / 180;
  const dLon = rad(lon2 - lon1);
  const a = rad(lat1); const b = rad(lat2);
  const y = Math.sin(dLon) * Math.cos(b);
  const x = Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (degrees: number) => degrees * Math.PI / 180;
  const dLat = rad(lat2 - lat1); const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getVenueDescription(category: string, crowdLevel: string): string {
  const type = category.toLocaleLowerCase();
  if (type.includes("waterfront")) return "Waterfront views and easygoing drinks.";
  if (type.includes("music")) return "Live music, drinks, and a lively crowd.";
  if (type.includes("brewery")) return "Local brews and a relaxed taproom feel.";
  if (type.includes("cocktail") || type.includes("speakeasy")) return "Cocktails and a more polished night out.";
  if (type.includes("sports")) return "Big screens, game-day drinks, and pub food.";
  if (type.includes("restaurant") || type.includes("grill")) return "A neighborhood food spot with a full bar.";
  if (type.includes("pub")) return "Classic pub fare and relaxed neighborhood drinks.";
  if (type.includes("tavern")) return "Casual drinks and a laid-back local feel.";
  if (type.includes("lounge")) return "A comfortable spot for a slower-paced night.";
  return crowdLevel === "Quiet" ? "A quieter spot for an easy drink." : "A casual local spot for drinks and conversation.";
}

export function getMapPin(venue: BarResponse): { latitude: number; longitude: number } | null {
  if (venue.latitude == null || venue.longitude == null) return null;
  // These two venues share a street address; offset this pin slightly so both remain tappable.
  if (venue.name === "All My Exes") {
    return { latitude: venue.latitude + 0.00018, longitude: venue.longitude + 0.0001 };
  }
  return { latitude: venue.latitude, longitude: venue.longitude };
}
