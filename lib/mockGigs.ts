export interface MockGig {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  durationHours: number;
  maxGroupSize: number;
  priceUSD: number;
  guide_price: number;
  client_price: number;
  platform_fee: number;
  ranking_score?: number;
  featured_until?: Date | string | null;
  booking_count?: number;
  avgRating: number;
  reviewCount: number;
  images: string[];
  tags: string[];
  languages: string[];
  included: string[];
  excluded: string[];
  benefits?: string[];
  meetingPoint?: string;
  meetingPointPhoto?: string;
  availableDays?: string[];
  availableTimes?: string[];
  packages?: any[];
  isActive: boolean;
  guideId: string;
  guide: {
    id: string;
    name: string;
    avatar: string | null;
    country: string | null;
    bio?: string;
    language?: string[];
    walletAddress?: string;
  };
  reviews?: any[];
  createdAt: string;
}

export const FALLBACK_GIGS: MockGig[] = [
  {
    id: "gig-ubud-1",
    title: "Historic Ubud Palace Walking Tour & Cultural Heritage",
    description: "Explore the ancient royal palace courtyards, traditional Balinese architecture, and hidden scenic spots with your local certified guide.",
    category: "Cultural Tour",
    location: "Ubud Royal Palace, Ubud, Bali",
    country: "Indonesia",
    lat: -8.5069,
    lng: 115.2625,
    durationHours: 3,
    maxGroupSize: 6,
    priceUSD: 45,
    guide_price: 40.5,
    client_price: 45,
    platform_fee: 4.5,
    ranking_score: 95,
    booking_count: 12,
    avgRating: 5,
    reviewCount: 0,
    images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80"],
    tags: ["Culture", "History", "Balinese Heritage"],
    languages: ["English", "Indonesian"],
    included: ["Certified Local Guide", "Entry Ticket to Courtyard", "Bottled Water"],
    excluded: ["Personal Expenses", "Gratuities"],
    benefits: ["Instant Booking", "Verified Escrow", "Full Refund if Canceled 24h Prior"],
    meetingPoint: "Main Gate Courtyard, Ubud Royal Palace, Jl. Raya Ubud No.8",
    meetingPointPhoto: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    availableTimes: ["08:00 AM", "10:00 AM", "01:00 PM", "04:00 PM"],
    packages: [
      {
        id: "pkg-1",
        name: "Standard Walking Tour",
        priceUSD: 45,
        guide_price: 40.5,
        client_price: 45,
        platform_fee: 4.5,
        description: "Standard 3-hour walking tour covering royal courtyards and heritage spots.",
        includes: ["Certified Guide", "Courtyard Ticket"]
      }
    ],
    isActive: true,
    guideId: "guide-alex-1",
    guide: {
      id: "guide-alex-1",
      name: "Alex Tour Guide",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      country: "Indonesia",
      bio: "Certified local tour guide with 8+ years experience in Bali cultural heritage.",
      language: ["English", "Indonesian"],
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    },
    reviews: [],
    createdAt: new Date("2026-10-01").toISOString(),
  },
  {
    id: "gig-iwate-1",
    title: "Iwate City Tour",
    description: "Experience the picturesque gorges, peaceful countryside, and vibrant nightlife culture of Iwate prefecture with a certified guide.",
    category: "Nightlife",
    location: "Iwate",
    country: "Japan",
    lat: 39.7036,
    lng: 141.1527,
    durationHours: 4,
    maxGroupSize: 8,
    priceUSD: 1.10,
    guide_price: 1.00,
    client_price: 1.10,
    platform_fee: 0.10,
    ranking_score: 90,
    booking_count: 8,
    avgRating: 5,
    reviewCount: 2,
    images: ["https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80"],
    tags: ["Nightlife", "Nature", "Scenic"],
    languages: ["Japanese", "English"],
    included: ["Local guide", "Walking tour"],
    excluded: ["Meals", "Drinks"],
    benefits: ["Small Group", "Instant Escrow Confirmation"],
    meetingPoint: "Morioka Station East Exit Clock Tower",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    availableTimes: ["01:00 PM", "04:00 PM", "07:00 PM"],
    packages: [
      {
        id: "pkg-iwate-1",
        name: "Standard Evening Tour",
        priceUSD: 1.10,
        guide_price: 1.00,
        client_price: 1.10,
        platform_fee: 0.10,
        description: "Scenic walk through picturesque gorge views followed by local night spots.",
        includes: ["Certified Guide"]
      }
    ],
    isActive: true,
    guideId: "guide-gracia-1",
    guide: {
      id: "guide-gracia-1",
      name: "Gracia Angelina",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      country: "Japan",
      bio: "Passionate explorer and licensed local guide in Northern Honshu.",
      language: ["Japanese", "English"],
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    },
    reviews: [
      {
        id: "rev-1",
        rating: 5,
        comment: "Amazing scenic views and great night recommendations!",
        createdAt: new Date("2026-10-15").toISOString(),
        reviewer: { id: "u-1", name: "David M.", avatar: null, role: "TOURIST" },
        guide: { id: "guide-gracia-1", name: "Gracia Angelina", avatar: null }
      }
    ],
    createdAt: new Date("2026-10-05").toISOString(),
  },
  {
    id: "gig-tokyo-1",
    title: "Tokyo Trip",
    description: "Navigate the electric alleys of Shinjuku and Shibuya, discover hidden izakayas, and absorb the pulsating futuristic atmosphere of Tokyo.",
    category: "City",
    location: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lng: 139.6503,
    durationHours: 4,
    maxGroupSize: 8,
    priceUSD: 1.10,
    guide_price: 1.00,
    client_price: 1.10,
    platform_fee: 0.10,
    ranking_score: 92,
    booking_count: 15,
    avgRating: 5,
    reviewCount: 2,
    images: ["https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80"],
    tags: ["City", "Urban Exploration", "Street Food"],
    languages: ["Japanese", "English"],
    included: ["Local certified guide", "Hidden spots walking itinerary"],
    excluded: ["Train fare", "Personal food & shopping"],
    benefits: ["Small Group Size", "100% Escrow Protected"],
    meetingPoint: "Shinjuku Station East Exit (Near Studio Alta)",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    availableTimes: ["10:00 AM", "02:00 PM", "06:00 PM"],
    packages: [
      {
        id: "pkg-tokyo-1",
        name: "Standard City Tour",
        priceUSD: 1.10,
        guide_price: 1.00,
        client_price: 1.10,
        platform_fee: 0.10,
        description: "Immersive Tokyo street and alley walking tour.",
        includes: ["Certified Guide"]
      }
    ],
    isActive: true,
    guideId: "guide-gracia-1",
    guide: {
      id: "guide-gracia-1",
      name: "Gracia Angelina",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      country: "Japan",
      bio: "Passionate explorer and licensed local guide in Northern Honshu.",
      language: ["Japanese", "English"],
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    },
    reviews: [
      {
        id: "rev-2",
        rating: 5,
        comment: "Tokyo came alive with Gracia! Showed us parts of Shinjuku we never would have found ourselves.",
        createdAt: new Date("2026-10-20").toISOString(),
        reviewer: { id: "u-2", name: "Jessica T.", avatar: null, role: "TOURIST" },
        guide: { id: "guide-gracia-1", name: "Gracia Angelina", avatar: null }
      }
    ],
    createdAt: new Date("2026-10-10").toISOString(),
  },
];
