// Paco y Lola, the neighbours: ellos in ¿De quién es?. Drawn like Adrian.jsx (flat fills, bold outlines, azulejo palette).
// mood: "idle" | "happy" | "sad". Same CSS hooks (.body .eyes .mouth .shadow) as the others.
const INK = "#3b2418";
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round", strokeLinecap: "round" };
const HEAD = "M100 48 C130 48 144 72 144 102 C144 134 126 160 100 160 C74 160 56 134 56 102 C56 72 70 48 100 48 Z";

const Eyes = ({ happy }) => happy ? (
  <g stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round"><path d="M72 102 Q81 90 90 102" /><path d="M110 102 Q119 90 128 102" /></g>
) : (
  <g className="eyes">
    <ellipse cx="81" cy="100" rx="6" ry="8" fill={INK} /><ellipse cx="119" cy="100" rx="6" ry="8" fill={INK} />
    <circle cx="83" cy="97" r="2.6" fill="#fff" /><circle cx="121" cy="97" r="2.6" fill="#fff" />
  </g>
);
const Mouth = ({ happy, sad, color }) => (
  <path className="mouth" d={sad ? "M90 141 Q100 133 110 141" : happy ? "M86 134 Q100 154 114 134 Z" : "M88 135 Q100 144 112 135"}
    stroke={color} strokeWidth="3.5" fill={happy ? "#8a2a1c" : "none"} strokeLinecap="round" strokeLinejoin="round" />
);

// Lola: a big cloud of black curls, a red flower, gold hoops, a green top
export function Lola({ mood = "idle", size = 140 }) {
  const happy = mood === "happy", sad = mood === "sad", SKIN = "#e2a77c", HAIR = "#2a1a14";
  return (
    <div className="mascot-wrap">
      <svg className={`mascot ${mood}`} width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <ellipse cx="100" cy="188" rx="52" ry="7" className="shadow" />
        <g className="body">
          {/* the curls behind her head */}
          <g fill={HAIR} {...line} strokeWidth="3">
            {[[58, 70, 22], [142, 70, 22], [50, 102, 21], [150, 102, 21], [56, 134, 20], [144, 134, 20], [76, 46, 22], [124, 46, 22], [100, 38, 22]].map(([x, y, r]) => <circle key={x + "" + y} cx={x} cy={y} r={r} />)}
          </g>
          <path d="M44 196 Q48 168 84 162 L116 162 Q152 168 156 196 Z" fill="#3f9a6c" {...line} />
          <path d="M84 164 Q100 180 116 164" fill="none" stroke="#2a7550" strokeWidth="4" strokeLinecap="round" />
          <path d="M88 144 L88 168 Q100 177 112 168 L112 144 Z" fill="#c98d62" {...line} strokeWidth="3.5" />
          <path d={HEAD} fill={SKIN} {...line} />
          {/* gold hoops */}
          <g fill="none" stroke="#e0b050" strokeWidth="3.5"><circle cx="58" cy="124" r="7" /><circle cx="142" cy="124" r="7" /></g>
          <circle cx="68" cy="118" r="8" fill="#ef8a7a" opacity=".65" /><circle cx="132" cy="118" r="8" fill="#ef8a7a" opacity=".65" />
          <path d="M97 112 Q95 120 100 122 Q105 120 103 112" fill="#d3946a" {...line} strokeWidth="3" />
          <Eyes happy={happy} />
          {!happy && <g stroke={INK} strokeWidth="2.5" strokeLinecap="round"><path d="M74 94 L70 90" /><path d="M126 94 L130 90" /></g>}
          <g stroke={HAIR} strokeWidth="4" fill="none" strokeLinecap="round">
            {sad ? <><path d="M70 88 L90 82" /><path d="M130 88 L110 82" /></> : <><path d="M70 85 Q80 79 90 84" /><path d="M110 84 Q120 79 130 85" /></>}
          </g>
          <Mouth happy={happy} sad={sad} color="#c4572f" />
          {/* curly fringe over the forehead */}
          <g fill={HAIR} {...line} strokeWidth="3">
            <circle cx="72" cy="62" r="13" /><circle cx="92" cy="54" r="14" /><circle cx="112" cy="55" r="14" /><circle cx="130" cy="64" r="13" />
          </g>
          {/* a red flower over her left ear */}
          <g transform="translate(140 58)">
            {[0, 72, 144, 216, 288].map(r => <ellipse key={r} cx="0" cy="-9" rx="7" ry="9" fill="#c4572f" stroke={INK} strokeWidth="2.5" transform={`rotate(${r})`} />)}
            <circle r="5" fill="#e0b050" stroke={INK} strokeWidth="2.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

// Paco: a tall brown quiff, round glasses, a mustard jumper, clean-shaven and smiley
export function Paco({ mood = "idle", size = 140 }) {
  const happy = mood === "happy", sad = mood === "sad", SKIN = "#f0c09a", HAIR = "#6b4a2e";
  return (
    <div className="mascot-wrap">
      <svg className={`mascot ${mood}`} width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <ellipse cx="100" cy="188" rx="52" ry="7" className="shadow" />
        <g className="body">
          <path d="M44 196 Q48 168 84 162 L116 162 Q152 168 156 196 Z" fill="#e0b050" {...line} />
          <path d="M80 164 L100 184 L120 164" fill="#f8f4ea" {...line} strokeWidth="3" />
          <path d="M88 144 L88 166 Q100 175 112 166 L112 144 Z" fill="#d9a07a" {...line} strokeWidth="3.5" />
          <ellipse cx="57" cy="108" rx="7" ry="10" fill={SKIN} {...line} />
          <ellipse cx="143" cy="108" rx="7" ry="10" fill={SKIN} {...line} />
          <path d={HEAD} fill={SKIN} {...line} />
          <circle cx="68" cy="120" r="8" fill="#ef8a7a" opacity=".65" /><circle cx="132" cy="120" r="8" fill="#ef8a7a" opacity=".65" />
          <path d="M96 110 Q92 122 99 125 Q101 126 103 125 Q109 122 105 110" fill="#dfa47c" {...line} strokeWidth="3" />
          <Eyes happy={happy} />
          {/* round glasses */}
          <g fill="rgba(255,255,255,.18)" stroke={INK} strokeWidth="3.5">
            <circle cx="81" cy="100" r="15" /><circle cx="119" cy="100" r="15" />
          </g>
          <path d="M96 99 Q100 95 104 99" fill="none" stroke={INK} strokeWidth="3.5" />
          <g stroke={HAIR} strokeWidth="6" fill="none" strokeLinecap="round">
            {sad ? <><path d="M68 84 L92 77" /><path d="M132 84 L108 77" /></> : <><path d="M68 80 Q80 73 92 79" /><path d="M108 79 Q120 73 132 80" /></>}
          </g>
          <Mouth happy={happy} sad={sad} color="#b8644a" />
          {/* short sides and a tall quiff swept up and back */}
          <path d="M56 98 C52 76 58 62 70 54 C78 60 80 66 82 70 C70 74 62 84 56 98 Z" fill={HAIR} {...line} strokeWidth="3" />
          <path d="M144 98 C148 76 142 62 130 54 C122 60 120 66 118 70 C130 74 138 84 144 98 Z" fill={HAIR} {...line} strokeWidth="3" />
          <path d="M66 62 C64 36 82 14 112 12 C134 12 148 24 150 40 C140 32 130 32 122 36 C134 44 138 54 136 62 C124 54 112 54 100 58 C90 52 76 54 66 62 Z" fill={HAIR} {...line} />
          <g fill="none" stroke="#9a7452" strokeWidth="3" strokeLinecap="round" opacity=".8"><path d="M84 30 Q100 20 120 22" /><path d="M80 44 Q94 34 112 34" /></g>
        </g>
      </svg>
    </div>
  );
}
