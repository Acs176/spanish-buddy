// Adrián, the mascot, drawn in the app's own style (flat fills, bold dark outlines, azulejo palette) like the old Toro.
// mood: "idle" | "happy" | "sad" | "talk". Same props and CSS hooks (.body .eyes .mouth .shadow) as Toro had.
const INK = "#3b2418", HAIR = "#2f1f17", HAIR_FILL = "#4a3228", SKIN = "#d49c70";
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round", strokeLinecap: "round" };
export default function Adrian({ mood = "idle", size = 140, say }) {
  const happy = mood === "happy", sad = mood === "sad";
  return (
    <div className="mascot-wrap">
      {say && <div className="bubble">{say}</div>}
      <svg className={`mascot ${mood}`} width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <ellipse cx="100" cy="188" rx="52" ry="7" className="shadow" />
        <g className="body">
          {/* navy tee, same blue as Toro's scarf */}
          <path d="M44 196 Q48 168 84 162 L116 162 Q152 168 156 196 Z" fill="#2f4f9d" {...line} />
          <path d="M84 164 Q100 182 116 164" fill="none" stroke="#1f3570" strokeWidth="4" strokeLinecap="round" />
          {/* neck */}
          <path d="M88 144 L88 168 Q100 177 112 168 L112 144 Z" fill="#bb8057" {...line} strokeWidth="3.5" />
          {/* ears */}
          <ellipse cx="57" cy="108" rx="7" ry="10" fill={SKIN} {...line} />
          <ellipse cx="143" cy="108" rx="7" ry="10" fill={SKIN} {...line} />
          {/* head */}
          <path d="M100 48 C130 48 144 72 144 102 C144 134 126 160 100 160 C74 160 56 134 56 102 C56 72 70 48 100 48 Z" fill={SKIN} {...line} />
          {/* faded stubble on the jaw */}
          <path d="M60 112 C62 140 78 157 100 157 C122 157 138 140 140 112 C134 124 128 128 118 130 L82 130 C72 128 66 124 60 112 Z" fill={HAIR} opacity=".2" />
          {/* cheeks */}
          <circle cx="68" cy="118" r="8" fill="#ef8a7a" opacity=".65" />
          <circle cx="132" cy="118" r="8" fill="#ef8a7a" opacity=".65" />
          {/* nose */}
          <path d="M96 112 Q93 122 99 124 Q101 125 103 124 Q108 122 105 112" fill="#c4885c" {...line} strokeWidth="3" />
          {/* moustache + goatee */}
          <path d="M82 130 Q91 122 100 127 Q109 122 118 130 Q109 134 100 131 Q91 134 82 130 Z" fill={HAIR} {...line} strokeWidth="2.5" />
          <path d="M92 146 Q100 143 108 146 Q109 155 100 158 Q91 155 92 146 Z" fill={HAIR} {...line} strokeWidth="2.5" />
          {/* eyes */}
          {happy ? (
            <g stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round">
              <path d="M72 102 Q81 90 90 102" /><path d="M110 102 Q119 90 128 102" />
            </g>
          ) : (
            <g className="eyes">
              <ellipse cx="81" cy="100" rx="6" ry="8" fill={INK} />
              <ellipse cx="119" cy="100" rx="6" ry="8" fill={INK} />
              <circle cx="83" cy="97" r="2.6" fill="#fff" /><circle cx="121" cy="97" r="2.6" fill="#fff" />
            </g>
          )}
          {/* thick eyebrows */}
          <g stroke={HAIR} strokeWidth="6" fill="none" strokeLinecap="round">
            {sad ? <><path d="M68 90 L92 82" /><path d="M132 90 L108 82" /></>
              : happy ? <><path d="M68 84 Q80 77 92 83" /><path d="M108 83 Q120 77 132 84" /></>
              : <><path d="M68 88 Q80 82 92 87" /><path d="M108 87 Q120 82 132 88" /></>}
          </g>
          {/* mouth */}
          <path className="mouth" d={sad ? "M91 141 Q100 134 109 141" : happy ? "M89 135 Q100 152 111 135 Z" : "M91 136 Q100 142 109 136"}
            stroke="#e9a090" strokeWidth="3.5" fill={happy ? "#8a2a1c" : "none"} strokeLinecap="round" strokeLinejoin="round" />
          {/* messy hair: a base cap, then layered locks swept up and to the right, then uneven locks on the forehead */}
          <path d="M54 100 C44 62 58 30 100 28 C142 30 156 62 146 100 C144 84 138 72 128 66 C118 66 108 68 100 62 C94 68 86 66 82 60 C80 72 68 74 62 82 C58 88 56 94 54 100 Z" fill={HAIR_FILL} {...line} />
          <g fill={HAIR_FILL} {...line} strokeWidth="3">
            <path d="M58 66 C52 60 50 52 52 44 C56 50 60 54 66 56 Z" />
            <path d="M64 46 C60 38 62 30 68 24 C68 32 72 38 80 40 Z" />
            <path d="M76 38 C76 28 82 20 92 18 C90 26 94 32 100 34 Z" />
            <path d="M92 34 C94 24 102 18 112 18 C108 26 110 32 114 36 Z" />
            <path d="M108 36 C112 26 120 20 130 20 C126 28 128 34 130 40 Z" />
            <path d="M124 42 C130 34 138 30 146 32 C140 38 142 44 144 52 Z" />
            <path d="M138 58 C144 54 150 56 154 60 C148 62 146 68 144 74 Z" />
            <path d="M68 64 C68 72 75 79 85 79 C80 72 82 66 85 60 Z" />
            <path d="M92 62 C94 71 101 77 110 75 C105 69 107 63 109 59 Z" />
            <path d="M112 62 C116 70 125 74 134 70 C129 66 129 62 131 57 Z" />
          </g>
          <g fill="none" stroke="#8a6a58" strokeWidth="3" strokeLinecap="round" opacity=".7">
            <path d="M72 42 Q76 36 82 34" /><path d="M96 30 Q102 26 108 26" /><path d="M118 32 Q124 28 130 28" />
          </g>
        </g>
      </svg>
    </div>
  );
}
