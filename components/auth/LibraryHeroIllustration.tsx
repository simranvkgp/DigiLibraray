// Fully vector library scene — bookshelves, a rolling ladder, and a figure
// reaching for a book. Built as inline SVG (not a raster image) so it stays
// crisp and reflows cleanly at any size instead of pixelating or cropping.
const INK = "#0B1D3A";
const GOLD = "#C68A2E";
const SKIN = "#E8B98A";
const HAIR = "#3F2A1D";
const SPINE_COLORS = ["#0B1D3A", "#DC2626", "#1E3A8A", "#C68A2E", "#16A34A"];
const SPINE_WIDTHS = [14, 10, 18, 8, 22, 12, 16, 9, 20, 11, 15, 13, 17, 10, 19, 12];

const SHELF_INNER_LEFT = 46;
const SHELF_INNER_RIGHT = 330;
const COMPARTMENTS = [
  { top: 52, bottom: 150 },
  { top: 162, bottom: 260 },
  { top: 272, bottom: 370 },
  { top: 382, bottom: 470 },
];

function bookRow(compartmentIndex: number, top: number, bottom: number) {
  const height = bottom - top;
  const spines: { x: number; y: number; width: number; height: number; color: string }[] = [];
  let x = SHELF_INNER_LEFT;
  let i = 0;
  while (x < SHELF_INNER_RIGHT - 4) {
    const w = SPINE_WIDTHS[(i + compartmentIndex * 3) % SPINE_WIDTHS.length];
    const remaining = SHELF_INNER_RIGHT - x;
    const finalWidth = Math.min(w, remaining - 2);
    if (finalWidth < 4) break;
    const bookHeight = height - 10 - ((i + compartmentIndex) % 3) * (height * 0.14);
    const color = SPINE_COLORS[(i + compartmentIndex * 2) % SPINE_COLORS.length];
    spines.push({ x, y: bottom - bookHeight, width: finalWidth, height: bookHeight, color });
    x += finalWidth + 3;
    i++;
  }
  return spines;
}

function railX(y: number, xBottom: number, xTop: number, yBottom: number, yTop: number) {
  const t = (yBottom - y) / (yBottom - yTop);
  return xBottom + (xTop - xBottom) * t;
}

const LADDER_BOTTOM_Y = 478;
const LADDER_TOP_Y = 150;
const RAIL_A = { xBottom: 148, xTop: 172 };
const RAIL_B = { xBottom: 208, xTop: 232 };
const RUNG_YS = [452, 412, 372, 332, 292, 252, 212, 178];

export function LibraryHeroIllustration() {
  return (
    <svg
      viewBox="0 0 400 520"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Illustration of a person climbing a ladder to reach a book on a library shelf"
    >
      <defs>
        <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-navy)" />
          <stop offset="55%" stopColor="var(--color-accentblue)" />
          <stop offset="100%" stopColor="var(--color-background)" />
        </linearGradient>
        <radialGradient id="hero-glow" cx="70%" cy="85%" r="60%">
          <stop offset="0%" stopColor="var(--color-background)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--color-background)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="400" height="520" fill="url(#hero-bg)" />
      <rect x="0" y="0" width="400" height="520" fill="url(#hero-glow)" />

      {/* hanging pendant lamps */}
      <g stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="2" fill="none">
        <path d="M320 0 V36" />
        <circle cx="320" cy="46" r="10" fill="#FFFFFF" fillOpacity="0.18" />
        <path d="M362 0 V60" />
        <circle cx="362" cy="70" r="8" fill="#FFFFFF" fillOpacity="0.18" />
      </g>

      {/* bookshelf frame */}
      <rect x="30" y="30" width="16" height="460" rx="3" fill={INK} fillOpacity="0.85" />
      <rect x="330" y="30" width="16" height="460" rx="3" fill={INK} fillOpacity="0.85" />
      {[40, 150, 260, 370, 470].map((y) => (
        <rect key={y} x="30" y={y} width="316" height="12" rx="2" fill={INK} fillOpacity="0.85" />
      ))}

      {/* books */}
      {COMPARTMENTS.map((c, i) => (
        <g key={i}>
          {bookRow(i, c.top, c.bottom).map((b, j) => (
            <rect
              key={j}
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
              rx="1.5"
              fill={b.color}
              fillOpacity="0.92"
            />
          ))}
        </g>
      ))}

      {/* rolling ladder */}
      <g stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none">
        <line x1={RAIL_A.xBottom} y1={LADDER_BOTTOM_Y} x2={RAIL_A.xTop} y2={LADDER_TOP_Y} />
        <line x1={RAIL_B.xBottom} y1={LADDER_BOTTOM_Y} x2={RAIL_B.xTop} y2={LADDER_TOP_Y} />
      </g>
      <g stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.85">
        {RUNG_YS.map((y) => (
          <line
            key={y}
            x1={railX(y, RAIL_A.xBottom, RAIL_A.xTop, LADDER_BOTTOM_Y, LADDER_TOP_Y)}
            y1={y}
            x2={railX(y, RAIL_B.xBottom, RAIL_B.xTop, LADDER_BOTTOM_Y, LADDER_TOP_Y)}
            y2={y}
          />
        ))}
      </g>
      <g fill="#FFFFFF">
        <circle cx={RAIL_A.xBottom} cy={LADDER_BOTTOM_Y + 8} r="8" fillOpacity="0.9" />
        <circle cx={RAIL_B.xBottom} cy={LADDER_BOTTOM_Y + 8} r="8" fillOpacity="0.9" />
      </g>
      <ellipse cx="178" cy="494" rx="60" ry="8" fill="#000000" opacity="0.12" />

      {/* figure reaching for a book, standing on a rung */}
      <g>
        {/* back leg */}
        <rect x="182" y="258" width="16" height="52" rx="7" fill={INK} />
        {/* front leg standing on rung */}
        <rect x="204" y="250" width="16" height="60" rx="7" fill={INK} />
        <ellipse cx="190" cy="312" rx="11" ry="6" fill={HAIR} />
        <ellipse cx="212" cy="304" rx="11" ry="6" fill={HAIR} />

        {/* torso (blazer) */}
        <path d="M182 200 Q182 180 204 180 Q226 180 226 200 L224 256 Q204 264 184 256 Z" fill="var(--color-accentblue)" />
        {/* far arm holding the rail */}
        <rect x="216" y="196" width="12" height="46" rx="6" fill="var(--color-accentblue)" transform="rotate(18 222 210)" />
        {/* near arm reaching up for the book */}
        <path
          d="M188 196 Q170 176 168 146"
          stroke="var(--color-accentblue)"
          strokeWidth="13"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="167" cy="140" r="7" fill={SKIN} />

        {/* book being pulled from the shelf */}
        <rect x="150" y="118" width="30" height="20" rx="2" fill={GOLD} transform="rotate(-8 165 128)" />

        {/* neck + head */}
        <rect x="198" y="176" width="12" height="12" fill={SKIN} />
        <circle cx="204" cy="166" r="16" fill={SKIN} />
        <path d="M188 162 Q188 146 204 146 Q220 146 220 162 Q220 152 204 152 Q192 152 188 162 Z" fill={HAIR} />
        <circle cx="211" cy="164" r="2" fill={HAIR} />
        {/* glasses, a nod to the reading-life doodles */}
        <g stroke={GOLD} strokeWidth="1.6" fill="none">
          <circle cx="199" cy="167" r="4.5" />
          <circle cx="209" cy="167" r="4.5" />
          <path d="M203.5 167 H204.5" />
        </g>
      </g>
    </svg>
  );
}
