const rides = [
  {
    id: 'ride-1',
    from: 'Kolín',
    to: 'ČZU Suchdol',
    departure: '2025-12-22T15:40:00',
    meetingPoint: 'Kolín hl.n., parkoviště P2',
    duration: '55 min',
    distance: '68 km',
    price: 90,
    currency: 'Kč',
    seats: 4,
    availableSeats: 2,
    tags: ['Wi-Fi', 'Veg snack'],
    description: 'Klidná jízda po dálnici. Beru si kávu a podcast, preferuji příjezd na ČZU kolem 16:40.',
    driver: {
      name: 'Petra Nováková',
      rating: 4.9,
      trips: 128,
      car: 'Škoda Fabia',
      color: 'Tmavě zelená',
      plate: '7A1 2345',
      bio: 'Studentka PEF, miluju zelené inovace a sdílení cest.',
      initials: 'PN'
    },
    reviews: [
      { author: 'Tereza', rating: 5, text: 'Spolehlivá řidička, příjemná jízda.', date: 'duben 2025' },
      { author: 'Michal', rating: 5, text: 'Auto čisté, Petra je moc fajn.', date: 'březen 2025' }
    ]
  },
  {
    id: 'ride-2',
    from: 'Kladno',
    to: 'ČZU Koleje',
    departure: '2025-12-22T18:10:00',
    meetingPoint: 'Kladno centrum, zastávka OAZA',
    duration: '45 min',
    distance: '42 km',
    price: 80,
    currency: 'Kč',
    seats: 3,
    availableSeats: 1,
    tags: ['Tichá jízda'],
    description: 'Jedeme přímo na koleje. Preferuji klid, ale rád si popovídám o semestrálkách.',
    driver: {
      name: 'Jan Doležal',
      rating: 4.8,
      trips: 94,
      car: 'Hyundai i30',
      color: 'Modrá',
      plate: '5BC 7896',
      bio: 'Technická fakulta, fanoušek agro-technologií.',
      initials: 'JD'
    },
    reviews: [
      { author: 'Klára', rating: 5, text: 'Honza dorazil přesně, doporučuji.', date: 'květen 2025' }
    ]
  },
  {
    id: 'ride-3',
    from: 'Mladá Boleslav',
    to: 'ČZU Suchdol',
    departure: '2025-12-23T07:20:00',
    meetingPoint: 'Mladá Boleslav, OC Olympia',
    duration: '1 h 5 min',
    distance: '74 km',
    price: 110,
    currency: 'Kč',
    seats: 4,
    availableSeats: 3,
    tags: ['USB nabíjení', 'Káva'],
    description: 'Ranní jízda s přestávkou na kávu, auto má USB konektory a adaptér pro notebook.',
    driver: {
      name: 'Lucie Horská',
      rating: 5,
      trips: 210,
      car: 'Toyota Corolla',
      color: 'Bílá',
      plate: '4CZ 4457',
      bio: 'FŽP, řešíme klimatické projekty a ráda diskuji cestou.',
      initials: 'LH'
    },
    reviews: [
      { author: 'Martin', rating: 5, text: 'Lucie vždycky nabídne kávu a energii.', date: 'únor 2025' },
      { author: 'Hana', rating: 4.5, text: 'Bezpečná jízda, doporučuji.', date: 'leden 2025' }
    ]
  },
  {
    id: 'ride-4',
    from: 'Plzeň',
    to: 'ČZU Suchdol',
    departure: '2025-12-24T14:00:00',
    meetingPoint: 'Plzeň, OC Borská pole (parkoviště C)',
    duration: '1 h 45 min',
    distance: '93 km',
    price: 160,
    currency: 'Kč',
    seats: 5,
    availableSeats: 0,
    tags: ['Sdílené náklady'],
    description: 'Delší jízda přes Beroun, možnost vyzvednutí po cestě. Auto má velký kufr.',
    driver: {
      name: 'Adam Hruška',
      rating: 4.7,
      trips: 56,
      car: 'Volkswagen Passat',
      color: 'Černá',
      plate: '2AP 3345',
      bio: 'Student AF, vozím často laboratorní vybavení.',
      initials: 'AH'
    },
    reviews: [
      { author: 'Daniel', rating: 4.5, text: 'Pohodlná jízda, hodně místa.', date: 'březen 2025' }
    ]
  },
  {
    id: 'ride-5',
    from: 'Beroun',
    to: 'ČZU Suchdol',
    departure: '2025-12-24T07:00:00',
    meetingPoint: 'Beroun, autobusové nádraží',
    duration: '50 min',
    distance: '48 km',
    price: 85,
    currency: 'Kč',
    seats: 4,
    availableSeats: 2,
    tags: ['Tichá jízda', 'Wi-Fi'],
    description: 'Ranní výjezd na přednášku, můžu zastavit u Loděnice.',
    driver: {
      name: 'Eliška Mašková',
      rating: 4.9,
      trips: 180,
      car: 'Kia Ceed',
      color: 'Červená',
      plate: '3AC 9987',
      bio: 'Milovnice kávy a podcastů, studentka PEF.',
      initials: 'EM'
    },
    reviews: [
      { author: 'Sabina', rating: 5, text: 'Skvělá hudba a pohodová jízda.', date: 'duben 2025' }
    ]
  },
  {
    id: 'ride-6',
    from: 'Kolín',
    to: 'ČZU Suchdol',
    departure: '2025-12-24T12:30:00',
    meetingPoint: 'Kolín, Benešova 104',
    duration: '55 min',
    distance: '68 km',
    price: 95,
    currency: 'Kč',
    seats: 4,
    availableSeats: 3,
    tags: ['Sdílené náklady'],
    description: 'Jedeme na oběd do menzy, můžu vzít batohy.',
    driver: {
      name: 'Marek Dvořák',
      rating: 4.6,
      trips: 76,
      car: 'Ford Focus',
      color: 'Šedá',
      plate: '4BD 2245',
      bio: 'Agronom, většinou poslouchám sportovní podcasty.',
      initials: 'MD'
    },
    reviews: [
      { author: 'Ondřej', rating: 4.5, text: 'Jízda v pohodě, přijel včas.', date: 'květen 2025' }
    ]
  },
  {
    id: 'ride-7',
    from: 'ČZU Suchdol',
    to: 'Nymburk',
    departure: '2025-12-24T17:10:00',
    meetingPoint: 'ČZU, před Menzou',
    duration: '1 h',
    distance: '60 km',
    price: 90,
    currency: 'Kč',
    seats: 4,
    availableSeats: 2,
    tags: ['Tichá jízda'],
    description: 'Odpolední odjezd po cvičení, možnost vysadit v Poděbradech.',
    driver: {
      name: 'Tomáš Krejčí',
      rating: 4.8,
      trips: 140,
      car: 'Seat Leon',
      color: 'Bílá',
      plate: '7BD 3158',
      bio: 'FŽP student, často vozím kolegy směrem na Hradec.',
      initials: 'TK'
    },
    reviews: [
      { author: 'Ivana', rating: 5, text: 'Příjemný řidič, dobré tempo.', date: 'duben 2025' }
    ]
  },
  {
    id: 'ride-8',
    from: 'ČZU Koleje',
    to: 'Pardubice',
    departure: '2025-12-25T08:15:00',
    meetingPoint: 'ČZU Koleje, vrátnice A',
    duration: '1 h 40 min',
    distance: '120 km',
    price: 170,
    currency: 'Kč',
    seats: 3,
    availableSeats: 1,
    tags: ['USB nabíjení'],
    description: 'Vyrážím domů, auto má USB a klimatizaci.',
    driver: {
      name: 'Roman Černý',
      rating: 4.7,
      trips: 88,
      car: 'Peugeot 308',
      color: 'Modrá',
      plate: '2CC 5566',
      bio: 'Informatik, rád proberu projekty.',
      initials: 'RČ'
    },
    reviews: [
      { author: 'Barbora', rating: 4.5, text: 'Pohodlné auto, přijel přesně.', date: 'únor 2025' }
    ]
  },
  {
    id: 'ride-9',
    from: 'ČZU Suchdol',
    to: 'Liberec',
    departure: '2025-12-25T15:00:00',
    meetingPoint: 'ČZU, parkoviště u rektorátu',
    duration: '1 h 30 min',
    distance: '109 km',
    price: 180,
    currency: 'Kč',
    seats: 4,
    availableSeats: 3,
    tags: ['Domácí koláč'],
    description: 'Vezmu malé občerstvení, jedeme přes Mladou Boleslav.',
    driver: {
      name: 'Anna Pavlíková',
      rating: 5,
      trips: 75,
      car: 'Mazda 3',
      color: 'Stříbrná',
      plate: '6AT 7654',
      bio: 'Zooložka, často mluvím o projektech se zvířaty.',
      initials: 'AP'
    },
    reviews: [
      { author: 'Jitka', rating: 5, text: 'Milá společnost a čisté auto.', date: 'březen 2025' }
    ]
  },
  {
    id: 'ride-10',
    from: 'ČZU Suchdol',
    to: 'Kladno',
    departure: '2025-12-23T19:30:00',
    meetingPoint: 'ČZU, hlavní brána',
    duration: '35 min',
    distance: '32 km',
    price: 60,
    currency: 'Kč',
    seats: 4,
    availableSeats: 1,
    tags: ['Hudba'],
    description: 'Krátký převoz po večerních přednáškách.',
    driver: {
      name: 'Barbora Dohnalová',
      rating: 4.6,
      trips: 54,
      car: 'Renault Clio',
      color: 'Žlutá',
      plate: '8BD 2044',
      bio: 'PEF, ráda hraje chill playlist.',
      initials: 'BD'
    },
    reviews: [
      { author: 'Simona', rating: 4.5, text: 'Krátká cesta, dobrý řidič.', date: 'květen 2025' }
    ]
  },
  {
    id: 'ride-11',
    from: 'Hradec Králové',
    to: 'ČZU Suchdol',
    departure: '2025-12-26T17:45:00',
    meetingPoint: 'HK, u Aldisu',
    duration: '1 h 20 min',
    distance: '112 km',
    price: 150,
    currency: 'Kč',
    seats: 4,
    availableSeats: 2,
    tags: ['Tichá jízda', 'Klimatizace'],
    description: 'Nedělní návrat na kolej, preferuji klid.',
    driver: {
      name: 'Viktor Král',
      rating: 4.8,
      trips: 160,
      car: 'Škoda Octavia',
      color: 'Černá',
      plate: '1HK 2244',
      bio: 'Mám rád rychlé, ale bezpečné cesty.',
      initials: 'VK'
    },
    reviews: [
      { author: 'Ema', rating: 5, text: 'Čisté auto a pohodová jízda.', date: 'duben 2025' }
    ]
  },
  {
    id: 'ride-12',
    from: 'České Budějovice',
    to: 'ČZU Suchdol',
    departure: '2025-12-23T13:10:00',
    meetingPoint: 'ČB, Mercury centrum',
    duration: '1 h 50 min',
    distance: '150 km',
    price: 190,
    currency: 'Kč',
    seats: 4,
    availableSeats: 3,
    tags: ['Wi-Fi', 'USB nabíjení'],
    description: 'Vezmu vás pohodlně, v autě je Wi-Fi router.',
    driver: {
      name: 'Pavel Němec',
      rating: 4.9,
      trips: 200,
      car: 'Tesla Model 3',
      color: 'Bílá',
      plate: '7CB 7788',
      bio: 'Milovník technologií a čisté energie.',
      initials: 'PN'
    },
    reviews: [
      { author: 'Radka', rating: 5, text: 'Luxusní jízda a rychlé dobití.', date: 'květen 2025' }
    ]
  },
  {
    id: 'ride-13',
    from: 'ČZU Suchdol',
    to: 'Příbram',
    departure: '2025-12-26T12:00:00',
    meetingPoint: 'ČZU, parkoviště FŽP',
    duration: '1 h',
    distance: '70 km',
    price: 120,
    currency: 'Kč',
    seats: 4,
    availableSeats: 2,
    tags: ['Sdílené náklady'],
    description: 'Nedělní oběd doma, rád vezmu i velké batohy.',
    driver: {
      name: 'Stanislav Vorel',
      rating: 4.5,
      trips: 68,
      car: 'Dacia Duster',
      color: 'Hnědá',
      plate: '5PR 9987',
      bio: 'Lesník, beru větší kufry i nářadí.',
      initials: 'SV'
    },
    reviews: [
      { author: 'Dominik', rating: 4.5, text: 'Dobrá cena a spolehlivý čas.', date: 'březen 2025' }
    ]
  },
  {
    id: 'ride-14',
    from: 'Mělník',
    to: 'ČZU Suchdol',
    departure: '2025-12-22T06:50:00',
    meetingPoint: 'Mělník, u Labe',
    duration: '45 min',
    distance: '38 km',
    price: 75,
    currency: 'Kč',
    seats: 4,
    availableSeats: 2,
    tags: ['Ranní káva'],
    description: 'Vezmu termosku s kávou, jedeme rovnou na přednášku.',
    driver: {
      name: 'Karolína Svobodová',
      rating: 4.8,
      trips: 134,
      car: 'Volkswagen Golf',
      color: 'Bílá',
      plate: '2MK 4477',
      bio: 'Studentka PEF, preferuji ranní ticho.',
      initials: 'KS'
    },
    reviews: [
      { author: 'Alžběta', rating: 5, text: 'Karolína jezdí přesně podle času.', date: 'květen 2025' }
    ]
  },
  {
    id: 'ride-15',
    from: 'ČZU Koleje',
    to: 'Kralupy nad Vltavou',
    departure: '2025-12-22T18:40:00',
    meetingPoint: 'ČZU Koleje, budova B',
    duration: '35 min',
    distance: '30 km',
    price: 60,
    currency: 'Kč',
    seats: 4,
    availableSeats: 2,
    tags: ['Hudba', 'Klimatizace'],
    description: 'Veselá jízda s hudbou, jedeme přes Roztoky.',
    driver: {
      name: 'Michaela Řeháková',
      rating: 4.7,
      trips: 92,
      car: 'Honda Civic',
      color: 'Modrá',
      plate: '4KR 2242',
      bio: 'Studuji ekonomii, ráda si popovídám.',
      initials: 'MŘ'
    },
    reviews: [
      { author: 'Tonda', rating: 4.5, text: 'Jízda s hudbou, bylo to fajn.', date: 'duben 2025' }
    ]
  },
  {
    id: 'ride-16',
    from: 'Příbram',
    to: 'ČZU Suchdol',
    departure: '2025-12-27T07:20:00',
    meetingPoint: 'Příbram, autobusové nádraží',
    duration: '1 h 5 min',
    distance: '71 km',
    price: 110,
    currency: 'Kč',
    seats: 4,
    availableSeats: 3,
    tags: ['USB nabíjení'],
    description: 'Ranní cesta do školy, nabíječky v autě.',
    driver: {
      name: 'Daniela Havlová',
      rating: 4.9,
      trips: 145,
      car: 'Hyundai Tucson',
      color: 'Stříbrná',
      plate: '3PH 7852',
      bio: 'Řídím klidně, ráda pouštím podcasty.',
      initials: 'DH'
    },
    reviews: [
      { author: 'Adéla', rating: 5, text: 'Příjemná řidička a čisté auto.', date: 'květen 2025' }
    ]
  },
  {
    id: 'ride-17',
    from: 'ČZU Suchdol',
    to: 'Brno',
    departure: '2025-12-27T14:30:00',
    meetingPoint: 'ČZU, parkoviště P2',
    duration: '2 h 30 min',
    distance: '210 km',
    price: 320,
    currency: 'Kč',
    seats: 4,
    availableSeats: 3,
    tags: ['Wi-Fi', 'Klimatizace'],
    description: 'Dlouhá cesta na konferenci, pohodlné sezení.',
    driver: {
      name: 'Josef Malý',
      rating: 4.8,
      trips: 210,
      car: 'Skoda Superb',
      color: 'Tmavě modrá',
      plate: '2BR 3322',
      bio: 'Doktorand, rád sdílím náklady na palivo.',
      initials: 'JM'
    },
    reviews: [
      { author: 'Filip', rating: 5, text: 'Super komfort a rychlá cesta.', date: 'duben 2025' }
    ]
  },
  {
    id: 'ride-18',
    from: 'Louny',
    to: 'ČZU Suchdol',
    departure: '2025-12-23T08:00:00',
    meetingPoint: 'Louny, náměstí',
    duration: '1 h 10 min',
    distance: '74 km',
    price: 115,
    currency: 'Kč',
    seats: 4,
    availableSeats: 2,
    tags: ['Tichá jízda'],
    description: 'Ranní cesta, vyzvednu i v Lovosicích.',
    driver: {
      name: 'Kristýna Láchová',
      rating: 4.7,
      trips: 110,
      car: 'Toyota Yaris',
      color: 'Červená',
      plate: '1LN 6677',
      bio: 'Studentka, ráda jezdím načas.',
      initials: 'KL'
    },
    reviews: [
      { author: 'Magda', rating: 4.5, text: 'Vždy dorazí včas.', date: 'květen 2025' }
    ]
  },
  {
    id: 'ride-19',
    from: 'ČZU Suchdol',
    to: 'Rakovník',
    departure: '2025-12-28T16:00:00',
    meetingPoint: 'ČZU, hlavní brána',
    duration: '1 h 5 min',
    distance: '70 km',
    price: 110,
    currency: 'Kč',
    seats: 4,
    availableSeats: 2,
    tags: ['Sdílené náklady'],
    description: 'Cesta přes Kladno, možnost vysazení.',
    driver: {
      name: 'Renata Pokorná',
      rating: 4.6,
      trips: 90,
      car: 'Opel Astra',
      color: 'Zelená',
      plate: '6RA 1020',
      bio: 'Studentka FAPPZ, často vozím projektové materiály.',
      initials: 'RP'
    },
    reviews: [
      { author: 'Kamil', rating: 4.5, text: 'Ochotná a spolehlivá.', date: 'březen 2025' }
    ]
  },
  {
    id: 'ride-20',
    from: 'ČZU Suchdol',
    to: 'Plzeň',
    departure: '2025-12-24T18:20:00',
    meetingPoint: 'ČZU, parkoviště u kolejí',
    duration: '1 h 40 min',
    distance: '93 km',
    price: 160,
    currency: 'Kč',
    seats: 4,
    availableSeats: 3,
    tags: ['Hudba'],
    description: 'Pátek domů, můžeme sdílet palivo.',
    driver: {
      name: 'Karel Hnízdil',
      rating: 4.7,
      trips: 130,
      car: 'Volkswagen Polo',
      color: 'Černá',
      plate: '3PL 5544',
      bio: 'Stavební inženýr, rád povídám.',
      initials: 'KH'
    },
    reviews: [
      { author: 'Lucie', rating: 4.5, text: 'Spolehlivá jízda, pohodlné.', date: 'duben 2025' }
    ]
  },
  {
    id: 'ride-21',
    from: 'Tábor',
    to: 'ČZU Suchdol',
    departure: '2025-12-28T06:30:00',
    meetingPoint: 'Tábor, autobusové nádraží',
    duration: '1 h 40 min',
    distance: '110 km',
    price: 170,
    currency: 'Kč',
    seats: 4,
    availableSeats: 2,
    tags: ['USB nabíjení'],
    description: 'Vyrážím brzy ráno, pauza na kávu možná.',
    driver: {
      name: 'Natálie Hrubá',
      rating: 4.9,
      trips: 120,
      car: 'Audi A3',
      color: 'Stříbrná',
      plate: '1TA 3344',
      bio: 'Studentka PEF, mám ráda ticho.',
      initials: 'NH'
    },
    reviews: [
      { author: 'Petr', rating: 5, text: 'Natálie jezdí bezpečně.', date: 'duben 2025' }
    ]
  },
  {
    id: 'ride-22',
    from: 'ČZU Suchdol',
    to: 'Havířov',
    departure: '2025-12-29T14:00:00',
    meetingPoint: 'ČZU, parkoviště P1',
    duration: '3 h 40 min',
    distance: '350 km',
    price: 480,
    currency: 'Kč',
    seats: 4,
    availableSeats: 3,
    tags: ['Klimatizace', 'Wi-Fi'],
    description: 'Dlouhá trasa, nabízím pohodlí a pauzu po cestě.',
    driver: {
      name: 'Lenka Říhová',
      rating: 4.8,
      trips: 90,
      car: 'Volkswagen Passat',
      color: 'Bílá',
      plate: '2HV 7777',
      bio: 'Mám ráda komfortní cestování.',
      initials: 'LŘ'
    },
    reviews: [
      { author: 'Šimon', rating: 5, text: 'Skvělá jízda na dlouhou vzdálenost.', date: 'březen 2025' }
    ]
  },
  {
    id: 'ride-23',
    from: 'ČZU Koleje',
    to: 'Praha centrum',
    departure: '2025-12-22T09:15:00',
    meetingPoint: 'ČZU Koleje, před Kolejní',
    duration: '25 min',
    distance: '12 km',
    price: 40,
    currency: 'Kč',
    seats: 4,
    availableSeats: 4,
    tags: ['Ranní káva'],
    description: 'Krátká jízda na stáž, můžeme sdílet náklady.',
    driver: {
      name: 'Alexandr Benda',
      rating: 4.6,
      trips: 60,
      car: 'Smart ForFour',
      color: 'Bílá',
      plate: '7PR 8000',
      bio: 'Miluji město a rychlé přesuny.',
      initials: 'AB'
    },
    reviews: [
      { author: 'Tereza', rating: 4.5, text: 'Rychlé domluvení, čisté auto.', date: 'květen 2025' }
    ]
  },
  {
    id: 'ride-24',
    from: 'ČZU Suchdol',
    to: 'Kolín',
    departure: '2025-12-29T18:00:00',
    meetingPoint: 'ČZU, parkoviště za Aulou',
    duration: '55 min',
    distance: '68 km',
    price: 95,
    currency: 'Kč',
    seats: 4,
    availableSeats: 2,
    tags: ['Hudba'],
    description: 'Večerní návrat domů, pohodová atmosféra.',
    driver: {
      name: 'Klára Veselá',
      rating: 4.9,
      trips: 115,
      car: 'Škoda Scala',
      color: 'Červená',
      plate: '1KO 3355',
      bio: 'Studentka, ráda řídím a hraju chill hudbu.',
      initials: 'KV'
    },
    reviews: [
      { author: 'Jiří', rating: 5, text: 'Přátelská řidička, příjemná cesta.', date: 'duben 2025' }
    ]
  }
];

const account = {
  name: 'Matěj Kořínek',
  email: 'matej.korinek@studenti.czu.cz',
  role: 'driver',
  rating: 4.9,
  driverRides: [
    { id: 'ride-1', title: 'Kolín → ČZU Suchdol', date: '22. 5. 2025 15:40', seats: '2/4 obsazeno', status: 'Plánováno' },
    { id: 'ride-4', title: 'Plzeň → ČZU Suchdol', date: '24. 5. 2025 14:00', seats: 'Plně obsazeno', status: 'Potvrzeno' }
  ],
  passengerRides: [
    { id: 'ride-2', title: 'Kladno → ČZU Koleje', date: '18. 5. 2025 18:10', seats: '1 místo', status: 'Dokončeno' },
    { id: 'ride-3', title: 'Mladá Boleslav → ČZU', date: '12. 5. 2025 7:20', seats: '2 místa', status: 'Potvrzeno' }
  ],
  vehicles: [
    { id: 'vehicle-1', brand: 'Škoda', model: 'Octavia', color: 'Tmavě zelená', plate: '3AB 4567', engine: 'benzin' },
    { id: 'vehicle-2', brand: 'Hyundai', model: 'Ioniq 5', color: 'Perleťově bílá', plate: '5EK 9087', engine: 'electro' }
  ]
};

const withDelay = (value, delay = 380) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), delay);
  });

const normalise = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '');

const filterRides = (filters = {}) => {
  const campusNeedle = 'czu';

  return rides.filter((ride) => {
    if (ride.availableSeats === 0) {
      return false;
    }
    if (filters.direction === 'to' && !normalise(ride.to).includes(campusNeedle)) {
      return false;
    }
    if (filters.direction === 'from' && !normalise(ride.from).includes(campusNeedle)) {
      return false;
    }
    if (filters.from && !normalise(ride.from).includes(normalise(filters.from))) {
      return false;
    }
    if (filters.to && !normalise(ride.to).includes(normalise(filters.to))) {
      return false;
    }
    if (filters.date) {
      const rideDate = ride.departure.slice(0, 10);
      if (rideDate !== filters.date) {
        return false;
      }
    }
    if (filters.seats) {
      const requiredSeats = Number(filters.seats);
      if (!Number.isNaN(requiredSeats) && ride.availableSeats < requiredSeats) {
        return false;
      }
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== '') {
      const maxPrice = Number(filters.maxPrice);
      if (!Number.isNaN(maxPrice) && ride.price > maxPrice) {
        return false;
      }
    }
    return true;
  });
};

export const getRides = (filters = {}) => {
  const filtered = filterRides(filters);
  const sorted = [...filtered].sort((a, b) => a.departure.localeCompare(b.departure));
  return withDelay(sorted);
};

export const getFeaturedRides = () => {
  const sorted = [...rides]
    .sort((a, b) => a.departure.localeCompare(b.departure))
    .filter((ride) => ride.availableSeats > 0);
  return withDelay(sorted.slice(0, 3), 260);
};

export const getRideById = (id) => {
  const ride = rides.find((item) => item.id === id) || null;
  return withDelay(ride, 280);
};

export const getAccountOverview = () => {
  return withDelay(account, 300);
};
