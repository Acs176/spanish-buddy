// Toro, the mascot. mood: "idle" | "happy" | "sad" | "talk"
// ponytail: hand-drawn SVG + CSS keyframes; swap for a Rive/Lottie file when there's real artwork
export default function Mascot({ mood = "idle", size = 140, say }) {
  const happy = mood === "happy", sad = mood === "sad";
  return (
    <div className="mascot-wrap">
      {say && <div className="bubble">{say}</div>}
      <svg className={`mascot ${mood}`} width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <ellipse cx="100" cy="188" rx="52" ry="7" className="shadow" />
        <g className="body">
          {/* horns */}
          <path d="M52 62 C30 50 26 28 36 18 C40 36 52 44 66 48 Z" fill="#f5ead6" stroke="#3b2418" strokeWidth="4" strokeLinejoin="round" />
          <path d="M148 62 C170 50 174 28 164 18 C160 36 148 44 134 48 Z" fill="#f5ead6" stroke="#3b2418" strokeWidth="4" strokeLinejoin="round" />
          {/* ears */}
          <ellipse cx="38" cy="84" rx="18" ry="10" fill="#b5532a" stroke="#3b2418" strokeWidth="4" transform="rotate(-20 38 84)" />
          <ellipse cx="162" cy="84" rx="18" ry="10" fill="#b5532a" stroke="#3b2418" strokeWidth="4" transform="rotate(20 162 84)" />
          {/* head/body blob */}
          <path d="M100 40 C150 40 166 76 166 112 C166 156 140 180 100 180 C60 180 34 156 34 112 C34 76 50 40 100 40 Z"
            fill="#d2693a" stroke="#3b2418" strokeWidth="4" />
          {/* snout */}
          <ellipse cx="100" cy="138" rx="38" ry="26" fill="#f1b48c" stroke="#3b2418" strokeWidth="4" />
          <ellipse cx="88" cy="136" rx="5" ry="7" fill="#3b2418" />
          <ellipse cx="112" cy="136" rx="5" ry="7" fill="#3b2418" />
          {/* cheeks */}
          <circle cx="58" cy="118" r="9" fill="#ef8a7a" opacity=".7" />
          <circle cx="142" cy="118" r="9" fill="#ef8a7a" opacity=".7" />
          {/* eyes */}
          {happy ? (
            <g stroke="#3b2418" strokeWidth="5" fill="none" strokeLinecap="round">
              <path d="M66 96 Q76 84 86 96" /><path d="M114 96 Q124 84 134 96" />
            </g>
          ) : (
            <g className="eyes">
              <ellipse cx="76" cy="94" rx="10" ry="13" fill="#3b2418" />
              <ellipse cx="124" cy="94" rx="10" ry="13" fill="#3b2418" />
              <circle cx="79" cy="89" r="4" fill="#fff" /><circle cx="127" cy="89" r="4" fill="#fff" />
              {sad && <g stroke="#3b2418" strokeWidth="4" strokeLinecap="round">
                <path d="M62 80 L86 72" /><path d="M138 80 L114 72" /></g>}
            </g>
          )}
          {/* mouth */}
          <path className="mouth" d={sad ? "M90 158 Q100 150 110 158" : happy ? "M86 152 Q100 168 114 152" : "M92 154 Q100 160 108 154"}
            stroke="#3b2418" strokeWidth="4" fill={happy ? "#8a2a1c" : "none"} strokeLinecap="round" />
          {/* little red scarf, for Spain */}
          <path d="M60 172 Q100 186 140 172 L136 182 Q100 196 64 182 Z" fill="#c8102e" stroke="#3b2418" strokeWidth="3" />
          <circle cx="100" cy="186" r="5" fill="#ffc400" stroke="#3b2418" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}
