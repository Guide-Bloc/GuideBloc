import React from "react";

/**
 * Airplane flight path with dotted trajectory and airplane silhouette
 */
export function FlightTrailOrnament({ 
  className = "w-72 h-36", 
  curveDirection = "left-to-right",
  color = "text-primary" 
}: { 
  className?: string; 
  curveDirection?: "left-to-right" | "right-to-left" | "diagonal";
  color?: string;
}) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      {curveDirection === "left-to-right" ? (
        <svg viewBox="0 0 320 140" fill="none" className={`w-full h-full ${color} opacity-[0.14]`} xmlns="http://www.w3.org/2000/svg">
          {/* Dotted Flight Path */}
          <path
            d="M10 110 C 80 120, 140 20, 290 40"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            strokeLinecap="round"
          />
          {/* Departure airport dot */}
          <circle cx="10" cy="110" r="3.5" fill="currentColor" />
          <circle cx="10" cy="110" r="6" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />
          {/* Airplane at arrival point */}
          <g transform="translate(290, 40) rotate(15)">
            <path
              d="M0 -2 L12 0 L6 3 L12 10 L8 10 L4 4 L0 4 L-1 8 L-4 8 L-3 4 L-8 4 L-11 7 L-13 7 L-11 3 L-13 0 L-11 -1 L-8 2 L-3 2 L-4 -2 L-1 -2 L0 2 Z"
              fill="currentColor"
              transform="scale(1.1)"
            />
          </g>
        </svg>
      ) : curveDirection === "right-to-left" ? (
        <svg viewBox="0 0 320 140" fill="none" className={`w-full h-full ${color} opacity-[0.14]`} xmlns="http://www.w3.org/2000/svg">
          <path
            d="M310 110 C 240 120, 180 20, 30 40"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            strokeLinecap="round"
          />
          <circle cx="310" cy="110" r="3.5" fill="currentColor" />
          <circle cx="310" cy="110" r="6" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />
          <g transform="translate(30, 40) rotate(-165)">
            <path
              d="M0 -2 L12 0 L6 3 L12 10 L8 10 L4 4 L0 4 L-1 8 L-4 8 L-3 4 L-8 4 L-11 7 L-13 7 L-11 3 L-13 0 L-11 -1 L-8 2 L-3 2 L-4 -2 L-1 -2 L0 2 Z"
              fill="currentColor"
              transform="scale(1.1)"
            />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 320 160" fill="none" className={`w-full h-full ${color} opacity-[0.14]`} xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 140 Q 140 130, 160 80 T 300 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            strokeLinecap="round"
          />
          <circle cx="20" cy="140" r="3.5" fill="currentColor" />
          <g transform="translate(300, 20) rotate(-25)">
            <path
              d="M0 -2 L12 0 L6 3 L12 10 L8 10 L4 4 L0 4 L-1 8 L-4 8 L-3 4 L-8 4 L-11 7 L-13 7 L-11 3 L-13 0 L-11 -1 L-8 2 L-3 2 L-4 -2 L-1 -2 L0 2 Z"
              fill="currentColor"
              transform="scale(1.1)"
            />
          </g>
        </svg>
      )}
    </div>
  );
}

/**
 * Vintage Travel Passport Stamp / Visa Entry Stamp
 */
export function PassportStampOrnament({
  className = "w-36 h-36",
  rotation = "-12deg",
  label = "ENTRY PERMIT",
  city = "TOKYO / BALI / PARIS",
  color = "text-primary"
}: {
  className?: string;
  rotation?: string;
  label?: string;
  city?: string;
  color?: string;
}) {
  return (
    <div 
      className={`pointer-events-none select-none ${className}`}
      style={{ transform: `rotate(${rotation})` }}
    >
      <svg viewBox="0 0 160 160" fill="none" className={`w-full h-full ${color} opacity-[0.11]`} xmlns="http://www.w3.org/2000/svg">
        {/* Outer Stamp Ring */}
        <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="2" />
        <circle cx="80" cy="80" r="67" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        
        {/* Inner Content */}
        <circle cx="80" cy="80" r="44" stroke="currentColor" strokeWidth="1.2" />
        
        {/* Stars */}
        <path d="M80 18 L82 23 L87 23 L83 26 L85 31 L80 28 L75 31 L77 26 L73 23 L78 23 Z" fill="currentColor" opacity="0.7" />
        <path d="M80 130 L82 135 L87 135 L83 138 L85 143 L80 140 L75 143 L77 138 L73 135 L78 135 Z" fill="currentColor" opacity="0.7" />
        
        {/* Airplane in center */}
        <g transform="translate(80, 80) scale(1)">
          <path
            d="M0 -14 L4 -4 L16 -2 L16 2 L5 3 L3 12 L7 15 L7 18 L0 16 L-7 18 L-7 15 L-3 12 L-5 3 L-16 2 L-16 -2 L-4 -4 Z"
            fill="currentColor"
            opacity="0.8"
          />
        </g>
        
        {/* Curving Text / Badge lines */}
        <path d="M38 74 H122" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
        <path d="M38 86 H122" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
        
        {/* Stamp date & verified text */}
        <text x="80" y="56" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="800" letterSpacing="2" fontFamily="monospace">
          GUIDEBLOC
        </text>
        <text x="80" y="108" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="700" letterSpacing="1.5" fontFamily="monospace">
          VERIFIED TOUR
        </text>
      </svg>
    </div>
  );
}

/**
 * Navigational Compass Rose
 */
export function CompassRoseOrnament({
  className = "w-48 h-48",
  color = "text-primary"
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 200 200" fill="none" className={`w-full h-full ${color} opacity-[0.09]`} xmlns="http://www.w3.org/2000/svg">
        {/* Outer Ring with degree ticks */}
        <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="84" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx="100" cy="100" r="42" stroke="currentColor" strokeWidth="1" />
        
        {/* Direction indicators */}
        <text x="100" y="24" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="900" fontFamily="sans-serif">N</text>
        <text x="100" y="190" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="800" fontFamily="sans-serif">S</text>
        <text x="186" y="104" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="800" fontFamily="sans-serif">E</text>
        <text x="14" y="104" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="800" fontFamily="sans-serif">W</text>
        
        {/* Cardinal Axis Lines */}
        <line x1="100" y1="30" x2="100" y2="170" stroke="currentColor" strokeWidth="1" />
        <line x1="30" y1="100" x2="170" y2="100" stroke="currentColor" strokeWidth="1" />
        
        {/* Diagonal ticks */}
        <line x1="50" y1="50" x2="150" y2="150" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 4" />
        <line x1="150" y1="50" x2="50" y2="150" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 4" />
        
        {/* 8-point compass star */}
        <polygon points="100,100 100,38 95,100" fill="currentColor" opacity="0.8" />
        <polygon points="100,100 100,38 105,100" fill="currentColor" opacity="0.25" />
        <polygon points="100,100 100,162 105,100" fill="currentColor" opacity="0.8" />
        <polygon points="100,100 100,162 95,100" fill="currentColor" opacity="0.25" />
        <polygon points="100,100 162,100 100,95" fill="currentColor" opacity="0.8" />
        <polygon points="100,100 162,100 100,105" fill="currentColor" opacity="0.25" />
        <polygon points="100,100 38,100 100,105" fill="currentColor" opacity="0.8" />
        <polygon points="100,100 38,100 100,95" fill="currentColor" opacity="0.25" />
        
        {/* Center Pivot */}
        <circle cx="100" cy="100" r="4.5" fill="currentColor" />
        <circle cx="100" cy="100" r="2" fill="#ffffff" />
      </svg>
    </div>
  );
}

/**
 * World Globe with Latitude/Longitude & Navigation Orbit
 */
export function GlobeCoordinatesOrnament({
  className = "w-60 h-60",
  color = "text-primary"
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 200 200" fill="none" className={`w-full h-full ${color} opacity-15`} xmlns="http://www.w3.org/2000/svg">
        {/* Globe Outline */}
        <circle cx="100" cy="100" r="76" stroke="currentColor" strokeWidth="2" />
        
        {/* Meridians (Longitudes) */}
        <ellipse cx="100" cy="100" rx="55" ry="76" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" />
        <ellipse cx="100" cy="100" rx="28" ry="76" stroke="currentColor" strokeWidth="1.2" />
        <line x1="100" y1="24" x2="100" y2="176" stroke="currentColor" strokeWidth="1.5" />
        
        {/* Parallels (Latitudes) */}
        <line x1="24" y1="100" x2="176" y2="100" stroke="currentColor" strokeWidth="1.8" />
        <ellipse cx="100" cy="65" rx="68" ry="16" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
        <ellipse cx="100" cy="135" rx="68" ry="16" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
        
        {/* Orbital Ellipse */}
        <ellipse cx="100" cy="100" rx="90" ry="34" stroke="currentColor" strokeWidth="1.2" strokeDasharray="5 7" transform="rotate(-25 100 100)" opacity="0.6" />
        
        {/* Mini orbiting travel satellite/plane */}
        <circle cx="180" cy="72" r="3" fill="currentColor" />
        <circle cx="180" cy="72" r="6" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </svg>
    </div>
  );
}

/**
 * Topographic Contour Lines / Mountain Elevation Curves
 */
export function TopographicContourOrnament({
  className = "w-full h-48",
  color = "text-primary"
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`}>
      <svg viewBox="0 0 1000 240" fill="none" className={`w-full h-full ${color} opacity-[0.07]`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0,80 Q200,20 400,100 T800,90 T1000,40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 8" />
        <path d="M0,120 Q220,60 450,140 T850,130 T1000,80" stroke="currentColor" strokeWidth="1.5" />
        <path d="M0,160 Q240,100 500,180 T900,170 T1000,120" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
        <path d="M0,200 Q260,140 550,220 T950,210 T1000,160" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/**
 * Tourism Mini Geo-Marker Badge with Ripple Ping
 */
export function MapMarkerBadgeOrnament({
  className = "w-8 h-8",
  label
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={`pointer-events-none select-none inline-flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary shadow-xs">
        {/* Pulsing ring */}
        <span className="absolute -inset-1 rounded-full bg-primary/20 animate-ping opacity-40" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      {label && (
        <span className="text-[11px] font-mono font-bold tracking-wider text-primary/70 uppercase">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Mountain Peak Silhouette Outline with Sun
 */
export function MountainHorizonOrnament({
  className = "w-44 h-24",
  color = "text-primary"
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 180 90" fill="none" className={`w-full h-full ${color} opacity-15`} xmlns="http://www.w3.org/2000/svg">
        {/* Sun */}
        <circle cx="130" cy="30" r="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="130" cy="30" r="10" fill="currentColor" opacity="0.3" />
        
        {/* Mountain Ridge */}
        <path d="M10 80 L65 24 L105 60 L140 18 L175 80 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        {/* Ridge shading / snow cap lines */}
        <path d="M65 24 L55 45 L72 45 Z" fill="currentColor" opacity="0.5" />
        <path d="M140 18 L130 38 L148 38 Z" fill="currentColor" opacity="0.5" />
        <line x1="5" y1="80" x2="175" y2="80" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/**
 * Luggage & Camera Travel Emblem
 */
export function TravelGearBadgeOrnament({
  className = "w-24 h-24",
  color = "text-primary"
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" className={`w-full h-full ${color} opacity-15`} xmlns="http://www.w3.org/2000/svg">
        {/* Retro Camera Icon */}
        <rect x="20" y="30" width="60" height="45" rx="8" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="52" r="14" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="52" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
        {/* Camera top bump */}
        <path d="M38 30 L43 22 H57 L62 30" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        {/* Flash button */}
        <rect x="26" y="24" width="7" height="6" rx="1.5" fill="currentColor" />
        {/* Viewfinder light */}
        <circle cx="70" cy="38" r="2.5" fill="currentColor" />
      </svg>
    </div>
  );
}

/**
 * Tasteful & Minimalist Tourism Background Decorator
 * Renders only 1-2 subtle, non-intrusive travel accents so content remains clean and uncluttered.
 */
export function TourismSectionDecorations({
  variant = "standard"
}: {
  variant?: "standard" | "explore" | "about" | "guides" | "minimal";
}) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* Soft Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Explore Variant: Just 1 gentle compass rose in top-right */}
      {variant === "explore" && (
        <div className="hidden lg:block absolute top-6 right-8 xl:right-14">
          <CompassRoseOrnament className="w-48 h-48 xl:w-56 xl:h-56" />
        </div>
      )}

      {/* Guides Variant: Just 1 subtle flight trail on top-right */}
      {variant === "guides" && (
        <div className="hidden lg:block absolute top-6 right-8 xl:right-14">
          <FlightTrailOrnament className="w-64 h-32" curveDirection="right-to-left" />
        </div>
      )}

      {/* About Variant: Just 1 gentle compass rose on top-right */}
      {variant === "about" && (
        <div className="hidden lg:block absolute top-6 right-8 xl:right-14">
          <CompassRoseOrnament className="w-48 h-48 xl:w-56 xl:h-56" />
        </div>
      )}

      {/* Standard / How-It-Works Variant: Just 1 gentle flight trail on top-right */}
      {variant === "standard" && (
        <div className="hidden sm:block absolute top-6 right-8 xl:right-14">
          <FlightTrailOrnament className="w-64 h-32" curveDirection="right-to-left" />
        </div>
      )}

      {/* Minimal Variant: Just 1 subtle compass in corner */}
      {variant === "minimal" && (
        <div className="hidden lg:block absolute bottom-6 right-10">
          <CompassRoseOrnament className="w-40 h-40" />
        </div>
      )}
    </div>
  );
}
