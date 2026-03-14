-- PostGIS Spike: Golf Course Seed Data
-- ~100 real U.S. golf courses with real coordinates
-- Coordinates sourced from public mapping data

CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255),
  state VARCHAR(2),
  location GEOGRAPHY(Point, 4326) NOT NULL,
  access_type VARCHAR(50) NOT NULL DEFAULT 'public',
  price_band_min DECIMAL(10,2),
  price_band_max DECIMAL(10,2)
);

CREATE INDEX idx_courses_location ON courses USING GIST(location);
CREATE INDEX idx_courses_access ON courses(access_type);

INSERT INTO courses (name, city, state, location, access_type, price_band_min, price_band_max) VALUES

  -- === CALIFORNIA ===
  ('Pebble Beach Golf Links',              'Pebble Beach', 'CA', ST_SetSRID(ST_MakePoint(-121.9488, 36.5688), 4326)::geography, 'resort',    525.00, 575.00),
  ('Spyglass Hill Golf Course',            'Pebble Beach', 'CA', ST_SetSRID(ST_MakePoint(-121.9537, 36.5825), 4326)::geography, 'resort',    395.00, 425.00),
  ('The Links at Spanish Bay',             'Pebble Beach', 'CA', ST_SetSRID(ST_MakePoint(-121.9476, 36.6106), 4326)::geography, 'resort',    295.00, 315.00),
  ('Torrey Pines South Course',            'La Jolla',     'CA', ST_SetSRID(ST_MakePoint(-117.2523, 32.9005), 4326)::geography, 'public',    202.00, 252.00),
  ('Torrey Pines North Course',            'La Jolla',     'CA', ST_SetSRID(ST_MakePoint(-117.2511, 32.8993), 4326)::geography, 'public',    130.00, 180.00),
  ('Pasatiempo Golf Club',                 'Santa Cruz',   'CA', ST_SetSRID(ST_MakePoint(-122.0279, 36.9838), 4326)::geography, 'public',    260.00, 295.00),
  ('Half Moon Bay Golf Links - Ocean',     'Half Moon Bay','CA', ST_SetSRID(ST_MakePoint(-122.4413, 37.4371), 4326)::geography, 'resort',    225.00, 275.00),
  ('Pelican Hill Golf Club - Ocean South', 'Newport Beach','CA', ST_SetSRID(ST_MakePoint(-117.8406, 33.5701), 4326)::geography, 'resort',    275.00, 325.00),
  ('PGA West Stadium Course',             'La Quinta',    'CA', ST_SetSRID(ST_MakePoint(-116.2857, 33.7002), 4326)::geography, 'resort',    199.00, 279.00),
  ('Desert Willow Firecliff',             'Palm Desert',  'CA', ST_SetSRID(ST_MakePoint(-116.3341, 33.7397), 4326)::geography, 'public',    100.00, 175.00),

  -- === FLORIDA ===
  ('TPC Sawgrass Stadium Course',          'Ponte Vedra',  'FL', ST_SetSRID(ST_MakePoint(-81.3945, 30.1975), 4326)::geography, 'resort',    450.00, 575.00),
  ('Streamsong Red',                       'Bowling Green','FL', ST_SetSRID(ST_MakePoint(-81.8311, 27.6307), 4326)::geography, 'resort',    200.00, 295.00),
  ('Streamsong Blue',                      'Bowling Green','FL', ST_SetSRID(ST_MakePoint(-81.8261, 27.6257), 4326)::geography, 'resort',    200.00, 295.00),
  ('Streamsong Black',                     'Bowling Green','FL', ST_SetSRID(ST_MakePoint(-81.8354, 27.6350), 4326)::geography, 'resort',    250.00, 350.00),
  ('TPC Danzanita at World Golf Village',  'St. Augustine','FL', ST_SetSRID(ST_MakePoint(-81.5099, 29.9637), 4326)::geography, 'public',    100.00, 189.00),
  ('Innisbrook Copperhead Course',         'Palm Harbor',  'FL', ST_SetSRID(ST_MakePoint(-82.7567, 28.1013), 4326)::geography, 'resort',    175.00, 295.00),
  ('Bay Hill Club & Lodge',                'Orlando',      'FL', ST_SetSRID(ST_MakePoint(-81.5073, 28.4619), 4326)::geography, 'resort',    250.00, 395.00),
  ('Orange County National - Panther Lake','Winter Garden','FL', ST_SetSRID(ST_MakePoint(-81.5919, 28.5144), 4326)::geography, 'public',     89.00, 159.00),
  ('Reunion Resort Watson Course',         'Kissimmee',    'FL', ST_SetSRID(ST_MakePoint(-81.5821, 28.3188), 4326)::geography, 'resort',    100.00, 179.00),
  ('ChampionsGate National',              'Davenport',    'FL', ST_SetSRID(ST_MakePoint(-81.6175, 28.2905), 4326)::geography, 'resort',     85.00, 149.00),
  ('Waldorf Astoria Golf Club',            'Orlando',      'FL', ST_SetSRID(ST_MakePoint(-81.5950, 28.3550), 4326)::geography, 'resort',    100.00, 195.00),
  ('Falcon''s Fire Golf Club',            'Kissimmee',    'FL', ST_SetSRID(ST_MakePoint(-81.4351, 28.3281), 4326)::geography, 'public',     59.00, 129.00),
  ('Shingle Creek Golf Club',             'Orlando',      'FL', ST_SetSRID(ST_MakePoint(-81.4283, 28.4025), 4326)::geography, 'public',     65.00, 119.00),
  ('Royal St. Cloud Golf Links',          'St. Cloud',    'FL', ST_SetSRID(ST_MakePoint(-81.2780, 28.2480), 4326)::geography, 'public',     35.00,  79.00),
  ('PGA National Champion Course',        'Palm Beach Gardens', 'FL', ST_SetSRID(ST_MakePoint(-80.1511, 26.8385), 4326)::geography, 'resort', 250.00, 395.00),
  ('Doral TPC Blue Monster',              'Miami',        'FL', ST_SetSRID(ST_MakePoint(-80.3398, 25.8131), 4326)::geography, 'resort',    250.00, 395.00),
  ('Crandon Golf at Key Biscayne',        'Key Biscayne', 'FL', ST_SetSRID(ST_MakePoint(-80.1621, 25.6933), 4326)::geography, 'public',     75.00, 200.00),

  -- === SOUTH CAROLINA ===
  ('Kiawah Island Ocean Course',           'Kiawah Island','SC', ST_SetSRID(ST_MakePoint(-80.0565, 32.6088), 4326)::geography, 'resort',    350.00, 450.00),
  ('Caledonia Golf & Fish Club',           'Pawleys Island','SC',ST_SetSRID(ST_MakePoint(-79.1042, 33.4291), 4326)::geography, 'public',    170.00, 230.00),
  ('True Blue Golf Club',                  'Pawleys Island','SC',ST_SetSRID(ST_MakePoint(-79.1197, 33.4447), 4326)::geography, 'public',    100.00, 175.00),
  ('Harbour Town Golf Links',             'Hilton Head',  'SC', ST_SetSRID(ST_MakePoint(-80.8168, 32.1362), 4326)::geography, 'resort',    325.00, 450.00),
  ('Tidewater Golf Club',                 'North Myrtle Beach','SC', ST_SetSRID(ST_MakePoint(-78.6926, 33.8372), 4326)::geography, 'public', 75.00, 159.00),
  ('Barefoot Resort Dye Course',          'North Myrtle Beach','SC', ST_SetSRID(ST_MakePoint(-78.7494, 33.8105), 4326)::geography, 'resort', 79.00, 159.00),
  ('TPC Myrtle Beach',                    'Murrells Inlet','SC', ST_SetSRID(ST_MakePoint(-79.0473, 33.5171), 4326)::geography, 'public',    89.00, 179.00),
  ('Grande Dunes Resort Course',          'Myrtle Beach', 'SC', ST_SetSRID(ST_MakePoint(-78.8371, 33.7452), 4326)::geography, 'resort',     89.00, 165.00),

  -- === NORTH CAROLINA ===
  ('Pinehurst No. 2',                     'Pinehurst',    'NC', ST_SetSRID(ST_MakePoint(-79.4694, 35.1910), 4326)::geography, 'resort',    395.00, 595.00),
  ('Pinehurst No. 4',                     'Pinehurst',    'NC', ST_SetSRID(ST_MakePoint(-79.4710, 35.2010), 4326)::geography, 'resort',    250.00, 395.00),
  ('Pinehurst No. 8',                     'Pinehurst',    'NC', ST_SetSRID(ST_MakePoint(-79.4605, 35.1850), 4326)::geography, 'resort',    200.00, 325.00),
  ('Tobacco Road Golf Club',              'Sanford',      'NC', ST_SetSRID(ST_MakePoint(-79.2350, 35.3950), 4326)::geography, 'public',     69.00, 135.00),
  ('Pine Needles Lodge & Golf Club',      'Southern Pines','NC', ST_SetSRID(ST_MakePoint(-79.3907, 35.1601), 4326)::geography, 'resort',    175.00, 295.00),
  ('Mid Pines Inn & Golf Club',           'Southern Pines','NC', ST_SetSRID(ST_MakePoint(-79.3930, 35.1741), 4326)::geography, 'resort',    125.00, 225.00),

  -- === GEORGIA ===
  ('Reynolds Lake Oconee Great Waters',   'Greensboro',   'GA', ST_SetSRID(ST_MakePoint(-83.3283, 33.5694), 4326)::geography, 'resort',    175.00, 295.00),
  ('Sea Island Seaside Course',           'St. Simons Island','GA', ST_SetSRID(ST_MakePoint(-81.3869, 31.1404), 4326)::geography, 'resort', 275.00, 395.00),
  ('TPC Sugarloaf',                       'Duluth',       'GA', ST_SetSRID(ST_MakePoint(-84.1042, 34.0160), 4326)::geography, 'semi-private', 100.00, 195.00),

  -- === NEW YORK ===
  ('Bethpage Black',                       'Farmingdale',  'NY', ST_SetSRID(ST_MakePoint(-73.4533, 40.7437), 4326)::geography, 'public',    150.00, 150.00),
  ('Bethpage Red',                         'Farmingdale',  'NY', ST_SetSRID(ST_MakePoint(-73.4521, 40.7480), 4326)::geography, 'public',     79.00,  79.00),

  -- === NEW JERSEY ===
  ('Ballyowen Golf Club',                 'Hamburg',      'NJ', ST_SetSRID(ST_MakePoint(-74.5707, 41.1424), 4326)::geography, 'resort',    115.00, 175.00),
  ('Crystal Springs Golf Club',           'Hamburg',      'NJ', ST_SetSRID(ST_MakePoint(-74.5645, 41.1468), 4326)::geography, 'resort',    100.00, 165.00),

  -- === WISCONSIN ===
  ('Whistling Straits Straits Course',     'Haven',        'WI', ST_SetSRID(ST_MakePoint(-87.7267, 43.8481), 4326)::geography, 'resort',    350.00, 450.00),
  ('Blackwolf Run River Course',           'Kohler',       'WI', ST_SetSRID(ST_MakePoint(-87.7829, 43.7519), 4326)::geography, 'resort',    250.00, 350.00),
  ('Erin Hills',                           'Erin',         'WI', ST_SetSRID(ST_MakePoint(-88.3483, 43.1914), 4326)::geography, 'public',    200.00, 300.00),
  ('Sand Valley Golf Resort',             'Nekoosa',      'WI', ST_SetSRID(ST_MakePoint(-89.9180, 44.0862), 4326)::geography, 'resort',    175.00, 295.00),
  ('Mammoth Dunes at Sand Valley',        'Nekoosa',      'WI', ST_SetSRID(ST_MakePoint(-89.9130, 44.0910), 4326)::geography, 'resort',    175.00, 295.00),

  -- === MICHIGAN ===
  ('Arcadia Bluffs Golf Club',            'Arcadia',      'MI', ST_SetSRID(ST_MakePoint(-86.2359, 44.4818), 4326)::geography, 'public',    150.00, 250.00),
  ('Forest Dunes Golf Club',              'Roscommon',    'MI', ST_SetSRID(ST_MakePoint(-84.6120, 44.4467), 4326)::geography, 'resort',    150.00, 250.00),

  -- === OREGON ===
  ('Bandon Dunes',                         'Bandon',       'OR', ST_SetSRID(ST_MakePoint(-124.3690, 43.1858), 4326)::geography, 'resort',    275.00, 395.00),
  ('Pacific Dunes at Bandon',              'Bandon',       'OR', ST_SetSRID(ST_MakePoint(-124.3756, 43.1909), 4326)::geography, 'resort',    275.00, 395.00),
  ('Old Macdonald at Bandon',              'Bandon',       'OR', ST_SetSRID(ST_MakePoint(-124.3620, 43.2015), 4326)::geography, 'resort',    275.00, 395.00),
  ('Sheep Ranch at Bandon',                'Bandon',       'OR', ST_SetSRID(ST_MakePoint(-124.3830, 43.2130), 4326)::geography, 'resort',    275.00, 395.00),
  ('Bandon Trails',                        'Bandon',       'OR', ST_SetSRID(ST_MakePoint(-124.3550, 43.1970), 4326)::geography, 'resort',    275.00, 395.00),

  -- === ARIZONA ===
  ('TPC Scottsdale Stadium Course',        'Scottsdale',   'AZ', ST_SetSRID(ST_MakePoint(-111.8985, 33.6425), 4326)::geography, 'public',    175.00, 350.00),
  ('Troon North Monument Course',         'Scottsdale',   'AZ', ST_SetSRID(ST_MakePoint(-111.8487, 33.7379), 4326)::geography, 'public',    175.00, 295.00),
  ('Troon North Pinnacle Course',         'Scottsdale',   'AZ', ST_SetSRID(ST_MakePoint(-111.8458, 33.7348), 4326)::geography, 'public',    150.00, 275.00),
  ('We-Ko-Pa Saguaro Course',             'Fort McDowell','AZ', ST_SetSRID(ST_MakePoint(-111.6900, 33.6267), 4326)::geography, 'public',    125.00, 225.00),
  ('We-Ko-Pa Cholla Course',              'Fort McDowell','AZ', ST_SetSRID(ST_MakePoint(-111.6876, 33.6300), 4326)::geography, 'public',    125.00, 225.00),
  ('Grayhawk Talon Course',               'Scottsdale',   'AZ', ST_SetSRID(ST_MakePoint(-111.8681, 33.6827), 4326)::geography, 'public',    125.00, 250.00),
  ('Grayhawk Raptor Course',              'Scottsdale',   'AZ', ST_SetSRID(ST_MakePoint(-111.8667, 33.6861), 4326)::geography, 'public',    125.00, 250.00),
  ('Quintero Golf Club',                  'Peoria',       'AZ', ST_SetSRID(ST_MakePoint(-112.3810, 33.9117), 4326)::geography, 'public',    100.00, 225.00),
  ('Ak-Chin Southern Dunes',              'Maricopa',     'AZ', ST_SetSRID(ST_MakePoint(-111.9951, 33.0488), 4326)::geography, 'public',     69.00, 139.00),

  -- === TEXAS ===
  ('Barton Creek Fazio Foothills',        'Austin',       'TX', ST_SetSRID(ST_MakePoint(-97.8498, 30.3002), 4326)::geography, 'resort',    125.00, 225.00),
  ('Wolfdancer Golf Club',                'Cedar Creek',  'TX', ST_SetSRID(ST_MakePoint(-97.4101, 30.1118), 4326)::geography, 'resort',    100.00, 175.00),
  ('TPC San Antonio Oaks Course',         'San Antonio',  'TX', ST_SetSRID(ST_MakePoint(-98.6208, 29.6099), 4326)::geography, 'resort',    175.00, 275.00),
  ('Whirlwind Devil''s Claw',             'Chandler',     'AZ', ST_SetSRID(ST_MakePoint(-111.9849, 33.2322), 4326)::geography, 'public',     59.00, 129.00),

  -- === HAWAII ===
  ('Mauna Kea Golf Course',               'Kohala Coast', 'HI', ST_SetSRID(ST_MakePoint(-155.8225, 19.9636), 4326)::geography, 'resort',    225.00, 295.00),
  ('Kapalua Plantation Course',           'Lahaina',      'HI', ST_SetSRID(ST_MakePoint(-156.6630, 20.9814), 4326)::geography, 'resort',    239.00, 399.00),

  -- === SOUTH CAROLINA LOWCOUNTRY (near HHH/SAV) ===
  ('May River Golf Club at Palmetto Bluff','Bluffton',    'SC', ST_SetSRID(ST_MakePoint(-80.8697, 32.1871), 4326)::geography, 'private',    200.00, 350.00),
  ('Colleton River Daufuskie Island Club','Hilton Head',  'SC', ST_SetSRID(ST_MakePoint(-80.8333, 32.0916), 4326)::geography, 'private',    175.00, 300.00),
  ('Haig Point Club',                     'Daufuskie Island','SC', ST_SetSRID(ST_MakePoint(-80.8810, 32.1100), 4326)::geography, 'private', 150.00, 250.00),

  -- === VIRGINIA ===
  ('Kinloch Golf Club',                   'Manakin-Sabot','VA', ST_SetSRID(ST_MakePoint(-77.7160, 37.6030), 4326)::geography, 'private',    300.00, 400.00),

  -- === ILLINOIS ===
  ('Cog Hill Dubsdread No. 4',            'Lemont',       'IL', ST_SetSRID(ST_MakePoint(-87.9806, 41.6299), 4326)::geography, 'public',     89.00, 139.00),

  -- === TENNESSEE ===
  ('The Honors Course',                   'Ooltewah',     'TN', ST_SetSRID(ST_MakePoint(-85.0561, 35.0741), 4326)::geography, 'private',    200.00, 350.00),

  -- === COLORADO ===
  ('The Broadmoor East Course',           'Colorado Springs','CO', ST_SetSRID(ST_MakePoint(-104.8490, 38.7839), 4326)::geography, 'resort', 175.00, 275.00),

  -- === UTAH ===
  ('Sand Hollow Resort Championship',     'Hurricane',    'UT', ST_SetSRID(ST_MakePoint(-113.3803, 37.1191), 4326)::geography, 'resort',     89.00, 155.00),

  -- === WASHINGTON ===
  ('Chambers Bay Golf Course',            'University Place','WA', ST_SetSRID(ST_MakePoint(-122.5710, 47.1960), 4326)::geography, 'public', 175.00, 275.00),

  -- === ALABAMA ===
  ('RTJ Capitol Hill Senator Course',     'Prattville',   'AL', ST_SetSRID(ST_MakePoint(-86.4589, 32.4588), 4326)::geography, 'public',     49.00,  62.00),
  ('RTJ Capitol Hill Judge Course',       'Prattville',   'AL', ST_SetSRID(ST_MakePoint(-86.4620, 32.4560), 4326)::geography, 'public',     49.00,  62.00),
  ('RTJ Ross Bridge',                     'Birmingham',   'AL', ST_SetSRID(ST_MakePoint(-86.8961, 33.3756), 4326)::geography, 'public',     59.00,  79.00),

  -- === MISSISSIPPI ===
  ('Fallen Oak Golf Club',               'Biloxi',       'MS', ST_SetSRID(ST_MakePoint(-88.9730, 30.4640), 4326)::geography, 'resort',     99.00, 185.00),

  -- === LOUISIANA ===
  ('TPC Louisiana',                       'Avondale',     'LA', ST_SetSRID(ST_MakePoint(-90.1665, 29.8978), 4326)::geography, 'public',     89.00, 159.00),

  -- === MONTANA ===
  ('Old Works Golf Course',              'Anaconda',     'MT', ST_SetSRID(ST_MakePoint(-112.9378, 46.1207), 4326)::geography, 'public',     42.00,  79.00),

  -- === NEBRASKA ===
  ('Prairie Club Dunes Course',           'Valentine',    'NE', ST_SetSRID(ST_MakePoint(-100.5940, 42.6710), 4326)::geography, 'resort',    125.00, 225.00),

  -- === IDAHO ===
  ('Circling Raven Golf Club',           'Worley',       'ID', ST_SetSRID(ST_MakePoint(-116.9181, 47.3843), 4326)::geography, 'resort',     65.00, 125.00),

  -- === ADDITIONAL FLORIDA (near MCO for radius tests) ===
  ('Grand Cypress New Course',            'Orlando',      'FL', ST_SetSRID(ST_MakePoint(-81.5183, 28.3848), 4326)::geography, 'resort',    100.00, 175.00),
  ('Celebration Golf Club',              'Celebration',  'FL', ST_SetSRID(ST_MakePoint(-81.5439, 28.3063), 4326)::geography, 'public',     49.00,  99.00),
  ('Bella Collina',                      'Montverde',    'FL', ST_SetSRID(ST_MakePoint(-81.6707, 28.5949), 4326)::geography, 'semi-private', 100.00, 195.00),
  ('Victoria Hills Golf Club',          'DeLand',       'FL', ST_SetSRID(ST_MakePoint(-81.2950, 29.0180), 4326)::geography, 'public',     39.00,  79.00),

  -- === ADDITIONAL MYRTLE BEACH ===
  ('Caledonia Golf & Fish Club #2 Pawleys Plantation', 'Pawleys Island','SC', ST_SetSRID(ST_MakePoint(-79.1289, 33.4189), 4326)::geography, 'public', 75.00, 149.00),
  ('Dunes Golf and Beach Club',          'Myrtle Beach', 'SC', ST_SetSRID(ST_MakePoint(-78.8547, 33.7208), 4326)::geography, 'semi-private', 100.00, 195.00),

  -- === ADDITIONAL ARIZONA (SCOTTSDALE) ===
  ('Boulders North Course',              'Scottsdale',   'AZ', ST_SetSRID(ST_MakePoint(-111.8350, 33.8238), 4326)::geography, 'resort',    175.00, 295.00),
  ('Boulders South Course',              'Scottsdale',   'AZ', ST_SetSRID(ST_MakePoint(-111.8374, 33.8214), 4326)::geography, 'resort',    175.00, 295.00),
  ('Papago Golf Club',                   'Phoenix',      'AZ', ST_SetSRID(ST_MakePoint(-111.9538, 33.4542), 4326)::geography, 'public',     35.00,  65.00)

ON CONFLICT DO NOTHING;
