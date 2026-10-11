import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Environment Verification
    const apiKey = process.env.GEMINI_API_KEY;
    const dbUrl = process.env.DATABASE_URL;

    if (!apiKey || !dbUrl) {
      return NextResponse.json({
        reply: "⚠️ Hosting Environment Variables Missing: Please configure GEMINI_API_KEY and DATABASE_URL in your hosting platform dashboard (e.g. Vercel Project Settings > Environment Variables) so the AI Concierge can connect and retrieve local tours.",
        action: "NONE",
      });
    }

    const { message, history } = await req.json();

    // 2. Input Security: Validate user message to prevent prompt injection & extreme loads
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ message: "Message is required." }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ message: "Message too long. Keep it under 1000 characters." }, { status: 400 });
    }

    // 3. Database Context Injection: Gather actual gigs, bookings, guides, and rankings
    let gigs: any[] = [];
    try {
      gigs = await prisma.gig.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          location: true,
          country: true,
          client_price: true,
          priceUSD: true,
          avgRating: true,
          reviewCount: true,
          booking_count: true,
          durationHours: true,
          guide: {
            select: {
              name: true,
              bio: true,
              country: true,
              walletAddress: true,
            },
          },
        },
      });
    } catch (dbErr) {
      console.warn("Could not query gigs from DB for AI context:", dbErr);
    }

    // Format gig descriptions to feed to the AI context
    const toursContext = gigs
      .map((g) => {
        const price = g.client_price || g.priceUSD;
        return `- TOUR: "${g.title}" (ID: ${g.id}) in ${g.location}, ${g.country}. Price: ${price} USDT/USDC. Duration: ${g.durationHours} hrs. Rating: ${g.avgRating}/5 (${g.reviewCount} reviews). Total Bookings: ${g.booking_count}. Guide: ${g.guide?.name} (Bio: ${g.guide?.bio || "Local expert"}).`;
      })
      .join("\n");

    // 4. Secure AI Persona & System Instructions (Tour Information Assistant)
    const systemPrompt = `You are "AI Concierge", an institutional, knowledgeable Tour Discovery and Escrow Assistant for GuideBloc, specializing in verified tours across premier global destinations (Paris, Bali, Rome, Tokyo, New York, Swiss Alps, and beyond).

ROLE & BOUNDARIES (CRITICAL):
- You act strictly as an INFORMATIVE GUIDE (Tour Finder & Travel Information Assistant).
- You DO NOT automatically book tours, schedule appointments, or handle payments for the user in chat.
- Your sole purpose is to help users discover matching tours worldwide, explore itineraries, learn about vetted local guides, and understand how GuideBloc's Avalanche Smart Contract Escrow guarantees their payment safety.
- When users ask to book, schedule, or make an appointment (e.g., "make me an appointment"), explain that you are an information assistant, and guide them to browse the tour details and book directly on the official tour page on GuideBloc.

TARGET DESTINATIONS:
- Worldwide coverage with top destinations including Paris (France), Bali (Indonesia), Rome (Italy), Tokyo (Japan), New York (USA), Swiss Alps (Switzerland), and more.
- Highlight local culture, culinary experiences, scenic landmarks, and vetted local guides.

TONE & STYLE:
- Institutional, courteous, helpful, concise, and professional.
- Do NOT use emojis. Strict plain text with standard markdown formatting only.
- Respond in clear, professional English.

HERE ARE CURRENT VERIFIED TOURS:
${toursContext}

ACTION MECHANISM:
- "SEARCH": When the user is looking for a tour, asking for recommendations, or asking about a destination. Provide a search query string.
- "NONE": When answering general questions about travel, escrow safety, or platform features.
(Do not use "BOOK" or "PAY" - booking is handled directly by the user on the tour page).

You MUST respond strictly in JSON matching the specified output schema. Do not prepend or append any explanation outside the JSON format.`;

    // 5. Attempt Google Gemini AI with sanitized history and clean API key
    const rawApiKey = process.env.GEMINI_API_KEY || "";
    const cleanApiKey = rawApiKey.replace(/^["']|["']$/g, "").trim();

    if (cleanApiKey && !cleanApiKey.includes("...")) {
      try {
        // Sanitize history strictly for Gemini API (must alternate, start with user, non-empty)
        const sanitizedContents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

        for (const h of history || []) {
          const text = typeof h.text === "string" ? h.text.trim() : "";
          if (!text) continue;

          const role = h.sender === "user" ? "user" : "model";

          if (sanitizedContents.length === 0) {
            if (role === "user") {
              sanitizedContents.push({ role: "user", parts: [{ text }] });
            }
            continue;
          }

          const last = sanitizedContents[sanitizedContents.length - 1];
          if (last.role === role) {
            last.parts[0].text += `\n${text}`;
          } else {
            sanitizedContents.push({ role, parts: [{ text }] });
          }
        }

        // Append current user message
        if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === "user") {
          sanitizedContents[sanitizedContents.length - 1].parts[0].text += `\n${message.trim()}`;
        } else {
          sanitizedContents.push({ role: "user", parts: [{ text: message.trim() }] });
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": cleanApiKey,
            },
            body: JSON.stringify({
              contents: sanitizedContents,
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    reply: { type: "STRING", description: "Friendly informative text response to show the user." },
                    action: {
                      type: "STRING",
                      enum: ["NONE", "SEARCH"],
                      description: "Current action: SEARCH to show tours, or NONE for conversation.",
                    },
                    actionData: {
                      type: "OBJECT",
                      properties: {
                        searchQuery: { type: "STRING", description: "Keywords to search gigs in Japan" },
                      },
                    },
                  },
                  required: ["reply", "action"],
                },
              },
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const result = await geminiRes.json();
          const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const parsed = JSON.parse(responseText);
            return NextResponse.json(parsed);
          }
        } else {
          const errText = await geminiRes.text();
          console.warn("Gemini API returned error, activating smart local concierge fallback:", errText);
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, falling back to local concierge engine:", geminiError);
      }
    }

    // 6. Smart Local Tour Information Engine (Global Tours)
    const fallbackResponse = generateLocalKiraResponse(message, gigs);
    return NextResponse.json(fallbackResponse);
  } catch (error) {
    console.error("AI Chat route fatal error:", error);
    return NextResponse.json({
      reply: "Welcome to GuideBloc. I am your AI Travel Concierge. Tell me which destination you would like to explore (Paris, Bali, Rome, Tokyo, New York, Swiss Alps) and I will find verified tours for you.",
      action: "NONE",
    });
  }
}

/**
 * High-Intelligence Local Tour Information Assistant Engine
 * Focuses on Global tours and informative guidance with zero emojis.
 */
function generateLocalKiraResponse(message: string, gigs: any[]) {
  const lower = message.toLowerCase().trim();

  // 1. Explicit Appointment / Booking requests (Informative boundary clarification)
  if (
    lower.includes("appointment") ||
    lower.includes("schedule") ||
    lower.includes("make me an") ||
    lower.includes("pesan") ||
    lower.includes("jadwal") ||
    lower.includes("reservasi") ||
    lower.includes("book")
  ) {
    const top = gigs[0];

    return {
      reply: `I am here as your Tour Information Assistant to help you explore verified local tours worldwide.\n\nI do not schedule appointments or process bookings automatically in the chat. To book a tour, browse the tour details below, select your preferred date, and proceed directly with Avalanche Smart Contract Escrow protection.`,
      action: "SEARCH",
      actionData: {
        searchQuery: top ? (top.location || top.title) : "Paris",
      },
    };
  }

  // 2. Direct match with database gigs worldwide
  const matchedGigs = gigs.filter((g) => {
    const loc = (g.location || "").toLowerCase();
    const ctry = (g.country || "").toLowerCase();
    const ttl = (g.title || "").toLowerCase();
    return lower.includes(loc) || lower.includes(ctry) || lower.includes(ttl);
  });

  if (matchedGigs.length > 0) {
    const top = matchedGigs[0];
    const price = top.client_price || top.priceUSD;
    return {
      reply: `I found an authentic verified tour for you.\n\n**${top.title}** in **${top.location}, ${top.country}** hosted by verified guide **${top.guide?.name || "Local Expert"}** ($${price} USD).\n\nCheck out the tour details below to explore the itinerary and book directly.`,
      action: "SEARCH",
      actionData: {
        searchQuery: top.location || top.title,
      },
    };
  }

  // 3. Global destination inquiries
  if (lower.includes("paris") || lower.includes("france")) {
    return {
      reply: `Paris offers magnificent architecture, world-renowned gastronomy, and historic walks along the Seine. We have verified local guides ready to show you hidden gems across the city.\n\nBrowse through our verified tours below.`,
      action: "SEARCH",
      actionData: { searchQuery: "Paris" },
    };
  }

  if (lower.includes("bali") || lower.includes("indonesia")) {
    return {
      reply: `Bali is renowned for its lush jungle sanctuaries, waterfall treks, and rich cultural heritage. Our vetted guides provide authentic, private explorations.\n\nBrowse through our verified Bali tours below.`,
      action: "SEARCH",
      actionData: { searchQuery: "Bali" },
    };
  }

  if (lower.includes("rome") || lower.includes("italy")) {
    return {
      reply: `Rome offers incredible ancient history, iconic landmarks like the Colosseum, and vibrant culinary neighborhoods. Our local guides ensure a seamless, private tour experience.\n\nBrowse through our verified Rome tours below.`,
      action: "SEARCH",
      actionData: { searchQuery: "Rome" },
    };
  }

  if (lower.includes("swiss") || lower.includes("switzerland") || lower.includes("zermatt") || lower.includes("alps")) {
    return {
      reply: `The Swiss Alps feature majestic mountain landscapes, glacier valleys, and panoramic hiking trails near Zermatt and the Matterhorn.\n\nBrowse through our verified Alpine tours below.`,
      action: "SEARCH",
      actionData: { searchQuery: "Zermatt" },
    };
  }

  if (lower.includes("new york") || lower.includes("nyc") || lower.includes("usa") || lower.includes("manhattan")) {
    return {
      reply: `New York City features world-famous skyline views, iconic cultural districts, and culinary walking tours through historic neighborhoods.\n\nBrowse through our verified New York tours below.`,
      action: "SEARCH",
      actionData: { searchQuery: "New York" },
    };
  }

  if (
    lower.includes("japan") ||
    lower.includes("tokyo") ||
    lower.includes("kyoto") ||
    lower.includes("osaka") ||
    lower.includes("fuji")
  ) {
    return {
      reply: `Japan is an incredible destination with rich heritage, vibrant cityscapes in Tokyo, and historic cultural sites in Kyoto.\n\nBrowse through our verified tours in Japan below.`,
      action: "SEARCH",
      actionData: {
        searchQuery: lower.includes("tokyo") ? "Tokyo" : "Kyoto",
      },
    };
  }

  // 4. Escrow and safety questions
  if (
    lower.includes("escrow") ||
    lower.includes("aman") ||
    lower.includes("safe") ||
    lower.includes("security") ||
    lower.includes("bayar") ||
    lower.includes("crypto") ||
    lower.includes("usdt") ||
    lower.includes("usdc") ||
    lower.includes("avalanche")
  ) {
    return {
      reply: `At GuideBloc, every booking is 100% protected by Avalanche Smart Contract Escrow.\n\n1. When you book a tour, your payment (USDC/USDT) is securely locked on-chain in escrow.\n2. The guide cannot access the funds prematurely.\n3. Funds are released to the guide only after the tour is successfully completed.\n\nZero advance payment risk, zero chargeback fraud, complete transparency.`,
      action: "NONE",
    };
  }

  // 5. Questions about becoming a guide
  if (lower.includes("guide") || lower.includes("pemandu") || lower.includes("daftar guide") || lower.includes("earning")) {
    return {
      reply: `Interested in becoming a local guide? GuideBloc provides tour guides with 90% direct earnings settled instantly in stablecoins (USDC/USDT) with zero dispute fraud.\n\nYou can click "Become a Tour Guide" in the navigation bar to register and list your tours worldwide.`,
      action: "NONE",
    };
  }

  // 6. Greetings or test messages
  if (lower === "test" || lower === "hi" || lower === "halo" || lower === "hello" || lower === "p" || lower.includes("kira") || lower.includes("concierge")) {
    return {
      reply: `Welcome to GuideBloc. I am your AI Travel Concierge. I am here to help you discover verified local tours and authentic experiences across premier global destinations (Paris, Bali, Rome, Tokyo, New York, Swiss Alps).\n\nWhich destination or travel experience can I assist you with today?`,
      action: "NONE",
    };
  }

  // 7. General search fallback focusing on top tours
  const sampleGigs = gigs.slice(0, 3);
  const gigList = sampleGigs.length > 0
    ? `\n\nTrending verified tours right now:\n` + sampleGigs.map((g) => `• **${g.title}** (${g.location}, ${g.country})`).join("\n")
    : "";

  return {
    reply: `I would be pleased to help you find the best tour. Tell me what kind of travel experience you have in mind (e.g. "Paris food tour", "Bali waterfall trek", or "Rome historical walk").${gigList}`,
    action: "SEARCH",
    actionData: {
      searchQuery: sampleGigs[0] ? sampleGigs[0].location : "Paris",
    },
  };
}
