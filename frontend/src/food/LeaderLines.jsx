/**
 * The thin rules that connect a layer in the scene to its label in the margin.
 *
 * This is the detail that makes the exploded view read as an anatomical plate
 * rather than a list beside a picture. The lines are SVG in the DOM rather
 * than drawn in WebGL, so the labels stay real selectable text, stay crisp on
 * a retina screen, and stay reachable by a screen reader.
 *
 * Each line runs from the layer's projected centre, out horizontally to a
 * gutter, then to the label's own vertical position — the elbow keeps the
 * fan of lines readable when several layers sit close together.
 */
export default function LeaderLines({ points, labels, width, height, gutterX, accent = "#E9B949" }) {
  if (!width || !height || !gutterX) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      aria-hidden="true"
    >
      {labels.map((label) => {
        const p = points[label.id];
        if (!p || label.y == null) return null;
        // Out from the layer, along to a common elbow just short of the
        // label gutter, then up or down to the label's own line. The shared
        // elbow is what keeps nine lines from crossing each other.
        const elbowX = gutterX - 28;
        const startX = Math.min(p.x + label.radius, elbowX - 8);
        const active = label.active;
        return (
          <g key={label.id} opacity={active ? 1 : 0.42}>
            <polyline
              points={`${startX},${p.y} ${elbowX},${p.y} ${gutterX},${label.y}`}
              fill="none"
              stroke={active ? accent : "currentColor"}
              strokeWidth={active ? 1.4 : 1}
              className={active ? "" : "text-mapo-cream/35"}
              strokeLinejoin="round"
            />
            <circle cx={startX} cy={p.y} r={active ? 3 : 2} fill={active ? accent : "currentColor"} className={active ? "" : "text-mapo-cream/40"} />
          </g>
        );
      })}
    </svg>
  );
}
