-- Reference data: dealer locations + US states / Canadian provinces.
-- fips_or_geo_id uses 2-digit US Census FIPS codes for us_state rows
-- (matches us-atlas TopoJSON ids) and ISO 3166-2 codes for ca_province rows.

insert into dealer_locations (code, name) values
  ('HMD', 'HMD'),
  ('LFT', 'LFT'),
  ('ABB', 'ABB'),
  ('HAT', 'HAT'),
  ('TUP', 'TUP'),
  ('BAY', 'BAY'),
  ('HUN', 'HUN'),
  ('CLE', 'CLE'),
  ('HEF', 'HEF'),
  ('MEM', 'MEM')
on conflict (code) do nothing;

insert into states (code, name, region_type, fips_or_geo_id) values
  ('AL','Alabama','us_state','01'), ('AK','Alaska','us_state','02'), ('AZ','Arizona','us_state','04'),
  ('AR','Arkansas','us_state','05'), ('CA','California','us_state','06'), ('CO','Colorado','us_state','08'),
  ('CT','Connecticut','us_state','09'), ('DE','Delaware','us_state','10'), ('DC','District of Columbia','us_state','11'),
  ('FL','Florida','us_state','12'), ('GA','Georgia','us_state','13'), ('HI','Hawaii','us_state','15'),
  ('ID','Idaho','us_state','16'), ('IL','Illinois','us_state','17'), ('IN','Indiana','us_state','18'),
  ('IA','Iowa','us_state','19'), ('KS','Kansas','us_state','20'), ('KY','Kentucky','us_state','21'),
  ('LA','Louisiana','us_state','22'), ('ME','Maine','us_state','23'), ('MD','Maryland','us_state','24'),
  ('MA','Massachusetts','us_state','25'), ('MI','Michigan','us_state','26'), ('MN','Minnesota','us_state','27'),
  ('MS','Mississippi','us_state','28'), ('MO','Missouri','us_state','29'), ('MT','Montana','us_state','30'),
  ('NE','Nebraska','us_state','31'), ('NV','Nevada','us_state','32'), ('NH','New Hampshire','us_state','33'),
  ('NJ','New Jersey','us_state','34'), ('NM','New Mexico','us_state','35'), ('NY','New York','us_state','36'),
  ('NC','North Carolina','us_state','37'), ('ND','North Dakota','us_state','38'), ('OH','Ohio','us_state','39'),
  ('OK','Oklahoma','us_state','40'), ('OR','Oregon','us_state','41'), ('PA','Pennsylvania','us_state','42'),
  ('RI','Rhode Island','us_state','44'), ('SC','South Carolina','us_state','45'), ('SD','South Dakota','us_state','46'),
  ('TN','Tennessee','us_state','47'), ('TX','Texas','us_state','48'), ('UT','Utah','us_state','49'),
  ('VT','Vermont','us_state','50'), ('VA','Virginia','us_state','51'), ('WA','Washington','us_state','53'),
  ('WV','West Virginia','us_state','54'), ('WI','Wisconsin','us_state','55'), ('WY','Wyoming','us_state','56'),
  ('AB','Alberta','ca_province','CA-AB'), ('BC','British Columbia','ca_province','CA-BC'),
  ('MB','Manitoba','ca_province','CA-MB'), ('NB','New Brunswick','ca_province','CA-NB'),
  ('NL','Newfoundland and Labrador','ca_province','CA-NL'), ('NS','Nova Scotia','ca_province','CA-NS'),
  ('NT','Northwest Territories','ca_province','CA-NT'), ('NU','Nunavut','ca_province','CA-NU'),
  ('ON','Ontario','ca_province','CA-ON'), ('PE','Prince Edward Island','ca_province','CA-PE'),
  ('QC','Quebec','ca_province','CA-QC'), ('SK','Saskatchewan','ca_province','CA-SK'),
  ('YT','Yukon Territory','ca_province','CA-YT')
on conflict (code) do nothing;
