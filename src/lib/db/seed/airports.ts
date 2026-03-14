import { db } from "@/lib/db";
import { airports } from "@/lib/db/schema";

const AIRPORT_DATA = [
  // Top 30 required airports
  { iataCode: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", state: "GA", location: { lat: 33.6407, lng: -84.4281 } },
  { iataCode: "ORD", name: "O'Hare International Airport", city: "Chicago", state: "IL", location: { lat: 41.9742, lng: -87.9048 } },
  { iataCode: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", state: "TX", location: { lat: 32.8998, lng: -97.0403 } },
  { iataCode: "DEN", name: "Denver International Airport", city: "Denver", state: "CO", location: { lat: 39.8561, lng: -104.6737 } },
  { iataCode: "JFK", name: "John F. Kennedy International Airport", city: "New York", state: "NY", location: { lat: 40.6413, lng: -73.7781 } },
  { iataCode: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", state: "CA", location: { lat: 33.9416, lng: -118.4085 } },
  { iataCode: "SFO", name: "San Francisco International Airport", city: "San Francisco", state: "CA", location: { lat: 37.6213, lng: -122.3790 } },
  { iataCode: "MIA", name: "Miami International Airport", city: "Miami", state: "FL", location: { lat: 25.7959, lng: -80.2906 } },
  { iataCode: "MCO", name: "Orlando International Airport", city: "Orlando", state: "FL", location: { lat: 28.4312, lng: -81.3089 } },
  { iataCode: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", state: "WA", location: { lat: 47.4502, lng: -122.3088 } },
  { iataCode: "PHX", name: "Phoenix Sky Harbor International Airport", city: "Phoenix", state: "AZ", location: { lat: 33.4373, lng: -112.0116 } },
  { iataCode: "IAH", name: "George Bush Intercontinental Airport", city: "Houston", state: "TX", location: { lat: 29.9902, lng: -95.3414 } },
  { iataCode: "BOS", name: "Boston Logan International Airport", city: "Boston", state: "MA", location: { lat: 42.3656, lng: -71.0096 } },
  { iataCode: "MSP", name: "Minneapolis-Saint Paul International Airport", city: "Minneapolis", state: "MN", location: { lat: 44.8848, lng: -93.2218 } },
  { iataCode: "DTW", name: "Detroit Metropolitan Wayne County Airport", city: "Detroit", state: "MI", location: { lat: 42.2124, lng: -83.3534 } },
  { iataCode: "CLT", name: "Charlotte Douglas International Airport", city: "Charlotte", state: "NC", location: { lat: 35.2140, lng: -80.9431 } },
  { iataCode: "FLL", name: "Fort Lauderdale-Hollywood International Airport", city: "Fort Lauderdale", state: "FL", location: { lat: 26.0726, lng: -80.1527 } },
  { iataCode: "EWR", name: "Newark Liberty International Airport", city: "Newark", state: "NJ", location: { lat: 40.6895, lng: -74.1687 } },
  { iataCode: "LGA", name: "LaGuardia Airport", city: "New York", state: "NY", location: { lat: 40.7769, lng: -73.8726 } },
  { iataCode: "BWI", name: "Baltimore/Washington International Airport", city: "Baltimore", state: "MD", location: { lat: 39.1754, lng: -76.6684 } },
  { iataCode: "SLC", name: "Salt Lake City International Airport", city: "Salt Lake City", state: "UT", location: { lat: 40.7884, lng: -111.9791 } },
  { iataCode: "SAN", name: "San Diego International Airport", city: "San Diego", state: "CA", location: { lat: 32.7338, lng: -117.1896 } },
  { iataCode: "TPA", name: "Tampa International Airport", city: "Tampa", state: "FL", location: { lat: 27.9755, lng: -82.5332 } },
  { iataCode: "AUS", name: "Austin-Bergstrom International Airport", city: "Austin", state: "TX", location: { lat: 30.1975, lng: -97.6699 } },
  { iataCode: "RDU", name: "Raleigh-Durham International Airport", city: "Raleigh", state: "NC", location: { lat: 35.8776, lng: -78.7880 } },
  { iataCode: "PBI", name: "Palm Beach International Airport", city: "West Palm Beach", state: "FL", location: { lat: 26.6832, lng: -80.0956 } },
  { iataCode: "JAX", name: "Jacksonville International Airport", city: "Jacksonville", state: "FL", location: { lat: 30.4941, lng: -81.6879 } },
  { iataCode: "SAV", name: "Savannah/Hilton Head International Airport", city: "Savannah", state: "GA", location: { lat: 32.1276, lng: -81.2021 } },
  { iataCode: "MYR", name: "Myrtle Beach International Airport", city: "Myrtle Beach", state: "SC", location: { lat: 33.6797, lng: -78.9283 } },
  { iataCode: "HHH", name: "Hilton Head Airport", city: "Hilton Head", state: "SC", location: { lat: 32.2244, lng: -80.6975 } },
  // Additional major U.S. airports
  { iataCode: "IAD", name: "Washington Dulles International Airport", city: "Washington", state: "VA", location: { lat: 38.9531, lng: -77.4558 } },
  { iataCode: "DCA", name: "Ronald Reagan Washington National Airport", city: "Washington", state: "VA", location: { lat: 38.8512, lng: -77.0377 } },
  { iataCode: "BNA", name: "Nashville International Airport", city: "Nashville", state: "TN", location: { lat: 36.1264, lng: -86.6782 } },
  { iataCode: "LAS", name: "Las Vegas Harry Reid International Airport", city: "Las Vegas", state: "NV", location: { lat: 36.0840, lng: -115.1523 } },
  { iataCode: "PDX", name: "Portland International Airport", city: "Portland", state: "OR", location: { lat: 45.5898, lng: -122.5975 } },
  { iataCode: "STL", name: "St. Louis Lambert International Airport", city: "St. Louis", state: "MO", location: { lat: 38.7487, lng: -90.3700 } },
  { iataCode: "MCI", name: "Kansas City International Airport", city: "Kansas City", state: "MO", location: { lat: 39.2976, lng: -94.7139 } },
  { iataCode: "PIT", name: "Pittsburgh International Airport", city: "Pittsburgh", state: "PA", location: { lat: 40.4915, lng: -80.2329 } },
  { iataCode: "IND", name: "Indianapolis International Airport", city: "Indianapolis", state: "IN", location: { lat: 39.7173, lng: -86.2944 } },
  { iataCode: "CVG", name: "Cincinnati/Northern Kentucky International Airport", city: "Cincinnati", state: "KY", location: { lat: 39.0488, lng: -84.6678 } },
  { iataCode: "CLE", name: "Cleveland Hopkins International Airport", city: "Cleveland", state: "OH", location: { lat: 41.4117, lng: -81.8498 } },
  { iataCode: "MKE", name: "Milwaukee Mitchell International Airport", city: "Milwaukee", state: "WI", location: { lat: 42.9472, lng: -87.8966 } },
  { iataCode: "MSY", name: "New Orleans Louis Armstrong International Airport", city: "New Orleans", state: "LA", location: { lat: 29.9934, lng: -90.2580 } },
  { iataCode: "SDL", name: "Scottsdale Airport", city: "Scottsdale", state: "AZ", location: { lat: 33.6229, lng: -111.9108 } },
  { iataCode: "HNL", name: "Honolulu Daniel K. Inouye International Airport", city: "Honolulu", state: "HI", location: { lat: 21.3187, lng: -157.9224 } },
  { iataCode: "SAT", name: "San Antonio International Airport", city: "San Antonio", state: "TX", location: { lat: 29.5337, lng: -98.4699 } },
  { iataCode: "CHS", name: "Charleston International Airport", city: "Charleston", state: "SC", location: { lat: 32.8986, lng: -80.0405 } },
  { iataCode: "TUS", name: "Tucson International Airport", city: "Tucson", state: "AZ", location: { lat: 32.1161, lng: -110.9410 } },
  { iataCode: "MRY", name: "Monterey Regional Airport", city: "Monterey", state: "CA", location: { lat: 36.5870, lng: -121.8430 } },
  { iataCode: "OTH", name: "North Bend/Coos County Airport", city: "North Bend", state: "OR", location: { lat: 43.4171, lng: -124.2461 } },
] as const;

export async function seedAirports() {
  console.log("Seeding airports...");

  // Check if already seeded
  const existing = await db.select({ iataCode: airports.iataCode }).from(airports).limit(1);
  if (existing.length > 0) {
    console.log(`  Airports already seeded (found ${existing.length}+), skipping.`);
    return;
  }

  await db.insert(airports).values(
    AIRPORT_DATA.map((a) => ({
      iataCode: a.iataCode,
      name: a.name,
      city: a.city,
      state: a.state,
      location: { lat: a.location.lat, lng: a.location.lng },
    }))
  );

  console.log(`  Inserted ${AIRPORT_DATA.length} airports.`);
}
