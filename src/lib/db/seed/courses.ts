import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";

type AccessType = "public" | "resort" | "semi_private" | "private" | "unknown";

interface CourseSeed {
  name: string;
  city: string;
  state: string;
  location: { lat: number; lng: number };
  accessType: AccessType;
  priceBandMin: string;
  priceBandMax: string;
  reasonsToPlay?: string;
}

const COURSE_DATA: CourseSeed[] = [
  // === CALIFORNIA ===
  { name: "Pebble Beach Golf Links", city: "Pebble Beach", state: "CA", location: { lat: 36.5688, lng: -121.9488 }, accessType: "resort", priceBandMin: "525.00", priceBandMax: "575.00", reasonsToPlay: "Iconic cliffside holes along the Pacific. Host of multiple U.S. Opens. Bucket-list course for every golfer." },
  { name: "Spyglass Hill Golf Course", city: "Pebble Beach", state: "CA", location: { lat: 36.5825, lng: -121.9537 }, accessType: "resort", priceBandMin: "395.00", priceBandMax: "425.00", reasonsToPlay: "Robert Trent Jones Sr. masterpiece weaving through dunes and Del Monte Forest." },
  { name: "The Links at Spanish Bay", city: "Pebble Beach", state: "CA", location: { lat: 36.6106, lng: -121.9476 }, accessType: "resort", priceBandMin: "295.00", priceBandMax: "315.00" },
  { name: "Torrey Pines South Course", city: "La Jolla", state: "CA", location: { lat: 32.9005, lng: -117.2523 }, accessType: "public", priceBandMin: "202.00", priceBandMax: "252.00", reasonsToPlay: "Municipal course with a major championship pedigree. Stunning ocean views along the cliffs." },
  { name: "Torrey Pines North Course", city: "La Jolla", state: "CA", location: { lat: 32.8993, lng: -117.2511 }, accessType: "public", priceBandMin: "130.00", priceBandMax: "180.00" },
  { name: "Pasatiempo Golf Club", city: "Santa Cruz", state: "CA", location: { lat: 36.9838, lng: -122.0279 }, accessType: "public", priceBandMin: "260.00", priceBandMax: "295.00" },
  { name: "Half Moon Bay Golf Links - Ocean", city: "Half Moon Bay", state: "CA", location: { lat: 37.4371, lng: -122.4413 }, accessType: "resort", priceBandMin: "225.00", priceBandMax: "275.00" },
  { name: "Pelican Hill Golf Club - Ocean South", city: "Newport Beach", state: "CA", location: { lat: 33.5701, lng: -117.8406 }, accessType: "resort", priceBandMin: "275.00", priceBandMax: "325.00" },
  { name: "PGA West Stadium Course", city: "La Quinta", state: "CA", location: { lat: 33.7002, lng: -116.2857 }, accessType: "resort", priceBandMin: "199.00", priceBandMax: "279.00" },
  { name: "Desert Willow Firecliff", city: "Palm Desert", state: "CA", location: { lat: 33.7397, lng: -116.3341 }, accessType: "public", priceBandMin: "100.00", priceBandMax: "175.00" },

  // === FLORIDA ===
  { name: "TPC Sawgrass Stadium Course", city: "Ponte Vedra", state: "FL", location: { lat: 30.1975, lng: -81.3945 }, accessType: "resort", priceBandMin: "450.00", priceBandMax: "575.00", reasonsToPlay: "Home of THE PLAYERS Championship and the famous island-green 17th. A must-play for any trip to northeast Florida." },
  { name: "Streamsong Red", city: "Bowling Green", state: "FL", location: { lat: 27.6307, lng: -81.8311 }, accessType: "resort", priceBandMin: "200.00", priceBandMax: "295.00", reasonsToPlay: "Links-style golf in the heart of Florida with massive sand dunes. Coore & Crenshaw design." },
  { name: "Streamsong Blue", city: "Bowling Green", state: "FL", location: { lat: 27.6257, lng: -81.8261 }, accessType: "resort", priceBandMin: "200.00", priceBandMax: "295.00" },
  { name: "Streamsong Black", city: "Bowling Green", state: "FL", location: { lat: 27.6350, lng: -81.8354 }, accessType: "resort", priceBandMin: "250.00", priceBandMax: "350.00" },
  { name: "TPC Danzanita at World Golf Village", city: "St. Augustine", state: "FL", location: { lat: 29.9637, lng: -81.5099 }, accessType: "public", priceBandMin: "100.00", priceBandMax: "189.00" },
  { name: "Innisbrook Copperhead Course", city: "Palm Harbor", state: "FL", location: { lat: 28.1013, lng: -82.7567 }, accessType: "resort", priceBandMin: "175.00", priceBandMax: "295.00" },
  { name: "Bay Hill Club & Lodge", city: "Orlando", state: "FL", location: { lat: 28.4619, lng: -81.5073 }, accessType: "resort", priceBandMin: "250.00", priceBandMax: "395.00" },
  { name: "Orange County National - Panther Lake", city: "Winter Garden", state: "FL", location: { lat: 28.5144, lng: -81.5919 }, accessType: "public", priceBandMin: "89.00", priceBandMax: "159.00" },
  { name: "Reunion Resort Watson Course", city: "Kissimmee", state: "FL", location: { lat: 28.3188, lng: -81.5821 }, accessType: "resort", priceBandMin: "100.00", priceBandMax: "179.00" },
  { name: "ChampionsGate National", city: "Davenport", state: "FL", location: { lat: 28.2905, lng: -81.6175 }, accessType: "resort", priceBandMin: "85.00", priceBandMax: "149.00" },
  { name: "Waldorf Astoria Golf Club", city: "Orlando", state: "FL", location: { lat: 28.3550, lng: -81.5950 }, accessType: "resort", priceBandMin: "100.00", priceBandMax: "195.00" },
  { name: "Falcon's Fire Golf Club", city: "Kissimmee", state: "FL", location: { lat: 28.3281, lng: -81.4351 }, accessType: "public", priceBandMin: "59.00", priceBandMax: "129.00" },
  { name: "Shingle Creek Golf Club", city: "Orlando", state: "FL", location: { lat: 28.4025, lng: -81.4283 }, accessType: "public", priceBandMin: "65.00", priceBandMax: "119.00" },
  { name: "Royal St. Cloud Golf Links", city: "St. Cloud", state: "FL", location: { lat: 28.2480, lng: -81.2780 }, accessType: "public", priceBandMin: "35.00", priceBandMax: "79.00" },
  { name: "PGA National Champion Course", city: "Palm Beach Gardens", state: "FL", location: { lat: 26.8385, lng: -80.1511 }, accessType: "resort", priceBandMin: "250.00", priceBandMax: "395.00" },
  { name: "Doral TPC Blue Monster", city: "Miami", state: "FL", location: { lat: 25.8131, lng: -80.3398 }, accessType: "resort", priceBandMin: "250.00", priceBandMax: "395.00" },
  { name: "Crandon Golf at Key Biscayne", city: "Key Biscayne", state: "FL", location: { lat: 25.6933, lng: -80.1621 }, accessType: "public", priceBandMin: "75.00", priceBandMax: "200.00" },

  // === SOUTH CAROLINA ===
  { name: "Kiawah Island Ocean Course", city: "Kiawah Island", state: "SC", location: { lat: 32.6088, lng: -80.0565 }, accessType: "resort", priceBandMin: "350.00", priceBandMax: "450.00", reasonsToPlay: "Pete Dye's masterwork on the Atlantic. Host of the 2021 PGA Championship. Wind makes every round an adventure." },
  { name: "Caledonia Golf & Fish Club", city: "Pawleys Island", state: "SC", location: { lat: 33.4291, lng: -79.1042 }, accessType: "public", priceBandMin: "170.00", priceBandMax: "230.00" },
  { name: "True Blue Golf Club", city: "Pawleys Island", state: "SC", location: { lat: 33.4447, lng: -79.1197 }, accessType: "public", priceBandMin: "100.00", priceBandMax: "175.00" },
  { name: "Harbour Town Golf Links", city: "Hilton Head", state: "SC", location: { lat: 32.1362, lng: -80.8168 }, accessType: "resort", priceBandMin: "325.00", priceBandMax: "450.00", reasonsToPlay: "Iconic lighthouse finish on Hilton Head. Home of the RBC Heritage. Pete Dye and Jack Nicklaus collaboration." },
  { name: "Tidewater Golf Club", city: "North Myrtle Beach", state: "SC", location: { lat: 33.8372, lng: -78.6926 }, accessType: "public", priceBandMin: "75.00", priceBandMax: "159.00" },
  { name: "Barefoot Resort Dye Course", city: "North Myrtle Beach", state: "SC", location: { lat: 33.8105, lng: -78.7494 }, accessType: "resort", priceBandMin: "79.00", priceBandMax: "159.00" },
  { name: "TPC Myrtle Beach", city: "Murrells Inlet", state: "SC", location: { lat: 33.5171, lng: -79.0473 }, accessType: "public", priceBandMin: "89.00", priceBandMax: "179.00" },
  { name: "Grande Dunes Resort Course", city: "Myrtle Beach", state: "SC", location: { lat: 33.7452, lng: -78.8371 }, accessType: "resort", priceBandMin: "89.00", priceBandMax: "165.00" },

  // === NORTH CAROLINA ===
  { name: "Pinehurst No. 2", city: "Pinehurst", state: "NC", location: { lat: 35.1910, lng: -79.4694 }, accessType: "resort", priceBandMin: "395.00", priceBandMax: "595.00", reasonsToPlay: "The cradle of American golf. Donald Ross masterpiece with famously challenging crowned greens. Host of multiple U.S. Opens." },
  { name: "Pinehurst No. 4", city: "Pinehurst", state: "NC", location: { lat: 35.2010, lng: -79.4710 }, accessType: "resort", priceBandMin: "250.00", priceBandMax: "395.00" },
  { name: "Pinehurst No. 8", city: "Pinehurst", state: "NC", location: { lat: 35.1850, lng: -79.4605 }, accessType: "resort", priceBandMin: "200.00", priceBandMax: "325.00" },
  { name: "Tobacco Road Golf Club", city: "Sanford", state: "NC", location: { lat: 35.3950, lng: -79.2350 }, accessType: "public", priceBandMin: "69.00", priceBandMax: "135.00" },
  { name: "Pine Needles Lodge & Golf Club", city: "Southern Pines", state: "NC", location: { lat: 35.1601, lng: -79.3907 }, accessType: "resort", priceBandMin: "175.00", priceBandMax: "295.00" },
  { name: "Mid Pines Inn & Golf Club", city: "Southern Pines", state: "NC", location: { lat: 35.1741, lng: -79.3930 }, accessType: "resort", priceBandMin: "125.00", priceBandMax: "225.00" },

  // === GEORGIA ===
  { name: "Reynolds Lake Oconee Great Waters", city: "Greensboro", state: "GA", location: { lat: 33.5694, lng: -83.3283 }, accessType: "resort", priceBandMin: "175.00", priceBandMax: "295.00" },
  { name: "Sea Island Seaside Course", city: "St. Simons Island", state: "GA", location: { lat: 31.1404, lng: -81.3869 }, accessType: "resort", priceBandMin: "275.00", priceBandMax: "395.00" },
  { name: "TPC Sugarloaf", city: "Duluth", state: "GA", location: { lat: 34.0160, lng: -84.1042 }, accessType: "semi_private", priceBandMin: "100.00", priceBandMax: "195.00" },

  // === NEW YORK ===
  { name: "Bethpage Black", city: "Farmingdale", state: "NY", location: { lat: 40.7437, lng: -73.4533 }, accessType: "public", priceBandMin: "150.00", priceBandMax: "150.00", reasonsToPlay: "The toughest public course in America. U.S. Open host. Warning sign on the first tee is legendary." },
  { name: "Bethpage Red", city: "Farmingdale", state: "NY", location: { lat: 40.7480, lng: -73.4521 }, accessType: "public", priceBandMin: "79.00", priceBandMax: "79.00" },

  // === NEW JERSEY ===
  { name: "Ballyowen Golf Club", city: "Hamburg", state: "NJ", location: { lat: 41.1424, lng: -74.5707 }, accessType: "resort", priceBandMin: "115.00", priceBandMax: "175.00" },
  { name: "Crystal Springs Golf Club", city: "Hamburg", state: "NJ", location: { lat: 41.1468, lng: -74.5645 }, accessType: "resort", priceBandMin: "100.00", priceBandMax: "165.00" },

  // === WISCONSIN ===
  { name: "Whistling Straits Straits Course", city: "Haven", state: "WI", location: { lat: 43.8481, lng: -87.7267 }, accessType: "resort", priceBandMin: "350.00", priceBandMax: "450.00", reasonsToPlay: "Dramatic lakeside links along Lake Michigan. Host of the 2021 Ryder Cup and multiple PGA Championships." },
  { name: "Blackwolf Run River Course", city: "Kohler", state: "WI", location: { lat: 43.7519, lng: -87.7829 }, accessType: "resort", priceBandMin: "250.00", priceBandMax: "350.00" },
  { name: "Erin Hills", city: "Erin", state: "WI", location: { lat: 43.1914, lng: -88.3483 }, accessType: "public", priceBandMin: "200.00", priceBandMax: "300.00", reasonsToPlay: "Host of the 2017 U.S. Open. Walking-only links through glacial terrain. Pure golf experience." },
  { name: "Sand Valley Golf Resort", city: "Nekoosa", state: "WI", location: { lat: 44.0862, lng: -89.9180 }, accessType: "resort", priceBandMin: "175.00", priceBandMax: "295.00", reasonsToPlay: "Coore & Crenshaw design in central Wisconsin sand barrens. Multiple world-class courses at one destination." },
  { name: "Mammoth Dunes at Sand Valley", city: "Nekoosa", state: "WI", location: { lat: 44.0910, lng: -89.9130 }, accessType: "resort", priceBandMin: "175.00", priceBandMax: "295.00" },

  // === MICHIGAN ===
  { name: "Arcadia Bluffs Golf Club", city: "Arcadia", state: "MI", location: { lat: 44.4818, lng: -86.2359 }, accessType: "public", priceBandMin: "150.00", priceBandMax: "250.00" },
  { name: "Forest Dunes Golf Club", city: "Roscommon", state: "MI", location: { lat: 44.4467, lng: -84.6120 }, accessType: "resort", priceBandMin: "150.00", priceBandMax: "250.00" },

  // === OREGON ===
  { name: "Bandon Dunes", city: "Bandon", state: "OR", location: { lat: 43.1858, lng: -124.3690 }, accessType: "resort", priceBandMin: "275.00", priceBandMax: "395.00", reasonsToPlay: "The ultimate buddies trip destination. Remote Oregon coast links golf at its finest. Walking only with caddies available." },
  { name: "Pacific Dunes at Bandon", city: "Bandon", state: "OR", location: { lat: 43.1909, lng: -124.3756 }, accessType: "resort", priceBandMin: "275.00", priceBandMax: "395.00", reasonsToPlay: "Consistently ranked as the top public course in America. Tom Doak design perched above the Pacific." },
  { name: "Old Macdonald at Bandon", city: "Bandon", state: "OR", location: { lat: 43.2015, lng: -124.3620 }, accessType: "resort", priceBandMin: "275.00", priceBandMax: "395.00" },
  { name: "Sheep Ranch at Bandon", city: "Bandon", state: "OR", location: { lat: 43.2130, lng: -124.3830 }, accessType: "resort", priceBandMin: "275.00", priceBandMax: "395.00" },
  { name: "Bandon Trails", city: "Bandon", state: "OR", location: { lat: 43.1970, lng: -124.3550 }, accessType: "resort", priceBandMin: "275.00", priceBandMax: "395.00" },

  // === ARIZONA ===
  { name: "TPC Scottsdale Stadium Course", city: "Scottsdale", state: "AZ", location: { lat: 33.6425, lng: -111.8985 }, accessType: "public", priceBandMin: "175.00", priceBandMax: "350.00", reasonsToPlay: "Home of the WM Phoenix Open and the loudest hole in golf. Stadium 16th is unforgettable." },
  { name: "Troon North Monument Course", city: "Scottsdale", state: "AZ", location: { lat: 33.7379, lng: -111.8487 }, accessType: "public", priceBandMin: "175.00", priceBandMax: "295.00" },
  { name: "Troon North Pinnacle Course", city: "Scottsdale", state: "AZ", location: { lat: 33.7348, lng: -111.8458 }, accessType: "public", priceBandMin: "150.00", priceBandMax: "275.00" },
  { name: "We-Ko-Pa Saguaro Course", city: "Fort McDowell", state: "AZ", location: { lat: 33.6267, lng: -111.6900 }, accessType: "public", priceBandMin: "125.00", priceBandMax: "225.00" },
  { name: "We-Ko-Pa Cholla Course", city: "Fort McDowell", state: "AZ", location: { lat: 33.6300, lng: -111.6876 }, accessType: "public", priceBandMin: "125.00", priceBandMax: "225.00" },
  { name: "Grayhawk Talon Course", city: "Scottsdale", state: "AZ", location: { lat: 33.6827, lng: -111.8681 }, accessType: "public", priceBandMin: "125.00", priceBandMax: "250.00" },
  { name: "Grayhawk Raptor Course", city: "Scottsdale", state: "AZ", location: { lat: 33.6861, lng: -111.8667 }, accessType: "public", priceBandMin: "125.00", priceBandMax: "250.00" },
  { name: "Quintero Golf Club", city: "Peoria", state: "AZ", location: { lat: 33.9117, lng: -112.3810 }, accessType: "public", priceBandMin: "100.00", priceBandMax: "225.00" },
  { name: "Ak-Chin Southern Dunes", city: "Maricopa", state: "AZ", location: { lat: 33.0488, lng: -111.9951 }, accessType: "public", priceBandMin: "69.00", priceBandMax: "139.00" },

  // === TEXAS ===
  { name: "Barton Creek Fazio Foothills", city: "Austin", state: "TX", location: { lat: 30.3002, lng: -97.8498 }, accessType: "resort", priceBandMin: "125.00", priceBandMax: "225.00" },
  { name: "Wolfdancer Golf Club", city: "Cedar Creek", state: "TX", location: { lat: 30.1118, lng: -97.4101 }, accessType: "resort", priceBandMin: "100.00", priceBandMax: "175.00" },
  { name: "TPC San Antonio Oaks Course", city: "San Antonio", state: "TX", location: { lat: 29.6099, lng: -98.6208 }, accessType: "resort", priceBandMin: "175.00", priceBandMax: "275.00" },
  { name: "Whirlwind Devil's Claw", city: "Chandler", state: "AZ", location: { lat: 33.2322, lng: -111.9849 }, accessType: "public", priceBandMin: "59.00", priceBandMax: "129.00" },

  // === HAWAII ===
  { name: "Mauna Kea Golf Course", city: "Kohala Coast", state: "HI", location: { lat: 19.9636, lng: -155.8225 }, accessType: "resort", priceBandMin: "225.00", priceBandMax: "295.00" },
  { name: "Kapalua Plantation Course", city: "Lahaina", state: "HI", location: { lat: 20.9814, lng: -156.6630 }, accessType: "resort", priceBandMin: "239.00", priceBandMax: "399.00" },

  // === SOUTH CAROLINA LOWCOUNTRY (private) ===
  { name: "May River Golf Club at Palmetto Bluff", city: "Bluffton", state: "SC", location: { lat: 32.1871, lng: -80.8697 }, accessType: "private", priceBandMin: "200.00", priceBandMax: "350.00" },
  { name: "Colleton River Daufuskie Island Club", city: "Hilton Head", state: "SC", location: { lat: 32.0916, lng: -80.8333 }, accessType: "private", priceBandMin: "175.00", priceBandMax: "300.00" },
  { name: "Haig Point Club", city: "Daufuskie Island", state: "SC", location: { lat: 32.1100, lng: -80.8810 }, accessType: "private", priceBandMin: "150.00", priceBandMax: "250.00" },

  // === VIRGINIA ===
  { name: "Kinloch Golf Club", city: "Manakin-Sabot", state: "VA", location: { lat: 37.6030, lng: -77.7160 }, accessType: "private", priceBandMin: "300.00", priceBandMax: "400.00" },

  // === ILLINOIS ===
  { name: "Cog Hill Dubsdread No. 4", city: "Lemont", state: "IL", location: { lat: 41.6299, lng: -87.9806 }, accessType: "public", priceBandMin: "89.00", priceBandMax: "139.00" },

  // === TENNESSEE ===
  { name: "The Honors Course", city: "Ooltewah", state: "TN", location: { lat: 35.0741, lng: -85.0561 }, accessType: "private", priceBandMin: "200.00", priceBandMax: "350.00" },

  // === COLORADO ===
  { name: "The Broadmoor East Course", city: "Colorado Springs", state: "CO", location: { lat: 38.7839, lng: -104.8490 }, accessType: "resort", priceBandMin: "175.00", priceBandMax: "275.00" },

  // === UTAH ===
  { name: "Sand Hollow Resort Championship", city: "Hurricane", state: "UT", location: { lat: 37.1191, lng: -113.3803 }, accessType: "resort", priceBandMin: "89.00", priceBandMax: "155.00" },

  // === WASHINGTON ===
  { name: "Chambers Bay Golf Course", city: "University Place", state: "WA", location: { lat: 47.1960, lng: -122.5710 }, accessType: "public", priceBandMin: "175.00", priceBandMax: "275.00" },

  // === ALABAMA ===
  { name: "RTJ Capitol Hill Senator Course", city: "Prattville", state: "AL", location: { lat: 32.4588, lng: -86.4589 }, accessType: "public", priceBandMin: "49.00", priceBandMax: "62.00" },
  { name: "RTJ Capitol Hill Judge Course", city: "Prattville", state: "AL", location: { lat: 32.4560, lng: -86.4620 }, accessType: "public", priceBandMin: "49.00", priceBandMax: "62.00" },
  { name: "RTJ Ross Bridge", city: "Birmingham", state: "AL", location: { lat: 33.3756, lng: -86.8961 }, accessType: "public", priceBandMin: "59.00", priceBandMax: "79.00" },

  // === MISSISSIPPI ===
  { name: "Fallen Oak Golf Club", city: "Biloxi", state: "MS", location: { lat: 30.4640, lng: -88.9730 }, accessType: "resort", priceBandMin: "99.00", priceBandMax: "185.00" },

  // === LOUISIANA ===
  { name: "TPC Louisiana", city: "Avondale", state: "LA", location: { lat: 29.8978, lng: -90.1665 }, accessType: "public", priceBandMin: "89.00", priceBandMax: "159.00" },

  // === MONTANA ===
  { name: "Old Works Golf Course", city: "Anaconda", state: "MT", location: { lat: 46.1207, lng: -112.9378 }, accessType: "public", priceBandMin: "42.00", priceBandMax: "79.00" },

  // === NEBRASKA ===
  { name: "Prairie Club Dunes Course", city: "Valentine", state: "NE", location: { lat: 42.6710, lng: -100.5940 }, accessType: "resort", priceBandMin: "125.00", priceBandMax: "225.00" },

  // === IDAHO ===
  { name: "Circling Raven Golf Club", city: "Worley", state: "ID", location: { lat: 47.3843, lng: -116.9181 }, accessType: "resort", priceBandMin: "65.00", priceBandMax: "125.00" },

  // === ADDITIONAL FLORIDA (near MCO) ===
  { name: "Grand Cypress New Course", city: "Orlando", state: "FL", location: { lat: 28.3848, lng: -81.5183 }, accessType: "resort", priceBandMin: "100.00", priceBandMax: "175.00" },
  { name: "Celebration Golf Club", city: "Celebration", state: "FL", location: { lat: 28.3063, lng: -81.5439 }, accessType: "public", priceBandMin: "49.00", priceBandMax: "99.00" },
  { name: "Bella Collina", city: "Montverde", state: "FL", location: { lat: 28.5949, lng: -81.6707 }, accessType: "semi_private", priceBandMin: "100.00", priceBandMax: "195.00" },
  { name: "Victoria Hills Golf Club", city: "DeLand", state: "FL", location: { lat: 29.0180, lng: -81.2950 }, accessType: "public", priceBandMin: "39.00", priceBandMax: "79.00" },

  // === ADDITIONAL MYRTLE BEACH ===
  { name: "Pawleys Plantation Golf & Country Club", city: "Pawleys Island", state: "SC", location: { lat: 33.4189, lng: -79.1289 }, accessType: "public", priceBandMin: "75.00", priceBandMax: "149.00" },
  { name: "Dunes Golf and Beach Club", city: "Myrtle Beach", state: "SC", location: { lat: 33.7208, lng: -78.8547 }, accessType: "semi_private", priceBandMin: "100.00", priceBandMax: "195.00" },

  // === ADDITIONAL ARIZONA (SCOTTSDALE) ===
  { name: "Boulders North Course", city: "Scottsdale", state: "AZ", location: { lat: 33.8238, lng: -111.8350 }, accessType: "resort", priceBandMin: "175.00", priceBandMax: "295.00" },
  { name: "Boulders South Course", city: "Scottsdale", state: "AZ", location: { lat: 33.8214, lng: -111.8374 }, accessType: "resort", priceBandMin: "175.00", priceBandMax: "295.00" },
  { name: "Papago Golf Club", city: "Phoenix", state: "AZ", location: { lat: 33.4542, lng: -111.9538 }, accessType: "public", priceBandMin: "35.00", priceBandMax: "65.00" },
];

export async function seedCourses() {
  console.log("Seeding courses...");

  // Check if already seeded
  const existing = await db.select({ id: courses.id }).from(courses).limit(1);
  if (existing.length > 0) {
    console.log(`  Courses already seeded (found ${existing.length}+), skipping.`);
    return;
  }

  await db.insert(courses).values(
    COURSE_DATA.map((c) => ({
      name: c.name,
      city: c.city,
      state: c.state,
      location: { lat: c.location.lat, lng: c.location.lng },
      accessType: c.accessType,
      priceBandMin: c.priceBandMin,
      priceBandMax: c.priceBandMax,
      reasonsToPlay: c.reasonsToPlay ?? null,
    }))
  );

  console.log(`  Inserted ${COURSE_DATA.length} courses.`);
}
