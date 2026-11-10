// Mr. Lock 'em up, él in the verb game: a grumpy grandad leaning out of his car window, drawn like Angela.jsx and Adrian.jsx.
// mood: "idle" (grumpy) | "happy" | "sad". Same props and CSS hooks (.body .eyes .mouth) as the others.
const INK = "#3b2418", SKIN = "#e6ad82", SKIN_DARK = "#c98d62", WHITE = "#eef0f2", GREY = "#b9bec7";
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round", strokeLinecap: "round" };
const brow = d => <><path d={d} stroke={INK} strokeWidth="11" /><path d={d} stroke={WHITE} strokeWidth="6" /></>;
const WINDOW = "M24 164 L40 74 Q44 58 60 58 L170 58 Q186 58 186 74 L186 164";

export default function LockEmUp({ mood = "idle", size = 140, say }) {
  const happy = mood === "happy", sad = mood === "sad";
  return (
    <div className="mascot-wrap">
      {say && <div className="bubble">{say}</div>}
      <svg className={`mascot ${mood}`} width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <pattern id="plaid" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="#4d7cc0" />
            <rect width="16" height="6" fill="#2a4f8f" opacity=".75" /><rect width="6" height="16" fill="#2a4f8f" opacity=".75" />
            <path d="M0 11h16M11 0v16" stroke="#a9c6ea" strokeWidth="1.2" />
          </pattern>
        </defs>
        <g className="body">
          {/* the dark car window behind him, in its white frame */}
          <path d={WINDOW + " Z"} fill="#39404f" stroke="#f4f1ea" strokeWidth="9" strokeLinejoin="round" />
          <path d={WINDOW} fill="none" {...line} strokeWidth="2.5" />
          {/* plaid shirt, neck, collar */}
          <path d="M40 198 Q46 168 84 160 L116 160 Q154 168 160 198 Z" fill="url(#plaid)" {...line} />
          <path d="M88 144 L88 166 Q100 175 112 166 L112 144 Z" fill={SKIN_DARK} {...line} strokeWidth="3.5" />
          <path d="M84 160 L100 178 L92 186 L76 166 Z" fill="url(#plaid)" {...line} strokeWidth="3" />
          <path d="M116 160 L100 178 L108 186 L124 166 Z" fill="url(#plaid)" {...line} strokeWidth="3" />
          {/* ears and head: bald and shiny, a wrinkled forehead */}
          <ellipse cx="55" cy="110" rx="8" ry="11" fill={SKIN} {...line} />
          <ellipse cx="145" cy="110" rx="8" ry="11" fill={SKIN} {...line} />
          <path d="M100 50 C132 50 146 74 146 104 C146 136 128 160 100 160 C72 160 54 136 54 104 C54 74 68 50 100 50 Z" fill={SKIN} {...line} />
          <ellipse cx="86" cy="62" rx="11" ry="5" fill="#fff" opacity=".4" transform="rotate(-12 86 62)" />
          <g fill="none" stroke={SKIN_DARK} strokeWidth="2.5" strokeLinecap="round"><path d="M80 72 Q100 66 120 72" /><path d="M85 79 Q100 75 115 79" /></g>
          {/* white tufts over the ears */}
          <path d="M58 118 C46 112 44 96 50 84 C52 76 58 72 62 74 C60 82 64 88 66 94 C62 100 60 108 58 118 Z" fill={WHITE} {...line} strokeWidth="3" />
          <path d="M142 118 C154 112 156 96 150 84 C148 76 142 72 138 74 C140 82 136 88 134 94 C138 100 140 108 142 118 Z" fill={WHITE} {...line} strokeWidth="3" />
          <circle cx="68" cy="122" r="8" fill="#ef8a7a" opacity=".55" />
          <circle cx="132" cy="122" r="8" fill="#ef8a7a" opacity=".55" />
          {/* eyes, with tired bags under them */}
          {happy ? (
            <g stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round"><path d="M73 105 Q81 95 89 105" /><path d="M111 105 Q119 95 127 105" /></g>
          ) : (
            <g className="eyes">
              <ellipse cx="81" cy="103" rx="5" ry="6.5" fill={INK} /><ellipse cx="119" cy="103" rx="5" ry="6.5" fill={INK} />
              <circle cx="82.5" cy="100.5" r="2" fill="#fff" /><circle cx="120.5" cy="100.5" r="2" fill="#fff" />
            </g>
          )}
          <g fill="none" stroke={SKIN_DARK} strokeWidth="2.2" strokeLinecap="round"><path d="M74 113 Q81 117 88 113" /><path d="M112 113 Q119 117 126 113" /></g>
          {/* bushy white brows: frowning when idle */}
          <g fill="none" strokeLinecap="round">
            {sad ? <>{brow("M68 94 L92 86")}{brow("M132 94 L108 86")}</>
              : happy ? <>{brow("M68 86 Q80 78 92 84")}{brow("M108 84 Q120 78 132 86")}</>
              : <>{brow("M68 86 L92 93")}{brow("M132 86 L108 93")}</>}
          </g>
          <path d="M95 106 Q88 121 93 126 Q100 131 107 126 Q112 121 105 106" fill="#dd9a6f" {...line} strokeWidth="3" />
          {/* mouth, then the walrus moustache over it */}
          <path className="mouth" d={sad ? "M92 151 Q100 144 108 151" : happy ? "M88 140 Q100 158 112 140 Z" : "M92 149 Q100 145 108 149"}
            stroke={INK} strokeWidth="3.5" fill={happy ? "#8a2a1c" : "none"} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M72 137 Q75 124 90 124 Q96 124 100 128 Q104 124 110 124 Q125 124 128 137 Q122 144 113 139 Q106 135 100 137 Q94 135 87 139 Q78 144 72 137 Z" fill={WHITE} {...line} strokeWidth="3" />
          <g fill="none" stroke={GREY} strokeWidth="1.8" strokeLinecap="round"><path d="M84 130 L80 137" /><path d="M92 129 L90 136" /><path d="M108 129 L110 136" /><path d="M116 130 L120 137" /></g>
          {/* the door, and his elbow out of the window */}
          <path d="M8 164 Q8 156 18 156 L182 156 Q194 156 194 168 L194 200 L8 200 Z" fill="#f4f1ea" {...line} />
          <rect x="142" y="174" width="34" height="10" rx="5" fill="#2b3140" stroke={INK} strokeWidth="2.5" />
          <path d="M14 182 L194 182" stroke="#d9d5ca" strokeWidth="3" />
          <path d="M34 162 Q30 150 42 148 L78 148 Q88 152 86 162 L82 168 L42 168 Q34 168 34 162 Z" fill="url(#plaid)" {...line} />
          <path d="M30 148 Q20 152 22 162 Q26 172 38 168 Q44 162 42 154 Q38 146 30 148 Z" fill={SKIN} {...line} strokeWidth="3.5" />
        </g>
      </svg>
    </div>
  );
}
