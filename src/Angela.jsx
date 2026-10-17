// Ángela, in the same flat, outlined style as Adrian.jsx. mood: "idle" | "happy" | "sad" | "talk". Same props and CSS hooks.
const INK = "#3b2418", HAIR = "#dcb468", HAIR_DARK = "#b88a48", HAIR_LIGHT = "#f0d79a", SKIN = "#f2cba8", GOLD = "#e0b050", ROSE = "#c98a5a";
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round", strokeLinecap: "round" };
// glasses lens: a rounded hexagon, wider at the top outer corner like her real frames
const lens = cx => `M${cx - 17} 99 Q${cx - 16} 88 ${cx - 8} 86 L${cx + 9} 85 Q${cx + 17} 87 ${cx + 17} 99 Q${cx + 16} 111 ${cx + 9} 113 L${cx - 8} 112 Q${cx - 16} 110 ${cx - 17} 99 Z`;
export default function Angela({ mood = "idle", size = 140, say }) {
  const happy = mood === "happy", sad = mood === "sad";
  return (
    <div className="mascot-wrap">
      {say && <div className="bubble">{say}</div>}
      <svg className={`mascot ${mood}`} width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <ellipse cx="100" cy="188" rx="52" ry="7" className="shadow" />
        <g className="body">
          {/* long wavy hair behind the head, tucked behind the shoulders */}
          <path d="M50 90 C38 120 42 150 30 178 Q50 186 66 176 Q82 184 100 178 Q118 184 134 176 Q150 186 170 178 C158 150 162 120 150 90 Z" fill={HAIR} {...line} />
          {/* terracotta tee */}
          <path d="M44 196 Q48 168 84 162 L116 162 Q152 168 156 196 Z" fill="#c4572f" {...line} />
          {/* neck */}
          <path d="M89 146 L89 168 Q100 176 111 168 L111 146 Z" fill="#e3b08a" {...line} strokeWidth="3.5" />
          {/* amber bead necklace */}
          <g stroke={INK} strokeWidth="1.5">
            {[[82, 168], [87, 172], [93, 175], [100, 176], [107, 175], [113, 172], [118, 168]].map(([x, y], i) =>
              <circle key={i} cx={x} cy={y} r="3.2" fill={i % 2 ? "#c4572f" : GOLD} />)}
          </g>
          {/* right ear: her hair is tucked behind it */}
          <ellipse cx="146" cy="108" rx="7" ry="10" fill={SKIN} {...line} />
          {/* head: a soft oval with fuller cheeks */}
          <path d="M100 46 C134 46 148 72 148 104 C148 138 126 160 100 160 C74 160 52 138 52 104 C52 72 66 46 100 46 Z" fill={SKIN} {...line} />
          {/* gold hoop earring */}
          <circle cx="146" cy="124" r="5.5" fill="none" stroke={GOLD} strokeWidth="3" />
          {/* rosy cheeks + freckles */}
          <circle cx="66" cy="122" r="10" fill="#ef7f72" opacity=".6" />
          <circle cx="134" cy="122" r="10" fill="#ef7f72" opacity=".6" />
          <g fill="#b9774f" opacity=".7">
            {[[70, 116], [76, 121], [64, 119], [71, 126], [124, 121], [130, 116], [136, 119], [129, 126], [96, 113], [104, 113], [92, 117], [108, 117]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.2" />)}
          </g>
          {/* nose: broad and soft */}
          <path d="M95 112 Q91 122 96 125 Q100 127 104 125 Q109 122 105 112" fill="none" stroke="#c07e58" strokeWidth="3" strokeLinecap="round" />
          {/* eyes: green */}
          {happy ? (
            <g stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round">
              <path d="M71 102 Q80 90 89 102" /><path d="M111 102 Q120 90 129 102" />
            </g>
          ) : (
            <g className="eyes">
              <ellipse cx="80" cy="100" rx="8" ry="8.5" fill="#fff" /><ellipse cx="120" cy="100" rx="8" ry="8.5" fill="#fff" />
              <ellipse cx="80" cy="100" rx="6" ry="7" fill="#4f9a6a" /><ellipse cx="120" cy="100" rx="6" ry="7" fill="#4f9a6a" />
              <circle cx="80" cy="100" r="3" fill={INK} /><circle cx="120" cy="100" r="3" fill={INK} />
              <circle cx="82" cy="97.5" r="1.8" fill="#fff" /><circle cx="122" cy="97.5" r="1.8" fill="#fff" />
              <g fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round"><path d="M71 98 Q80 88 89 98" /><path d="M111 98 Q120 88 129 98" /></g>
            </g>
          )}
          {/* light eyebrows */}
          <g stroke="#9a6a3a" strokeWidth="4" fill="none" strokeLinecap="round">
            {sad ? <><path d="M66 84 L92 76" /><path d="M134 84 L108 76" /></>
              : happy ? <><path d="M66 79 Q80 71 93 77" /><path d="M107 77 Q120 71 134 79" /></>
              : <><path d="M66 82 Q80 75 93 80" /><path d="M107 80 Q120 75 134 82" /></>}
          </g>
          {/* thin gold-rim glasses */}
          <g fill="#fff" fillOpacity=".14" stroke={ROSE} strokeWidth="2.6" strokeLinejoin="round">
            <path d={lens(80)} /><path d={lens(120)} />
          </g>
          <g fill="none" stroke={ROSE} strokeWidth="2.6" strokeLinecap="round">
            <path d="M97 95 Q100 92 103 95" /><path d="M63 97 L54 95" /><path d="M137 97 L146 96" />
          </g>
          {/* mouth: soft pink lips */}
          {sad ? <path className="mouth" d="M90 143 Q100 135 110 143" stroke="#c0605a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            : happy ? <>
              <path className="mouth" d="M84 133 Q100 157 116 133 Z" stroke="#c0605a" strokeWidth="3.5" fill="#8a2a1c" strokeLinejoin="round" />
              <path d="M88 134 Q100 140 112 134 L110 136.5 Q100 142 90 136.5 Z" fill="#fff" />
            </>
            : <path className="mouth" d="M89 135 Q95 131 100 134 Q105 131 111 135 Q100 146 89 135 Z" fill="#e58d88" stroke="#c0605a" strokeWidth="2.5" strokeLinejoin="round" />}
          {/* honey-blonde hair: a cap that hugs the skull, a side parting, one big swoop across the forehead,
              and a shorter sweep on the other side. */}
          <path d="M50 104 C44 76 50 52 70 42 C80 36 92 34 100 34 C122 34 146 44 152 74 C154 86 152 96 150 104 C148 90 142 76 128 66 C114 58 100 60 86 50 C78 58 68 72 62 88 C58 96 54 100 50 104 Z" fill={HAIR} {...line} />
          <path d="M86 50 C104 50 128 56 142 74 C148 82 150 92 150 104 C142 92 134 84 122 78 C110 72 96 66 86 50 Z" fill={HAIR} {...line} />
          <path d="M86 50 C72 58 62 74 58 94 L50 108 C46 88 54 64 70 52 Z" fill={HAIR} {...line} />
          <g fill="none" stroke={HAIR_DARK} strokeWidth="3" strokeLinecap="round">
            <path d="M92 52 C110 54 128 62 138 76" /><path d="M84 54 C72 62 64 76 60 92" />
            <path d="M96 38 C112 36 130 44 142 60" />
          </g>
          <g fill="none" stroke={HAIR_LIGHT} strokeWidth="3" strokeLinecap="round">
            <path d="M100 42 C116 42 132 50 142 66" /><path d="M64 70 C60 80 58 90 56 98" />
          </g>
        </g>
      </svg>
    </div>
  );
}
