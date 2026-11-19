import type { BarCreate } from "@/types/bar";

// Coordinates are null where the supplied data did not include a verified pin.
// They remain available in venue lists without being rendered at (0, 0).
export const bars_data: BarCreate[] = [
  { name: "Burns Alley Tavern", address: "354B King St, Charleston, SC 29401", latitude: 32.7850396, longitude: -79.9353964, category: "Tavern", crowdLevel: "Lively", priceTier: 2 },
  { name: "Big Gun Burger Shop & Bar", address: "137 Calhoun St, Charleston, SC 29401", latitude: 32.7861016, longitude: -79.9349774, category: "Restaurant", crowdLevel: "Moderate", priceTier: 2 },
  { name: "A.C.'s Bar & Grill", address: "467 King St, Charleston, SC 29403", latitude: 32.7890882, longitude: -79.9386555, category: "Bar & Grill", crowdLevel: "Lively", priceTier: 1 },
  { name: "Recovery Room Tavern", address: "685 King St, Charleston, SC 29403", latitude: 32.7965179, longitude: -79.9446329, category: "Tavern", crowdLevel: "Quiet", priceTier: 1 },
  { name: "The Griffon", address: "18 Vendue Range, Charleston, SC 29401", latitude: null, longitude: null, category: "Pub", crowdLevel: "Moderate", priceTier: 2 },
  { name: "Big John's Tavern", address: "251 E Bay St, Charleston, SC 29401", latitude: null, longitude: null, category: "Tavern", crowdLevel: "Lively", priceTier: 1 },
  { name: "Cutty's", address: "227 St Philip St, Charleston, SC 29403", latitude: null, longitude: null, category: "Tavern", crowdLevel: "Lively", priceTier: 1 },
  { name: "Prohibition", address: "547 King St, Charleston, SC 29403", latitude: null, longitude: null, category: "Cocktail Bar", crowdLevel: "Lively", priceTier: 3 },
  { name: "Last Saint", address: "472 Meeting St B, Charleston, SC 29403", latitude: null, longitude: null, category: "Cocktail Bar", crowdLevel: "Moderate", priceTier: 3 },
  { name: "Madison Maison", address: "145 Calhoun St Unit 201, Charleston, SC 29401", latitude: null, longitude: null, category: "Lounge", crowdLevel: "Lively", priceTier: 3 },
  { name: "Scotty Doesn't Know Speakeasy", address: "251 E Bay St, Charleston, SC 29401", latitude: null, longitude: null, category: "Speakeasy", crowdLevel: "Moderate", priceTier: 3 },
  { name: "Little Palm", address: "237 Meeting St, Charleston, SC 29401", latitude: null, longitude: null, category: "Lounge", crowdLevel: "Moderate", priceTier: 2 },
  { name: "Bar Vauté", address: "1 Broad St Fl B, Charleston, SC 29401", latitude: null, longitude: null, category: "Lounge", crowdLevel: "Moderate", priceTier: 3 },
  { name: "Edmund's Oast Brewing Co.", address: "1505 King St #115, Charleston, SC 29405", latitude: null, longitude: null, category: "Brewery", crowdLevel: "Lively", priceTier: 2 },

  // West Ashley (Charleston, SC 29407 / 29414)
  { name: "Frothy Beard Brewing Company", address: "1401 Sam Rittenberg Blvd, Charleston, SC 29407", latitude: null, longitude: null, category: "Brewery", crowdLevel: "Lively", priceTier: 2 },
  { name: "Charles Towne Fermentory - Avondale", address: "809 Savannah Hwy, Charleston, SC 29407", latitude: null, longitude: null, category: "Brewery", crowdLevel: "Moderate", priceTier: 2 },
  { name: "The Garden by Charles Towne Fermentory", address: "1331 Ashley River Rd, Charleston, SC 29407", latitude: null, longitude: null, category: "Brewery", crowdLevel: "Lively", priceTier: 2 },
  { name: "House of Brews West Ashley", address: "2376 Ashley River Rd, Charleston, SC 29414", latitude: null, longitude: null, category: "Craft Beer Bar", crowdLevel: "Moderate", priceTier: 2 },
  { name: "Gene's Haufbrau", address: "817 Savannah Hwy, Charleston, SC 29407", latitude: null, longitude: null, category: "Tavern", crowdLevel: "Lively", priceTier: 1 },
  { name: "The Roost", address: "825 Savannah Hwy, Charleston, SC 29407", latitude: null, longitude: null, category: "Sports Bar", crowdLevel: "Lively", priceTier: 2 },
  { name: "All My Exes", address: "825 Savannah Hwy Ste B, Charleston, SC 29407", latitude: null, longitude: null, category: "Cocktail Bar", crowdLevel: "Moderate", priceTier: 3 },
  { name: "Triangle Char & Bar", address: "828 Savannah Hwy, Charleston, SC 29407", latitude: null, longitude: null, category: "Bar & Grill", crowdLevel: "Lively", priceTier: 2 },
  { name: "Tin Roof", address: "1117 Magnolia Rd, Charleston, SC 29407", latitude: null, longitude: null, category: "Live Music Bar", crowdLevel: "Lively", priceTier: 1 },
  { name: "The Pub On 61", address: "2366 Ashley River Rd, Charleston, SC 29414", latitude: null, longitude: null, category: "Pub", crowdLevel: "Lively", priceTier: 1 },
  { name: "R Pub", address: "1836 Ashley River Rd Ste H, Charleston, SC 29407", latitude: null, longitude: null, category: "Pub", crowdLevel: "Moderate", priceTier: 1 },
  { name: "Hunley's Neighborhood Grill", address: "1750 Savannah Hwy, Charleston, SC 29407", latitude: null, longitude: null, category: "Bar & Grill", crowdLevel: "Lively", priceTier: 1 },

  // James Island (Charleston, SC 29412)
  { name: "The Charleston Pour House", address: "1977 Maybank Hwy, Charleston, SC 29412", latitude: null, longitude: null, category: "Live Music Bar", crowdLevel: "Lively", priceTier: 2 },

  // Mount Pleasant (Mt Pleasant, SC 29464 / 29466)
  { name: "Red's Ice House", address: "98 Church St, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Waterfront Bar", crowdLevel: "Lively", priceTier: 2 },
  { name: "Vickery's Bar & Grill", address: "1313 Shrimp Boat Ln, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Bar & Grill", crowdLevel: "Moderate", priceTier: 2 },
  { name: "Muddy's Dockside Bar", address: "1313 Shrimp Boat Ln, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Waterfront Bar", crowdLevel: "Lively", priceTier: 2 },
  { name: "Sunsets Creekside Bar", address: "97 Ronnie Boals Blvd, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Waterfront Bar", crowdLevel: "Moderate", priceTier: 2 },
  { name: "Coleman Public House", address: "427 W Coleman Blvd, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Pub", crowdLevel: "Moderate", priceTier: 2 },
  { name: "The Shelter Kitchen + Bar", address: "202 Coleman Blvd, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Bar & Grill", crowdLevel: "Lively", priceTier: 2 },
  { name: "The Southern Bar & Grill", address: "730 Coleman Blvd, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Bar & Grill", crowdLevel: "Lively", priceTier: 2 },
  { name: "Art's Bar & Grill", address: "413 Coleman Blvd, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Bar & Grill", crowdLevel: "Moderate", priceTier: 1 },
  { name: "NEAT Bourbon Bar Mount Pleasant", address: "440 W Coleman Blvd, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Cocktail Bar", crowdLevel: "Moderate", priceTier: 3 },
  { name: "Saint Urban's", address: "357 N Shelmore Blvd 357 Suite A First Floor, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Wine & Cocktail Bar", crowdLevel: "Quiet", priceTier: 3 },
  { name: "The Perch", address: "644 Coleman Blvd, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Cocktail Lounge", crowdLevel: "Moderate", priceTier: 2 },
  { name: "The Spirit Bar", address: "100 Ferry Wharf Rd, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Bar", crowdLevel: "Quiet", priceTier: 3 },
  { name: "Two Blokes Brewing", address: "547 Long Point Rd #101, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Brewery", crowdLevel: "Moderate", priceTier: 2 },
  { name: "Hobcaw Brewing Company", address: "496 Long Point Rd, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Brewery", crowdLevel: "Moderate", priceTier: 2 },
  { name: "Westbrook Brewing Company", address: "510 Ridge Rd, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Brewery", crowdLevel: "Moderate", priceTier: 2 },
  { name: "Crafty Draught", address: "1965 Riviera Dr, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Craft Beer Bar", crowdLevel: "Moderate", priceTier: 2 },
  { name: "Charleston Sports Pub", address: "1909 N Hwy 17, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Sports Bar", crowdLevel: "Lively", priceTier: 2 },
  { name: "Woodward Tavern", address: "1971 Riviera Dr #3, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Tavern", crowdLevel: "Lively", priceTier: 2 },
  { name: "All American Sports Bar", address: "545 Belle Station Blvd, Mt Pleasant, SC 29464", latitude: null, longitude: null, category: "Sports Bar", crowdLevel: "Lively", priceTier: 2 },
  { name: "Bohemian Bull", address: "2668 N Hwy 17, Mt Pleasant, SC 29466", latitude: null, longitude: null, category: "Bar & Grill", crowdLevel: "Lively", priceTier: 2 },

  // North Charleston (North Charleston, SC 29405 / 29406 / 29418)
  { name: "The Tattooed Moose", address: "4845 Chateau Ave, North Charleston, SC 29405", latitude: null, longitude: null, category: "Tavern", crowdLevel: "Lively", priceTier: 2 },
  { name: "Paddock & Whisky", address: "1074 E Montague Ave Unit A, North Charleston, SC 29405", latitude: null, longitude: null, category: "Cocktail Bar", crowdLevel: "Moderate", priceTier: 2 },
  { name: "Sissy Bar Park Circle", address: "1067 E Montague Ave, North Charleston, SC 29405", latitude: null, longitude: null, category: "Cocktail Bar", crowdLevel: "Lively", priceTier: 2 },
  { name: "The Mill", address: "1026 E Montague Ave, North Charleston, SC 29405", latitude: null, longitude: null, category: "Pub", crowdLevel: "Lively", priceTier: 1 },
];