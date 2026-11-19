import test from "node:test";
import assert from "node:assert/strict";
import { filterVenues, getBearing, getDistanceMiles } from "../utils/venueDiscovery.ts";

const venues = [
  { id: 1, name: "Quiet Tavern", address: "King St", category: "Tavern", crowdLevel: "Quiet", priceTier: 1 },
  { id: 2, name: "Lively Grill", address: "Calhoun St", category: "Grill", crowdLevel: "Lively", priceTier: 3 },
];

test("bearing returns cardinal directions and wraps into 0..360", () => {
  assert.ok(Math.abs(getBearing(0, 0, 1, 0)) < 1e-8);
  assert.ok(Math.abs(getBearing(0, 0, 0, 1) - 90) < 1e-8);
  assert.ok(getBearing(0, 0, -1, -1) >= 0);
  assert.ok(getBearing(0, 0, -1, -1) < 360);
});

test("distance uses miles and returns zero for the same point", () => {
  assert.equal(getDistanceMiles(0, 0, 0, 0), 0);
  assert.ok(Math.abs(getDistanceMiles(0, 0, 0, 1) - 69.09) < 0.2);
});

test("venue filters combine case-insensitive search, crowd, and price", () => {
  assert.deepEqual(filterVenues(venues, { search: "KING", crowd: "Quiet", price: 1 }).map((v) => v.id), [1]);
  assert.deepEqual(filterVenues(venues, { search: "", crowd: "Quiet", price: 3 }), []);
});
