const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const PUBLIC = path.join(__dirname, 'wwwroot');

let users = [];
let subscriptions = [];
let scannerLogs = [];
let bookings = [
  {
    id: 1,
    userId: 1,
    eventId: 1,
    bookingCode: "TKT-8F3K92X1",
    seatNumber: "A-25",
    quantity: 1,
    totalAmount: 300,
    paymentMethod: "bKash",
    transactionId: "TXN-8890BKASH",
    bookingDate: "2026-10-25T20:00:00",
    status: "Confirmed",
    eventTitle: "Dhaka Music Festival",
    eventVenue: "Army Stadium",
    eventDate: "2026-10-25T20:00:00",
    userName: "Maliha",
    userEmail: "maliha@aura.com"
  },
  {
    id: 2,
    userId: 1,
    eventId: 2,
    bookingCode: "TKT-4F9P12X9",
    seatNumber: "B-14",
    quantity: 1,
    totalAmount: 500,
    paymentMethod: "Nagad",
    transactionId: "TXN-4521NAGAD",
    bookingDate: "2026-11-02T18:00:00",
    status: "Confirmed",
    checkInTime: new Date(Date.now() - 3600000).toISOString(),
    eventTitle: "Football Championship",
    eventVenue: "Santiago Bernabéu Stadium",
    eventDate: "2026-11-02T18:00:00",
    userName: "Maliha",
    userEmail: "maliha@aura.com"
  }
];
let reviews = [
  { id: 1, userId: 1, userName: "Maliha", content: "The soundstage and 3D atmosphere at AURA events are truly out of this world! Instant bKash ticketing made entry seamless.", rating: 5, createdAt: new Date().toISOString() },
  { id: 2, userId: 2, userName: "Tariq Ahmed", content: "Super clean interface. Ticket scanning at the gate took less than 2 seconds with the QR digital pass.", rating: 5, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 3, userId: 3, userName: "Sara Khan", content: "Great concert lineup! Looking forward to the EDM festival next month.", rating: 4, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() }
];

let events = [
  {
    id: 1,
    title: "Red Carpet Countdown 2025",
    description: "Exclusive New Year celebration with live performances, grand dinner, and midnight fireworks.",
    venue: "Grand Ball Room, Radisson Blu",
    location: "Dhaka, Bangladesh",
    eventDate: "2025-12-31T20:00:00",
    price: 300,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800",
    totalTickets: 500,
    availableTickets: 320,
    category: "Gala"
  },
  {
    id: 2,
    title: "Electric Dreams Festival",
    description: "The biggest EDM event of the season featuring world-renowned DJs and spectacular laser shows.",
    venue: "City Convention Center",
    location: "Mumbai, India",
    eventDate: "2026-01-15T18:00:00",
    price: 250,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800",
    totalTickets: 1000,
    availableTickets: 750,
    category: "Festival"
  },
  {
    id: 3,
    title: "Summer Vibes Concert",
    description: "An open-air music extravaganza showcasing rock, pop, and indie bands under the stars.",
    venue: "Open Air Stadium",
    location: "Dubai, UAE",
    eventDate: "2026-02-20T19:30:00",
    price: 350,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800",
    totalTickets: 800,
    availableTickets: 450,
    category: "Concert"
  },
  {
    id: 4,
    title: "CyberTech Expo 2026",
    description: "Explore breakthrough AI innovations, web3 tech, and futuristic gadgets with global pioneers.",
    venue: "Suntec Convention Centre",
    location: "Singapore",
    eventDate: "2026-03-10T10:00:00",
    price: 500,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800",
    totalTickets: 400,
    availableTickets: 120,
    category: "Tech"
  },
  {
    id: 5,
    title: "Neon Nights EDM Fest",
    description: "An immersive neon universe of hypnotic beats, bass drops, and high-energy crowd vibes.",
    venue: "Impact Arena",
    location: "Bangkok, Thailand",
    eventDate: "2026-03-25T21:00:00",
    price: 400,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800",
    totalTickets: 600,
    availableTickets: 0,
    category: "EDM"
  },
  {
    id: 6,
    title: "Valorant Champions Arena",
    description: "Watch top esports athletes battle live in intense tactical showdowns for the world trophy.",
    venue: "KSPODOME Arena",
    location: "Seoul, South Korea",
    eventDate: "2026-04-12T14:00:00",
    price: 200,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800",
    totalTickets: 1200,
    availableTickets: 890,
    category: "Esports"
  },
  {
    id: 7,
    title: "Symphony Under Stars",
    description: "Enchanting classical orchestra performance playing Mozart and Beethoven in the open air.",
    venue: "Vienna Philharmonic Hall",
    location: "Vienna, Austria",
    eventDate: "2026-05-05T19:00:00",
    price: 450,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800",
    totalTickets: 350,
    availableTickets: 45,
    category: "Classical"
  },
  {
    id: 8,
    title: "Paris Haute Couture Fashion",
    description: "High fashion runway showcasing luxury autumn collections by premier international designers.",
    venue: "Grand Palais",
    location: "Paris, France",
    eventDate: "2026-05-18T17:30:00",
    price: 600,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800",
    totalTickets: 300,
    availableTickets: 80,
    category: "Fashion"
  },
  {
    id: 9,
    title: "Rock Revolution Live",
    description: "Heavy riffs and iconic anthems featuring legendary rock headline acts live on stage.",
    venue: "Wembley Arena",
    location: "London, UK",
    eventDate: "2026-06-01T18:30:00",
    price: 320,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800",
    totalTickets: 1500,
    availableTickets: 620,
    category: "Rock"
  },
  {
    id: 10,
    title: "Broadway Musical Gala",
    description: "Spectacular musical theatre night with award-winning singers, dancers, and stage visuals.",
    venue: "Majestic Theatre",
    location: "New York, USA",
    eventDate: "2026-06-15T20:00:00",
    price: 550,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800",
    totalTickets: 500,
    availableTickets: 210,
    category: "Theatre"
  },
  {
    id: 11,
    title: "Tokyo Anime & Gaming Con",
    description: "The ultimate paradise for cosplayers, anime creators, voice actors, and gaming enthusiasts.",
    venue: "Big Sight Convention Center",
    location: "Tokyo, Japan",
    eventDate: "2026-07-04T10:00:00",
    price: 280,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800",
    totalTickets: 2000,
    availableTickets: 1450,
    category: "Convention"
  },
  {
    id: 12,
    title: "Sunset Beach Jazz Night",
    description: "Smooth sax melodies, ocean breeze, and tropical cocktails under sunset skies.",
    venue: "Kuta Beach Amphitheatre",
    location: "Bali, Indonesia",
    eventDate: "2026-07-20T17:00:00",
    price: 220,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800",
    totalTickets: 400,
    availableTickets: 180,
    category: "Jazz"
  },
  {
    id: 13,
    title: "International Comedy Championship",
    description: "Non-stop laughter with world-famous stand-up comedians competing live on stage.",
    venue: "The Comedy Store",
    location: "Los Angeles, USA",
    eventDate: "2026-08-05T20:00:00",
    price: 260,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=800",
    totalTickets: 500,
    availableTickets: 310,
    category: "Comedy"
  },
  {
    id: 14,
    title: "Global Indie Film Festival",
    description: "Exclusive premiere screenings, director Q&As, and red carpet indie cinema showcases.",
    venue: "TIFF Bell Lightbox",
    location: "Toronto, Canada",
    eventDate: "2026-08-22T16:00:00",
    price: 380,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
    totalTickets: 450,
    availableTickets: 190,
    category: "Cinema"
  },
  {
    id: 15,
    title: "Grand Chess Masters Invitational",
    description: "Watch international grandmasters clash in high-stakes rapid and blitz chess battles.",
    venue: "Harpa Concert Hall",
    location: "Reykjavik, Iceland",
    eventDate: "2026-09-10T13:00:00",
    price: 180,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=800",
    totalTickets: 300,
    availableTickets: 95,
    category: "Gaming"
  },
  {
    id: 16,
    title: "Carnival De Rio Night",
    description: "Vibrant samba dancers, fiery parade floats, and authentic Brazilian beats.",
    venue: "Sambadrome Marquês",
    location: "Rio de Janeiro, Brazil",
    eventDate: "2026-09-28T21:30:00",
    price: 420,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800",
    totalTickets: 1500,
    availableTickets: 840,
    category: "Festival"
  },
  {
    id: 17,
    title: "FIFA World Stadium Championship Super Match",
    description: "Witness live football stadium action with top international teams battling in a packed arena.",
    venue: "Santiago Bernabeu Stadium",
    location: "Madrid, Spain",
    eventDate: "2026-10-10T18:00:00",
    price: 500,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800",
    totalTickets: 1500,
    availableTickets: 920,
    category: "Football & Stadium"
  },
  {
    id: 18,
    title: "Royal Horse Riding & Polo Derby",
    description: "Premier outdoor equestrian show jumping, royal polo tournament, and horse riding exhibition.",
    venue: "Windsor Outdoor Polo Club",
    location: "London, UK",
    eventDate: "2026-10-25T14:00:00",
    price: 450,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800",
    totalTickets: 600,
    availableTickets: 340,
    category: "Horse Riding"
  },
  {
    id: 19,
    title: "Outdoor Extreme Kayaking & Rapids Fest",
    description: "Adrenaline-pumping river kayaking, outdoor water sports, and mountain wilderness adventure.",
    venue: "Zambezi River Rapids",
    location: "Victoria Falls, Africa",
    eventDate: "2026-11-05T09:00:00",
    price: 350,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800",
    totalTickets: 400,
    availableTickets: 210,
    category: "Outdoor Sports"
  },
  {
    id: 20,
    title: "Grand Slam Tennis Masters Finals",
    description: "Live stadium court action featuring world number one tennis champions in a heated final match.",
    venue: "Arthur Ashe Stadium",
    location: "New York, USA",
    eventDate: "2026-11-18T15:30:00",
    price: 400,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=800",
    totalTickets: 800,
    availableTickets: 490,
    category: "Football & Stadium"
  },
  {
    id: 21,
    title: "Outdoor Desert Dune Safari & Quad Games",
    description: "Thrilling desert sandboarding, quad bike races, and traditional campfire under open skies.",
    venue: "Al Lahbab Red Dunes",
    location: "Dubai, UAE",
    eventDate: "2026-12-01T16:00:00",
    price: 300,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800",
    totalTickets: 500,
    availableTickets: 380,
    category: "Outdoor Sports"
  },
  {
    id: 22,
    title: "Red Bull Outdoor Formula Circuit Racing",
    description: "High-octane outdoor motorsport racing with roaring engines, tight turns, and podium glory.",
    venue: "Silverstone Circuit",
    location: "Towcester, UK",
    eventDate: "2026-12-15T13:00:00",
    price: 550,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800",
    totalTickets: 1000,
    availableTickets: 670,
    category: "Outdoor Sports"
  }
];

// A second listing for each originally single-event category keeps the filter
// useful in the lightweight Node launch option as well.
events.push(
  { id: 23, title: 'Dhaka Heritage Gala Evening', description: 'A formal cultural celebration with dinner, music, and awards.', venue: 'Pan Pacific Ballroom', location: 'Dhaka, Bangladesh', eventDate: '2026-10-02T19:00:00', price: 380, currency: 'BDT', totalTickets: 500, availableTickets: 360, category: 'Gala' },
  { id: 24, title: 'Dhaka City Live Concert', description: 'A high-energy live music night with local and international artists.', venue: 'Army Stadium', location: 'Dhaka, Bangladesh', eventDate: '2026-10-04T18:30:00', price: 420, currency: 'BDT', totalTickets: 1200, availableTickets: 900, category: 'Concert' },
  { id: 25, title: 'Pulse EDM Riverside', description: 'Open-air electronic music, visual installations, and DJ performances.', venue: 'Hatirjheel Amphitheatre', location: 'Dhaka, Bangladesh', eventDate: '2026-10-08T20:00:00', price: 350, currency: 'BDT', totalTickets: 900, availableTickets: 720, category: 'EDM' },
  { id: 26, title: 'Bangladesh Esports League Finals', description: 'Watch the country’s best competitive gaming teams battle live.', venue: 'Bashundhara Convention Centre', location: 'Dhaka, Bangladesh', eventDate: '2026-10-12T12:00:00', price: 250, currency: 'BDT', totalTickets: 1500, availableTickets: 1100, category: 'Esports' },
  { id: 27, title: 'Moonlight Classical Orchestra', description: 'An elegant evening of classical compositions performed by a full orchestra.', venue: 'Bangladesh Shilpakala Academy', location: 'Dhaka, Bangladesh', eventDate: '2026-10-16T19:30:00', price: 320, currency: 'BDT', totalTickets: 650, availableTickets: 470, category: 'Classical' },
  { id: 28, title: 'Bangladesh Fashion Week', description: 'Runway presentations from emerging designers and established labels.', venue: 'International Convention City', location: 'Dhaka, Bangladesh', eventDate: '2026-10-20T17:00:00', price: 480, currency: 'BDT', totalTickets: 700, availableTickets: 530, category: 'Fashion' },
  { id: 29, title: 'Future Creators Convention', description: 'Meet creators, publishers, artists, and technology communities.', venue: 'Bangabandhu International Conference Center', location: 'Dhaka, Bangladesh', eventDate: '2026-10-23T10:00:00', price: 200, currency: 'BDT', totalTickets: 1000, availableTickets: 780, category: 'Convention' },
  { id: 30, title: 'Riverfront Jazz Sessions', description: 'A relaxed riverside night of jazz ensembles and soul singers.', venue: 'Hatirjheel Lakefront', location: 'Dhaka, Bangladesh', eventDate: '2026-10-27T18:00:00', price: 280, currency: 'BDT', totalTickets: 550, availableTickets: 390, category: 'Jazz' },
  { id: 31, title: 'Stadium Rock Legends', description: 'Guitar-driven anthems and a live rock festival experience.', venue: 'National Stadium', location: 'Dhaka, Bangladesh', eventDate: '2026-11-01T18:30:00', price: 450, currency: 'BDT', totalTickets: 1300, availableTickets: 940, category: 'Rock' },
  { id: 32, title: 'Bengal Theatre Premiere', description: 'A contemporary theatre production by leading stage performers.', venue: 'Experimental Theatre Hall', location: 'Dhaka, Bangladesh', eventDate: '2026-11-04T19:00:00', price: 300, currency: 'BDT', totalTickets: 450, availableTickets: 280, category: 'Theatre' },
  { id: 33, title: 'Board Game Masters Meetup', description: 'Tournament play, strategy tables, and casual board game sessions.', venue: 'Dhaka Club', location: 'Dhaka, Bangladesh', eventDate: '2026-11-08T11:00:00', price: 150, currency: 'BDT', totalTickets: 400, availableTickets: 310, category: 'Gaming' },
  { id: 34, title: 'Dhaka International Film Showcase', description: 'Independent films, filmmaker Q and A sessions, and premieres.', venue: 'Star Cineplex', location: 'Dhaka, Bangladesh', eventDate: '2026-11-12T16:00:00', price: 260, currency: 'BDT', totalTickets: 600, availableTickets: 410, category: 'Cinema' },
  { id: 35, title: 'Valorant World Championship Finals 2026', description: 'Watch top international esports teams clash live in high-stakes tactical FPS battles.', venue: 'Bashundhara Convention Centre', location: 'Dhaka, Bangladesh', eventDate: '2026-11-15T14:00:00', price: 350, currency: 'BDT', imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800', totalTickets: 2000, availableTickets: 1420, category: 'Gaming' },
  { id: 36, title: 'PUBG Mobile Global Invitational Dhaka', description: 'Adrenaline-fueled battle royale showdown with 16 elite squads fighting for the championship trophy.', venue: 'Army Stadium Arena', location: 'Dhaka, Bangladesh', eventDate: '2026-11-20T15:30:00', price: 300, currency: 'BDT', imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800', totalTickets: 2500, availableTickets: 1890, category: 'Gaming' },
  { id: 37, title: 'League of Legends Worlds Arena 2026', description: 'The premier MOBA tournament featuring live orchestration, holo-stage visuals, and world-class pro teams.', venue: 'Bangabandhu International Conference Center', location: 'Dhaka, Bangladesh', eventDate: '2026-11-28T16:00:00', price: 400, currency: 'BDT', imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800', totalTickets: 1800, availableTickets: 1250, category: 'Gaming' },
  { id: 38, title: 'Dota 2 International Major Dhaka', description: 'Multi-million dollar Aegis cup tournament with legendary drafting, teamfights, and caster commentary.', venue: 'Hatirjheel Amphitheatre', location: 'Dhaka, Bangladesh', eventDate: '2026-12-05T13:00:00', price: 450, currency: 'BDT', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800', totalTickets: 1500, availableTickets: 980, category: 'Gaming' },
  { id: 39, title: 'Counter-Strike 2 Major Championship', description: 'High-octane tactical shooter major with clutch defuses, sniper showdowns, and live audience roar.', venue: 'Pan Pacific Ballroom', location: 'Dhaka, Bangladesh', eventDate: '2026-12-12T17:00:00', price: 380, currency: 'BDT', imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800', totalTickets: 1600, availableTickets: 1100, category: 'Gaming' },
  { id: 40, title: 'EA FC 26 FIFA Esports Masters', description: 'Compete or watch live digital football stadium finals with commentary and pro gaming booths.', venue: 'Dhaka Club Arena', location: 'Dhaka, Bangladesh', eventDate: '2026-12-18T12:00:00', price: 250, currency: 'BDT', imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800', totalTickets: 1200, availableTickets: 850, category: 'Gaming' },
  { id: 41, title: 'Tekken 8 World Tour Dhaka Finals', description: 'Fierce 1v1 fighting game tournament with electric combos, arcade sticks, and international grandmasters.', venue: 'International Convention City', location: 'Dhaka, Bangladesh', eventDate: '2026-12-24T14:00:00', price: 280, currency: 'BDT', imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=800', totalTickets: 1000, availableTickets: 740, category: 'Gaming' },
  { id: 42, title: 'Mobile Legends M6 Global Cup', description: 'Mobile gaming spectacle with intense 5v5 laning battles and live cosplay showcases.', venue: 'National Stadium', location: 'Dhaka, Bangladesh', eventDate: '2026-12-30T16:00:00', price: 220, currency: 'BDT', imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800', totalTickets: 3000, availableTickets: 2200, category: 'Gaming' }
);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // GET /api/events
  if (req.url === '/api/events' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(events));
  }

  // GET /api/events/:id
  if (req.url.startsWith('/api/events/') && req.method === 'GET') {
    const id = parseInt(req.url.split('/')[3]);
    const evt = events.find(e => e.id === id);
    if (!evt) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Event not found' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(evt));
  }

  // POST /api/events/create (Seller Only)
  if (req.url === '/api/events/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      const user = users.find(u => u.id === parseInt(data.organizerUserId));

      if (!user || !user.isSubscribed) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          message: 'Only Subscribed Pro Organizers can list and sell tickets on AURA. Please subscribe to unlock seller features.'
        }));
      }

      const newEvt = {
        id: events.length + 1,
        title: data.title,
        description: data.description || '',
        venue: data.venue,
        location: data.location,
        eventDate: data.eventDate || new Date().toISOString(),
        price: parseFloat(data.price) || 300,
        currency: data.currency || 'BDT',
        imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800',
        totalTickets: parseInt(data.totalTickets) || 500,
        availableTickets: parseInt(data.totalTickets) || 500,
        category: data.category || 'Concert',
        organizerUserId: user.id
      };

      events.push(newEvt);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Event published successfully!', evt: newEvt }));
    });
    return;
  }

  // POST /api/auth/register
  if (req.url === '/api/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      const user = {
        id: users.length + 1,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        isSubscribed: false
      };
      users.push(user);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Registration successful!', user }));
    });
    return;
  }

  // POST /api/auth/login
  if (req.url === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      let user = users.find(u => u.email.toLowerCase() === (data.email || '').toLowerCase());
      if (!user) {
        user = { id: 1, fullName: 'Demo User', email: data.email, isSubscribed: false };
        users.push(user);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Login successful!', user }));
    });
    return;
  }

  // POST /api/subscriptions/subscribe
  if (req.url === '/api/subscriptions/subscribe' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      let user = users.find(u => u.id === parseInt(data.userId));
      if (!user) {
        user = { id: data.userId || 1, fullName: 'Pro Seller', email: 'seller@aura.com', isSubscribed: true };
        users.push(user);
      } else {
        user.isSubscribed = true;
      }

      const txId = 'SUB-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const sub = {
        id: subscriptions.length + 1,
        userId: user.id,
        planName: data.planName || 'Pro Organizer',
        amount: 999,
        paymentMethod: data.paymentMethod || 'bKash',
        transactionId: txId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      subscriptions.push(sub);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Congratulations! Your Pro Organizer subscription is now active.',
        subscription: sub,
        user
      }));
    });
    return;
  }

  // GET /api/subscriptions/status/:userId
  if (req.url.startsWith('/api/subscriptions/status/') && req.method === 'GET') {
    const userId = parseInt(req.url.split('/')[4]);
    const user = users.find(u => u.id === userId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      userId,
      isSubscribed: user ? user.isSubscribed : false,
      canSell: user ? user.isSubscribed : false
    }));
  }

  // GET /api/subscriptions/all
  if (req.url === '/api/subscriptions/all' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(subscriptions.length ? subscriptions : [
      { id: 1, userId: 1, userName: "Maliha", userEmail: "maliha@aura.com", userPhone: "+880 1700-000000", planName: "Pro Organizer Pass", paymentMethod: "FREE", transactionId: "SUB-8890PRO", createdAt: new Date().toISOString() },
      { id: 2, userId: 2, userName: "Tariq Ahmed", userEmail: "tariq@aura.com", userPhone: "+880 1800-111222", planName: "Pro Organizer Pass", paymentMethod: "bKash", transactionId: "SUB-4521BKASH", createdAt: new Date(Date.now() - 86400000 * 3).toISOString() }
    ]));
  }

  // GET /api/bookings/all
  if (req.url === '/api/bookings/all' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(bookings));
  }

  // GET /api/bookings/user/:userId
  if (req.url.startsWith('/api/bookings/user/') && req.method === 'GET') {
    const userId = parseInt(req.url.split('/')[4]);
    const userBookings = bookings.filter(b => b.userId === userId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(userBookings));
  }
// GET /api/events
if (req.url === '/api/events' && req.method === 'GET') {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify(events));
}
  // POST /api/bookings
  if (req.url === '/api/bookings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      const evt = events.find(e => e.id === data.eventId);

      if (evt && evt.availableTickets < (data.quantity || 1)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'This ticket is SOLD OUT! No more tickets available.' }));
      }

      if (evt) {
        evt.availableTickets -= (data.quantity || 1);
      }

      let payMethod = data.paymentMethod || 'bKash';
      if (data.paymentSubMethod) {
        payMethod = `${data.paymentMethod} (${data.paymentSubMethod})`;
      } else if (data.paymentMethod === 'Card' && data.cardType) {
        payMethod = `Card (${data.cardType})`;
      }

      const txPrefix = (data.paymentMethod === 'bKash' ? 'BKASH-' : data.paymentMethod === 'Nagad' ? 'NAGAD-' : data.paymentMethod === 'Card' ? 'CARD-' : 'TXN-');
      const bookingCode = 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const txId = txPrefix + Math.random().toString(36).substring(2, 10).toUpperCase();
      const seatNumber = data.seatNumber || ('A-' + (Math.floor(Math.random() * 40) + 1));
      const booking = {
        id: bookings.length + 1,
        userId: data.userId || 1,
        eventId: data.eventId,
        bookingCode,
        seatNumber,
        quantity: data.quantity || 1,
        totalAmount: (evt ? evt.price : 300) * (data.quantity || 1),
        paymentMethod: payMethod,
        transactionId: txId,
        bookingDate: new Date().toISOString(),
        status: 'Confirmed',
        eventTitle: evt ? evt.title : 'Event',
        eventVenue: evt ? evt.venue : '',
        eventDate: evt ? evt.eventDate : ''
      };
      bookings.push(booking);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Booking confirmed successfully!', booking }));
    });
    return;
  }

  // POST /api/scanner/verify - Lookup and verify ticket pass
  if (req.url.startsWith('/api/scanner/verify') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body || '{}'); } catch(e) {}
      const searchCode = (data.code || data.bookingCode || '').trim().toUpperCase();
      
      const booking = bookings.find(b => 
        (b.bookingCode && b.bookingCode.toUpperCase() === searchCode) ||
        (b.transactionId && b.transactionId.toUpperCase() === searchCode) ||
        (String(b.id) === searchCode)
      );

      if (!booking) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ 
          valid: false, 
          status: 'NOT_FOUND', 
          message: `No ticket record found matching "${searchCode}". Check code or retry scanning.` 
        }));
      }

      const isUsed = booking.status === 'Checked In';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        valid: !isUsed,
        status: isUsed ? 'USED' : 'VALID',
        message: isUsed ? 'Ticket has already been checked-in!' : 'Ticket is Valid and Ready for Gate Entry!',
        booking
      }));
    });
    return;
  }

  // POST /api/scanner/checkin - Mark ticket as checked-in
  if (req.url.startsWith('/api/scanner/checkin') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body || '{}'); } catch(e) {}
      const searchCode = (data.bookingCode || data.code || '').trim().toUpperCase();

      const booking = bookings.find(b => 
        (b.bookingCode && b.bookingCode.toUpperCase() === searchCode) ||
        (String(b.id) === searchCode)
      );

      if (!booking) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Ticket code invalid or not found.' }));
      }

      if (booking.status === 'Checked In') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ 
          success: false, 
          status: 'ALREADY_USED',
          message: `Ticket ${booking.bookingCode} was ALREADY checked in at ${new Date(booking.checkInTime || Date.now()).toLocaleTimeString()}`, 
          booking 
        }));
      }

      // Mark status as checked-in
      booking.status = 'Checked In';
      booking.checkInTime = new Date().toISOString();

      const logEntry = {
        id: scannerLogs.length + 1,
        bookingCode: booking.bookingCode,
        eventTitle: booking.eventTitle,
        userName: booking.userName || 'Attendee',
        timestamp: booking.checkInTime,
        gate: data.gate || 'Main Entrance Gate 1',
        validator: data.validator || 'Gate Staff'
      };
      scannerLogs.unshift(logEntry);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: `🎉 TICKET VALIDATED! Welcome ${booking.userName || 'Attendee'} to ${booking.eventTitle}`,
        booking,
        logEntry
      }));
    });
    return;
  }

  // GET /api/scanner/logs - Retrieve scanner history & metrics
  if (req.url.startsWith('/api/scanner/logs') && req.method === 'GET') {
    const totalBookings = bookings.length;
    const checkedInCount = bookings.filter(b => b.status === 'Checked In').length;
    const validRemainingCount = totalBookings - checkedInCount;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      metrics: {
        totalTickets: totalBookings,
        checkedInCount,
        validRemainingCount,
        scannedToday: scannerLogs.length
      },
      logs: scannerLogs
    }));
  }

  // GET /api/reviews
  if (req.url === '/api/reviews' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(reviews));
  }

  // POST /api/reviews
  if (req.url === '/api/reviews' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      const newRev = {
        id: reviews.length + 1,
        userId: data.userId || null,
        userName: data.userName || 'AURA Guest',
        content: data.content || '',
        rating: Math.max(1, Math.min(5, parseInt(data.rating) || 5)),
        createdAt: new Date().toISOString()
      };
      reviews.unshift(newRev);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newRev));
    });
    return;
  }

  // GET /api/databaseadmin/tables
  if (req.url === '/api/databaseadmin/tables' && req.method === 'GET') {
    const tableSummary = [
      { tableName: 'Users', rowCount: users.length || 1 },
      { tableName: 'Events', rowCount: events.length },
      { tableName: 'Bookings', rowCount: bookings.length },
      { tableName: 'Subscriptions', rowCount: subscriptions.length },
      { tableName: 'Reviews', rowCount: reviews.length }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(tableSummary));
  }

  // GET /api/databaseadmin/table/:tableName
  if (req.url.startsWith('/api/databaseadmin/table/') && req.method === 'GET') {
    const tName = req.url.split('/')[4];
    let rows = [];
    if (tName === 'Users') rows = users.length ? users : [{ id: 1, fullName: 'Maliha', email: 'maliha@aura.com', phone: '01700000000', isSubscribed: true }];
    else if (tName === 'Events') rows = events;
    else if (tName === 'Bookings') rows = bookings;
    else if (tName === 'Subscriptions') rows = subscriptions;
    else if (tName === 'Reviews') rows = reviews;

    const columns = rows.length > 0 ? Object.keys(rows[0]) : ['id'];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ tableName: tName, columns, rows, rowCount: rows.length }));
  }

  // Catch-all for API endpoints to prevent returning index.html for unmatched API paths
  if (req.url.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'API endpoint not found' }));
  }

  // Static File Serving
  let filePath = path.join(PUBLIC, req.url === '/' ? 'index.html' : req.url);
  let extname = path.extname(filePath);
  let contentType = 'text/html';

  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpeg'; break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(PUBLIC, 'index.html'), (err, content) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`AURA Server running at ${url}`);
  require('child_process').exec(`start ${url}`);
});
