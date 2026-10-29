import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Search, Calendar, CreditCard, MapPin, Users, Wallet, Shield, CheckCircle } from "lucide-react";
import { GlobeIcon, Crosshair2Icon } from "@radix-ui/react-icons";
import { TourismSectionDecorations } from "@/components/ui/TourismOrnaments";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-dark-50 relative overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-32 overflow-hidden bg-dark-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200')] bg-cover bg-center opacity-25" />
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">How GuideBloc. Works</h1>
          <p className="text-xl text-dark-200">Discover, book, and pay for unique tours - powered by blockchain.</p>
        </div>

        {/* Seamless Pure White Wave Divider */}
        <div className="absolute -bottom-px left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg className="relative block w-full h-[45px] sm:h-[60px] md:h-[75px]" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path d="M0,35 C320,75 520,15 760,50 C1000,85 1200,20 1440,40 L1440,100 L0,100 Z" fill="#FFFFFF" />
          </svg>
        </div>
      </section>

      {/* Continuous Blue Gradient Wrapper from White down to Blue matching Landing Page */}
      <div className="relative bg-gradient-to-b from-white via-blue-50/70 via-35% to-blue-100/90 overflow-hidden">
        {/* Ambient background glows spanning across the combined sections */}
        <div className="absolute top-[5%] -left-32 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-[25%] -right-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-[55%] left-10 w-96 h-96 bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[10%] right-10 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl pointer-events-none" />

        {/* For Tourists */}
        <section className="py-24 relative overflow-hidden bg-transparent">
          <TourismSectionDecorations variant="standard" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <GlobeIcon className="w-3.5 h-3.5 text-primary" />
              <span>Tourist Experience</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-dark-900 tracking-tight font-display">
              How It Works for Tourists
            </h2>
            <p className="text-dark-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mt-3">
              Discover verified local experiences, book with crypto, and enjoy smart contract escrow protection.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Search, 
                step: "01", 
                title: "Discover Tours", 
                desc: "Browse authentic tours by destination, category, price, and verified reviews from real travelers.",
                gradient: "from-primary/15 via-primary/5 to-transparent",
                iconBg: "bg-primary/10 text-primary border border-primary/20"
              },
              { 
                icon: Calendar, 
                step: "02", 
                title: "Book & Lock in Escrow", 
                desc: "Select departure date and time slot. Pay seamlessly in USDT/USDC directly from your crypto wallet.",
                gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
                iconBg: "bg-blue-50 text-blue-600 border border-blue-200/60"
              },
              { 
                icon: MapPin, 
                step: "03", 
                title: "Meet Guide & Explore", 
                desc: "Meet at designated meetup spot, experience unique local gems, and funds release once tour completes.",
                gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
                iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
              },
            ].map((item) => (
              <div 
                key={item.step} 
                className="relative bg-white p-8 rounded-3xl border border-dark-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgb(29,78,216,0.08)] hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${item.gradient} rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500`} />
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Step {item.step}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-dark-900 mb-2.5 tracking-tight group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-dark-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Guides */}
      <section className="py-24 bg-transparent border-t border-blue-200/50 relative overflow-hidden">
        <TourismSectionDecorations variant="guides" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <Crosshair2Icon className="w-3.5 h-3.5 text-secondary" />
              <span>Guide Journey</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-dark-900 tracking-tight font-display">
              How It Works for Tour Guides
            </h2>
            <p className="text-dark-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mt-3">
              Share your passion, set your own schedule, and earn instant stablecoin payouts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: MapPin, 
                step: "01", 
                title: "Create Your Gig", 
                desc: "List your tour with photos, language options, designated meeting point, schedule, and custom inclusions.",
                gradient: "from-secondary/15 via-secondary/5 to-transparent",
                iconBg: "bg-secondary/10 text-secondary border border-secondary/20"
              },
              { 
                icon: Users, 
                step: "02", 
                title: "Accept Bookings", 
                desc: "Review incoming requests, coordinate details with tourists via encrypted chat, and prepare for departure.",
                gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
                iconBg: "bg-amber-50 text-amber-600 border border-amber-200/60"
              },
              { 
                icon: Wallet, 
                step: "03", 
                title: "Instant Web3 Payout", 
                desc: "Receive 90% of booking fees in USDT/USDC directly to your linked wallet right after tour conclusion.",
                gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
                iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
              },
            ].map((item) => (
              <div 
                key={item.step} 
                className="relative bg-white p-8 rounded-3xl border border-dark-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgb(29,78,216,0.08)] hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${item.gradient} rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500`} />
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                    Step {item.step}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-dark-900 mb-2.5 tracking-tight group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-dark-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Security */}
      <section className="py-20 bg-transparent border-t border-blue-200/50 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="p-8 sm:p-12 rounded-[2.5rem] bg-dark-950 border border-dark-800 text-white shadow-2xl">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Secure Crypto Escrow</h2>
            <p className="text-dark-300 text-lg mb-8">
              All payments are held in a smart contract escrow. Funds are only released to the guide after the tour is completed. Your money is protected at every step.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              {[
                "Funds locked in escrow on booking",
                "Commission deducted automatically",
                "Dispute resolution by admin",
                "Refund protection for cancellations",
                "On-chain transparency",
                "Avalanche C-Chain Escrow Protection",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 p-3 rounded-xl bg-dark-900 border border-dark-800">
                  <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span className="text-sm text-dark-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-transparent relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <div className="p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-br from-primary via-primary-600 to-blue-700 text-white shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4 font-display">Ready to Start?</h2>
            <p className="text-white/80 text-base mb-8 max-w-xl mx-auto">
              Join thousands of verified travelers and local guides using smart contract escrow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register?role=tourist" className="bg-white text-primary font-bold py-3.5 px-8 rounded-xl hover:shadow-lg hover:scale-105 transition-all w-full sm:w-auto text-sm cursor-pointer">
                I&apos;m a Tourist
              </Link>
              <Link href="/auth/register?role=guide" className="bg-dark-900 text-white font-bold py-3.5 px-8 rounded-xl hover:shadow-lg hover:scale-105 transition-all w-full sm:w-auto text-sm cursor-pointer">
                I&apos;m a Guide
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>

      <Footer />
    </div>
  );
}
