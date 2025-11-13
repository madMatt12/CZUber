const rides = [
  {
    id: 'ride-1',
    from: 'Kolín',
    to: 'ČZU Suchdol',
    departure: '2024-05-22T15:40:00',
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
      { author: 'Tereza', rating: 5, text: 'Spolehlivá řidička, příjemná jízda.', date: 'duben 2024' },
      { author: 'Michal', rating: 5, text: 'Auto čisté, Petra je moc fajn.', date: 'březen 2024' }
    ]
  },
  {
    id: 'ride-2',
    from: 'Kladno',
    to: 'ČZU Koleje',
    departure: '2024-05-22T18:10:00',
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
      { author: 'Klára', rating: 5, text: 'Honza dorazil přesně, doporučuji.', date: 'květen 2024' }
    ]
  },
  {
    id: 'ride-3',
    from: 'Mladá Boleslav',
    to: 'ČZU Suchdol',
    departure: '2024-05-23T07:20:00',
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
      { author: 'Martin', rating: 5, text: 'Lucie vždycky nabídne kávu a energii.', date: 'únor 2024' },
      { author: 'Hana', rating: 4.5, text: 'Bezpečná jízda, doporučuji.', date: 'leden 2024' }
    ]
  },
  {
    id: 'ride-4',
    from: 'Plzeň',
    to: 'ČZU Suchdol',
    departure: '2024-05-24T14:00:00',
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
      { author: 'Daniel', rating: 4.5, text: 'Pohodlná jízda, hodně místa.', date: 'březen 2024' }
    ]
  }
];

const account = {
  name: 'Matěj Kořínek',
  role: 'driver',
  rating: 4.9,
  driverRides: [
    { id: 'ride-1', title: 'Kolín → ČZU Suchdol', date: '22. 5. 2024 15:40', seats: '2/4 obsazeno', status: 'Plánováno' },
    { id: 'ride-4', title: 'Plzeň → ČZU Suchdol', date: '24. 5. 2024 14:00', seats: 'Plně obsazeno', status: 'Potvrzeno' }
  ],
  passengerRides: [
    { id: 'ride-2', title: 'Kladno → ČZU Koleje', date: '18. 5. 2024 18:10', seats: '1 místo', status: 'Dokončeno' },
    { id: 'ride-3', title: 'Mladá Boleslav → ČZU', date: '12. 5. 2024 7:20', seats: '2 místa', status: 'Potvrzeno' }
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

const normalise = (value = '') => value.toString().trim().toLowerCase();

const filterRides = (filters = {}) => {
  return rides.filter((ride) => {
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
    if (filters.onlyAvailable && ride.availableSeats === 0) {
      return false;
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
