-- PostGIS Spike: Airport Seed Data
-- ~50 major U.S. airports with real coordinates
-- Coordinates sourced from FAA / public aviation data

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS airports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  iata_code VARCHAR(10) UNIQUE NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL
);

CREATE INDEX idx_airports_location ON airports USING GIST(location);
CREATE INDEX idx_airports_iata ON airports(iata_code);

INSERT INTO airports (name, iata_code, location) VALUES
  -- Top 30 required airports
  ('Hartsfield-Jackson Atlanta International Airport',    'ATL', ST_SetSRID(ST_MakePoint(-84.4281, 33.6407), 4326)::geography),
  ('O''Hare International Airport',                       'ORD', ST_SetSRID(ST_MakePoint(-87.9048, 41.9742), 4326)::geography),
  ('Dallas/Fort Worth International Airport',             'DFW', ST_SetSRID(ST_MakePoint(-97.0403, 32.8998), 4326)::geography),
  ('Denver International Airport',                        'DEN', ST_SetSRID(ST_MakePoint(-104.6737, 39.8561), 4326)::geography),
  ('John F. Kennedy International Airport',               'JFK', ST_SetSRID(ST_MakePoint(-73.7781, 40.6413), 4326)::geography),
  ('Los Angeles International Airport',                   'LAX', ST_SetSRID(ST_MakePoint(-118.4085, 33.9416), 4326)::geography),
  ('San Francisco International Airport',                 'SFO', ST_SetSRID(ST_MakePoint(-122.3790, 37.6213), 4326)::geography),
  ('Miami International Airport',                         'MIA', ST_SetSRID(ST_MakePoint(-80.2906, 25.7959), 4326)::geography),
  ('Orlando International Airport',                       'MCO', ST_SetSRID(ST_MakePoint(-81.3089, 28.4312), 4326)::geography),
  ('Seattle-Tacoma International Airport',                'SEA', ST_SetSRID(ST_MakePoint(-122.3088, 47.4502), 4326)::geography),
  ('Phoenix Sky Harbor International Airport',            'PHX', ST_SetSRID(ST_MakePoint(-112.0116, 33.4373), 4326)::geography),
  ('George Bush Intercontinental Airport',                'IAH', ST_SetSRID(ST_MakePoint(-95.3414, 29.9902), 4326)::geography),
  ('Boston Logan International Airport',                  'BOS', ST_SetSRID(ST_MakePoint(-71.0096, 42.3656), 4326)::geography),
  ('Minneapolis-Saint Paul International Airport',        'MSP', ST_SetSRID(ST_MakePoint(-93.2218, 44.8848), 4326)::geography),
  ('Detroit Metropolitan Wayne County Airport',           'DTW', ST_SetSRID(ST_MakePoint(-83.3534, 42.2124), 4326)::geography),
  ('Charlotte Douglas International Airport',             'CLT', ST_SetSRID(ST_MakePoint(-80.9431, 35.2140), 4326)::geography),
  ('Fort Lauderdale-Hollywood International Airport',     'FLL', ST_SetSRID(ST_MakePoint(-80.1527, 26.0726), 4326)::geography),
  ('Newark Liberty International Airport',                'EWR', ST_SetSRID(ST_MakePoint(-74.1687, 40.6895), 4326)::geography),
  ('LaGuardia Airport',                                   'LGA', ST_SetSRID(ST_MakePoint(-73.8726, 40.7769), 4326)::geography),
  ('Baltimore/Washington International Airport',          'BWI', ST_SetSRID(ST_MakePoint(-76.6684, 39.1754), 4326)::geography),
  ('Salt Lake City International Airport',                'SLC', ST_SetSRID(ST_MakePoint(-111.9791, 40.7884), 4326)::geography),
  ('San Diego International Airport',                     'SAN', ST_SetSRID(ST_MakePoint(-117.1896, 32.7338), 4326)::geography),
  ('Tampa International Airport',                         'TPA', ST_SetSRID(ST_MakePoint(-82.5332, 27.9755), 4326)::geography),
  ('Austin-Bergstrom International Airport',              'AUS', ST_SetSRID(ST_MakePoint(-97.6699, 30.1975), 4326)::geography),
  ('Raleigh-Durham International Airport',                'RDU', ST_SetSRID(ST_MakePoint(-78.7880, 35.8776), 4326)::geography),
  ('Palm Beach International Airport',                    'PBI', ST_SetSRID(ST_MakePoint(-80.0956, 26.6832), 4326)::geography),
  ('Jacksonville International Airport',                  'JAX', ST_SetSRID(ST_MakePoint(-81.6879, 30.4941), 4326)::geography),
  ('Savannah/Hilton Head International Airport',          'SAV', ST_SetSRID(ST_MakePoint(-81.2021, 32.1276), 4326)::geography),
  ('Myrtle Beach International Airport',                  'MYR', ST_SetSRID(ST_MakePoint(-78.9283, 33.6797), 4326)::geography),
  ('Hilton Head Airport',                                 'HHH', ST_SetSRID(ST_MakePoint(-80.6975, 32.2244), 4326)::geography),

  -- Additional major U.S. airports for coverage
  ('Washington Dulles International Airport',             'IAD', ST_SetSRID(ST_MakePoint(-77.4558, 38.9531), 4326)::geography),
  ('Ronald Reagan Washington National Airport',           'DCA', ST_SetSRID(ST_MakePoint(-77.0377, 38.8512), 4326)::geography),
  ('Nashville International Airport',                     'BNA', ST_SetSRID(ST_MakePoint(-86.6782, 36.1264), 4326)::geography),
  ('Las Vegas Harry Reid International Airport',          'LAS', ST_SetSRID(ST_MakePoint(-115.1523, 36.0840), 4326)::geography),
  ('Portland International Airport',                      'PDX', ST_SetSRID(ST_MakePoint(-122.5975, 45.5898), 4326)::geography),
  ('St. Louis Lambert International Airport',             'STL', ST_SetSRID(ST_MakePoint(-90.3700, 38.7487), 4326)::geography),
  ('Kansas City International Airport',                   'MCI', ST_SetSRID(ST_MakePoint(-94.7139, 39.2976), 4326)::geography),
  ('Pittsburgh International Airport',                    'PIT', ST_SetSRID(ST_MakePoint(-80.2329, 40.4915), 4326)::geography),
  ('Indianapolis International Airport',                  'IND', ST_SetSRID(ST_MakePoint(-86.2944, 39.7173), 4326)::geography),
  ('Cincinnati/Northern Kentucky International Airport',  'CVG', ST_SetSRID(ST_MakePoint(-84.6678, 39.0488), 4326)::geography),
  ('Cleveland Hopkins International Airport',             'CLE', ST_SetSRID(ST_MakePoint(-81.8498, 41.4117), 4326)::geography),
  ('Milwaukee Mitchell International Airport',            'MKE', ST_SetSRID(ST_MakePoint(-87.8966, 42.9472), 4326)::geography),
  ('New Orleans Louis Armstrong International Airport',   'MSY', ST_SetSRID(ST_MakePoint(-90.2580, 29.9934), 4326)::geography),
  ('Scottsdale Airport',                                  'SDL', ST_SetSRID(ST_MakePoint(-111.9108, 33.6229), 4326)::geography),
  ('Honolulu Daniel K. Inouye International Airport',     'HNL', ST_SetSRID(ST_MakePoint(-157.9224, 21.3187), 4326)::geography),
  ('San Antonio International Airport',                   'SAT', ST_SetSRID(ST_MakePoint(-98.4699, 29.5337), 4326)::geography),
  ('Charleston International Airport',                    'CHS', ST_SetSRID(ST_MakePoint(-80.0405, 32.8986), 4326)::geography),
  ('Tucson International Airport',                        'TUS', ST_SetSRID(ST_MakePoint(-110.9410, 32.1161), 4326)::geography),
  ('Monterey Regional Airport',                           'MRY', ST_SetSRID(ST_MakePoint(-121.8430, 36.5870), 4326)::geography),
  ('North Bend/Coos County Airport',                      'OTH', ST_SetSRID(ST_MakePoint(-124.2461, 43.4171), 4326)::geography)
ON CONFLICT (iata_code) DO NOTHING;
