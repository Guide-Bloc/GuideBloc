require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding test dummy data for Meeting Point...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // 1. Create or update Test Tourist
  const tourist = await prisma.user.upsert({
    where: { email: "tourist.test@guidebloc.com" },
    update: {
      password: passwordHash,
      role: "TOURIST",
      name: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
    },
    create: {
      email: "tourist.test@guidebloc.com",
      password: passwordHash,
      name: "Sarah Jenkins",
      role: "TOURIST",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
    }
  });
  console.log("Tourist ready:", tourist.email);

  // 2. Create or update Test Guide
  const guide = await prisma.user.upsert({
    where: { email: "guide.test@guidebloc.com" },
    update: {
      password: passwordHash,
      role: "GUIDE",
      guideStatus: "APPROVED",
      name: "Alex Tour Guide",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    create: {
      email: "guide.test@guidebloc.com",
      password: passwordHash,
      name: "Alex Tour Guide",
      role: "GUIDE",
      guideStatus: "APPROVED",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    }
  });
  console.log("Guide ready:", guide.email);

  // 3. Create or update Gig
  let gig = await prisma.gig.findFirst({
    where: { guideId: guide.id, title: "Historic Ubud Palace Walking Tour & Cultural Heritage" }
  });

  if (!gig) {
    gig = await prisma.gig.create({
      data: {
        title: "Historic Ubud Palace Walking Tour & Cultural Heritage",
        description: "Explore the ancient royal palace courtyards, traditional Balinese architecture, and hidden scenic spots with your local certified guide.",
        category: "Cultural Tour",
        location: "Ubud Royal Palace, Ubud, Bali",
        country: "Indonesia",
        lat: -8.5069,
        lng: 115.2625,
        meetingPoint: "Main Gate Courtyard, Ubud Royal Palace, Jl. Raya Ubud No.8",
        meetingPointPhoto: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80",
        images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80"],
        durationHours: 3,
        maxGroupSize: 6,
        priceUSD: 45,
        guide_price: 40.5,
        client_price: 45,
        platform_fee: 4.5,
        guideId: guide.id,
        isActive: true
      }
    });
  } else {
    gig = await prisma.gig.update({
      where: { id: gig.id },
      data: {
        lat: -8.5069,
        lng: 115.2625,
        meetingPoint: "Main Gate Courtyard, Ubud Royal Palace, Jl. Raya Ubud No.8",
        meetingPointPhoto: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80",
        images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80"]
      }
    });
  }
  console.log("Gig ready:", gig.id);

  // 4. Create or update an Active Booking (CONFIRMED)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  let booking = await prisma.booking.findFirst({
    where: {
      gigId: gig.id,
      touristId: tourist.id,
      status: "CONFIRMED"
    }
  });

  if (!booking) {
    booking = await prisma.booking.create({
      data: {
        gigId: gig.id,
        touristId: tourist.id,
        bookingDate: tomorrow,
        bookingTime: "10:00 AM",
        groupSize: 2,
        totalPriceUSD: 90,
        totalPriceCrypto: 90,
        client_price: 45,
        guide_price: 40.5,
        platform_fee: 4.5,
        cryptoToken: "USDC",
        paymentNetwork: "Avalanche C-Chain",
        status: "CONFIRMED",
        txHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      }
    });
  } else {
    booking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        bookingDate: tomorrow,
        bookingTime: "10:00 AM"
      }
    });
  }
  console.log("Booking ready with ID:", booking.id);

  // 5. Ensure MeetSession exists
  await prisma.meetSession.upsert({
    where: { bookingId: booking.id },
    update: {
      status: "NOT_STARTED",
      touristLat: null,
      touristLng: null,
      guideLat: null,
      guideLng: null
    },
    create: {
      bookingId: booking.id,
      status: "NOT_STARTED"
    }
  });

  console.log("\n==============================================");
  console.log("DUMMY DATA CREATED SUCCESSFULLY!");
  console.log("==============================================");
  console.log("Tourist Credentials:");
  console.log("  Email:    tourist.test@guidebloc.com");
  console.log("  Password: password123");
  console.log("  URL:      http://localhost:3000/dashboard/tourist/bookings");
  console.log("----------------------------------------------");
  console.log("Guide Credentials:");
  console.log("  Email:    guide.test@guidebloc.com");
  console.log("  Password: password123");
  console.log("  URL:      http://localhost:3000/dashboard/guide/bookings");
  console.log("----------------------------------------------");
  console.log("Direct Meeting Point URL:");
  console.log(`  http://localhost:3000/dashboard/meeting-point/${booking.id}`);
  console.log("==============================================\n");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
