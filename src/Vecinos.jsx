// Bojack y Diane, the neighbours: ellos in ¿De quién es?. Drawn like Adrian.jsx (flat fills, bold outlines, azulejo palette).
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

// Bojack: a long horse face turned a little to the right, sleepy half-shut eyes, a pale pink snout,
// a white blaze, a spiky black mane, a light blue jumper knitted with dark Xs under a grey blazer
export function Bojack({ mood = "idle", size = 140 }) {
  const happy = mood === "happy", sad = mood === "sad", COAT = "#c87f4a", MANE = "#1d1a1c";
  return (
    <div className="mascot-wrap">
      <svg className={`mascot ${mood}`} width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <ellipse cx="100" cy="188" rx="52" ry="7" className="shadow" />
        <g className="body">
          {/* neck, jumper, blazer */}
          <path d="M74 120 L72 170 L124 170 L118 128 Z" fill={COAT} {...line} />
          <path d="M40 196 Q44 166 76 160 L124 160 Q156 166 160 196 Z" fill="#8d9296" {...line} />
          <path d="M74 160 Q100 172 124 160 L114 196 L86 196 Z" fill="#7fa6dc" {...line} strokeWidth="3" />
          <g stroke="#2f4f9d" strokeWidth="2.5" strokeLinecap="round">
            {[[92, 174], [106, 174], [99, 184], [92, 192], [106, 192]].map(([x, y]) => <path key={x + "" + y} d={`M${x - 3} ${y - 3} L${x + 3} ${y + 3} M${x + 3} ${y - 3} L${x - 3} ${y + 3}`} />)}
          </g>
          <path d="M76 160 L88 180 L82 196 M124 160 L112 180 L118 196" fill="none" {...line} strokeWidth="3" />
          {/* the spiky mane, down the back of the head and neck */}
          <path d="M92 30 L80 30 L82 40 L66 42 L72 54 L56 60 L66 70 L52 80 L64 88 L50 100 L64 106 L54 120 L68 124 L60 138 L76 140 L78 60 Z" fill={MANE} {...line} strokeWidth="3" />
          {/* ears */}
          <path d="M84 52 L80 14 L102 40 Z" fill={COAT} {...line} />
          <path d="M112 40 L132 10 L132 52 Z" fill={COAT} {...line} />
          <path d="M86 24 L88 42 L96 40 Z" fill="#a8603a" /><path d="M128 22 L118 42 L128 48 Z" fill="#a8603a" />
          {/* long face, the snout pushing down and to the right */}
          <path d="M104 34 C126 34 140 50 140 74 L146 118 C160 128 162 152 148 164 C134 174 108 172 96 160 C84 150 80 132 80 116 L78 74 C76 50 86 34 104 34 Z" fill={COAT} {...line} />
          {/* white blaze running into the snout */}
          <path d="M112 44 C116 44 118 48 118 54 L120 112 L112 112 L108 54 C108 48 109 44 112 44 Z" fill="#f8f4ea" />
          <path d="M88 132 C90 116 104 108 122 108 C142 108 158 120 158 140 C158 158 142 170 122 170 C104 170 88 158 88 132 Z" fill="#f2b8b4" {...line} strokeWidth="3.5" />
          <ellipse cx="146" cy="130" rx="4" ry="7" fill={INK} transform="rotate(-20 146 130)" />
          <path className="mouth" d={sad ? "M104 160 Q124 152 146 158" : happy ? "M102 152 Q126 172 150 152" : "M102 156 Q126 162 148 154"}
            stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* eyes: big whites, droopy lids */}
          {happy ? (
            <g stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round"><path d="M88 80 Q96 70 104 80" /><path d="M122 78 Q130 68 138 78" /></g>
          ) : (
            <g className="eyes">
              <ellipse cx="96" cy="80" rx="10" ry="11" fill="#fff" {...line} strokeWidth="3" />
              <ellipse cx="130" cy="78" rx="9" ry="11" fill="#fff" {...line} strokeWidth="3" />
              <circle cx="100" cy="84" r="4.5" fill={INK} /><circle cx="133" cy="82" r="4.5" fill={INK} />
              <path d={sad ? "M85 74 Q96 66 107 78 L107 70 L85 70 Z" : "M85 78 Q96 74 107 78 L107 68 L85 68 Z"} fill={COAT} />
              <path d={sad ? "M119 76 Q130 64 140 74 L140 66 L119 66 Z" : "M120 76 Q130 72 140 76 L140 66 L120 66 Z"} fill={COAT} />
              <path d={sad ? "M86 74 Q96 66 106 78" : "M86 78 Q96 74 106 78"} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
              <path d={sad ? "M120 76 Q130 64 140 74" : "M121 76 Q130 72 140 76"} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}
          {/* forelock tufts */}
          <path d="M92 36 L100 50 L104 38 L112 50 L114 36 C108 30 98 30 92 36 Z" fill={MANE} {...line} strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
}

// Diane: long straight blue-black hair parted to the side, thin rectangular glasses, pale, a small mouth,
// an olive bomber jacket with orange zips over a white top
export function Diane({ mood = "idle", size = 140 }) {
  const happy = mood === "happy", sad = mood === "sad", SKIN = "#f6dcc6", HAIR = "#1a2242";
  return (
    <div className="mascot-wrap">
      <svg className={`mascot ${mood}`} width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <ellipse cx="100" cy="188" rx="52" ry="7" className="shadow" />
        <g className="body">
          {/* long hair behind */}
          <path d="M58 90 C54 56 74 38 102 38 C130 38 148 58 144 92 L150 186 L52 186 Z" fill={HAIR} {...line} />
          <path d="M44 196 Q48 166 82 160 L118 160 Q152 166 156 196 Z" fill="#6f7a35" {...line} />
          <path d="M84 160 Q100 172 116 160 L112 196 L88 196 Z" fill="#f8f4ea" {...line} strokeWidth="3" />
          <path d="M62 182 L74 176 M138 182 L126 176" stroke="#e07a3a" strokeWidth="4" strokeLinecap="round" />
          <path d="M90 140 L90 164 Q100 172 110 164 L110 140 Z" fill="#e6c0a4" {...line} strokeWidth="3.5" />
          <path d="M100 52 C126 52 138 74 138 100 C138 130 122 152 100 152 C78 152 62 130 62 100 C62 74 74 52 100 52 Z" fill={SKIN} {...line} />
          {/* hair hanging in front of the shoulders */}
          <path d="M64 86 C58 110 58 150 56 180 L72 180 C72 150 70 116 74 96 Z" fill={HAIR} {...line} strokeWidth="3" />
          <path d="M136 86 C142 110 142 150 144 180 L128 180 C128 150 130 116 126 96 Z" fill={HAIR} {...line} strokeWidth="3" />
          {happy ? (
            <g stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round"><path d="M76 104 Q83 96 90 104" /><path d="M110 104 Q117 96 124 104" /></g>
          ) : (
            <g className="eyes"><circle cx="83" cy="103" r="4.5" fill={INK} /><circle cx="117" cy="103" r="4.5" fill={INK} /></g>
          )}
          {/* thin rectangular glasses */}
          <g fill="rgba(255,255,255,.2)" stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
            <rect x="69" y="94" width="28" height="18" rx="3" /><rect x="103" y="94" width="28" height="18" rx="3" />
          </g>
          <path d="M97 101 L103 101 M69 99 L63 97 M131 99 L137 97" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <g stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round">
            {sad ? <><path d="M72 88 L90 84" /><path d="M128 88 L110 84" /></> : <><path d="M72 86 Q80 82 90 85" /><path d="M110 85 Q120 82 128 86" /></>}
          </g>
          <path d="M98 114 Q97 122 101 123" fill="none" stroke="#c99a7c" strokeWidth="2.5" strokeLinecap="round" />
          <path className="mouth" d={sad ? "M92 136 Q100 131 108 136" : happy ? "M90 131 Q100 143 110 131 Z" : "M93 133 Q100 136 107 133"}
            stroke="#b8644a" strokeWidth="3" fill={happy ? "#8a2a1c" : "none"} strokeLinecap="round" strokeLinejoin="round" />
          {/* side-swept fringe from a parting on her right */}
          <path d="M60 96 C56 62 78 42 108 44 C130 46 144 62 142 92 C136 74 128 64 118 60 C104 72 84 80 62 96 Z" fill={HAIR} {...line} />
        </g>
      </svg>
    </div>
  );
}
