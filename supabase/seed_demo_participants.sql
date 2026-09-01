-- Optional: six fake participants so the directory and Focus Circle pages have
-- something to render before real people are invited. Delete them before launch:
--   delete from participants where email like '%@example.test';

insert into participants (full_name, email, company_name, company_website, instagram_url, home_cohort_id,
                          what_company_does, why_started, proud_of, biggest_challenge, good_at, hope_to_get_from_group)
select v.full_name, v.email, v.company_name, v.website, v.instagram, c.id,
       v.does, v.why, v.proud, v.challenge, v.good, v.hope
from (values
  ('Spring 2026', 'Anna Bergström', 'anna@example.test', 'Nordic Knit',   'https://nordicknit.example', 'https://instagram.com/example',
   'Hand-finished wool knitwear sold direct to consumers across the Nordics.',
   'I could not find knitwear that lasted more than two winters, so I made my own.',
   'Reaching profitability in year two without outside money.',
   'Production capacity — my supplier caps out at 400 units a month.',
   'Product development and supplier relationships.',
   'Honest feedback from people who are further along than me.'),
  ('Spring 2026', 'Johan Lind', 'johan@example.test', 'Cyklo',            'https://cyklo.example', null,
   'Refurbished city bikes with a two-year warranty.',
   'Watching perfectly good bikes go to scrap every spring.',
   'A repair process that takes 90 minutes instead of a full day.',
   'Customers still think refurbished means unreliable.',
   'Operations and unit economics.',
   'Ideas for changing how people perceive second-hand.'),
  ('Spring 2026', 'Mira Olsson', 'mira@example.test', 'Salt & Sur',       'https://saltsur.example', null,
   'Small-batch fermented condiments, sold online and in delis.',
   'A hobby that got out of hand in the best way.',
   'Getting into 40 stores with no sales team.',
   'Shelf life limits how far I can ship.',
   'Brand and storytelling.',
   'Help thinking about export.'),
  ('Autumn 2026', 'Petra Nyman', 'petra@example.test', 'Loop Lager',      'https://looplager.example', null,
   'Returns handling as a service for small e-commerce brands.',
   'I ran returns for a retailer and knew it could be done far better.',
   'Cutting a client return-to-shelf time from 11 days to 3.',
   'Selling to founders who have not yet felt the pain.',
   'Process design and warehouse logistics.',
   'Sharper positioning and a clearer pitch.'),
  ('Autumn 2026', 'Tobias Ek', 'tobias@example.test', 'Fältkök',          'https://faltkok.example', null,
   'Camp cooking gear designed and made in Sweden.',
   'Ten years of guiding trips with equipment that kept breaking.',
   'Every part is replaceable — nothing gets thrown away.',
   'Finding customers outside the outdoor niche.',
   'Design and manufacturing.',
   'A sanity check on whether to raise money at all.'),
  ('Autumn 2026', 'Yara Haddad', 'yara@example.test', 'Studio Halva',     'https://studiohalva.example', null,
   'Modular furniture for small apartments, shipped flat.',
   'I lived in 28 square metres and nothing fit.',
   'A shelving system that ships as a single parcel.',
   'Cash flow — production runs are paid before anything sells.',
   'Industrial design and CAD.',
   'Practical advice on financing inventory.')
) as v(cohort, full_name, email, company_name, website, instagram,
       does, why, proud, challenge, good, hope)
join cohorts c on c.name = v.cohort
join programs p on p.id = c.program_id and p.slug = 'future-retail-incubator';
