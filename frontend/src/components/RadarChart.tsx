import { useMemo } from 'react';

export interface TraitScore {
  trait: string;
  value: number; // 0 to 100
  fullMark?: number;
}

interface RadarChartProps {
  data: TraitScore[];
  width?: number;
  height?: number;
}

export default function RadarChart({ data, width = 450, height = 380 }: RadarChartProps) {
  const size = Math.min(width, height);
  const radius = (size / 2) - 65; // Leaving room for label text
  const centerX = width / 2;
  const centerY = height / 2;

  const count = data.length;

  // Calculate coordinates for vertices at a given radius multiplier (0..1)
  const getCoordinates = (index: number, valRatio: number) => {
    // Angle offset so the top vertex points straight up (-PI/2)
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = radius * Math.max(0, Math.min(1, valRatio));
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y };
  };

  // Concentric grid rings (20%, 40%, 60%, 80%, 100%)
  const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const ringPolygons = useMemo(() => {
    return gridRings.map((ringRatio) => {
      const points = data
        .map((_, i) => {
          const { x, y } = getCoordinates(i, ringRatio);
          return `${x},${y}`;
        })
        .join(' ');
      return { ratio: ringRatio, points };
    });
  }, [data, radius, centerX, centerY]);

  // Data Polygon points
  const dataPolygonPoints = useMemo(() => {
    return data
      .map((item, i) => {
        const ratio = (item.value || 0) / (item.fullMark || 100);
        const { x, y } = getCoordinates(i, ratio);
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, radius, centerX, centerY]);

  // Vertex Points for glowing nodes
  const vertexNodes = useMemo(() => {
    return data.map((item, i) => {
      const ratio = (item.value || 0) / (item.fullMark || 100);
      const { x, y } = getCoordinates(i, ratio);
      return { ...item, x, y };
    });
  }, [data, radius, centerX, centerY]);

  // Outer Label Locations
  const labelLocations = useMemo(() => {
    return data.map((item, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const labelRadius = radius + 32;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      return { trait: item.trait, value: item.value, x, y };
    });
  }, [data, radius, centerX, centerY]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none font-sans">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <radialGradient id="radarAreaGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </radialGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Background Grid Concentric Polygons */}
        {ringPolygons.map((ring, idx) => (
          <polygon
            key={idx}
            points={ring.points}
            className="fill-none stroke-slate-800/80"
            strokeWidth={idx === ringPolygons.length - 1 ? '1.5' : '1'}
            strokeDasharray={idx < ringPolygons.length - 1 ? '3 3' : undefined}
          />
        ))}

        {/* 2. Radial Axis Spokes from Center to Outer Vertices */}
        {data.map((_, i) => {
          const outerCoord = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={outerCoord.x}
              y2={outerCoord.y}
              className="stroke-slate-800/90"
              strokeWidth="1"
            />
          );
        })}

        {/* 3. Filled Trait Polygon */}
        <polygon
          points={dataPolygonPoints}
          fill="url(#radarAreaGradient)"
          stroke="#c084fc"
          strokeWidth="2.5"
          filter="url(#glowEffect)"
          className="transition-all duration-700 ease-out"
        />

        {/* 4. Glowing Vertex Nodes */}
        {vertexNodes.map((node, i) => (
          <g key={i}>
            <circle
              cx={node.x}
              cy={node.y}
              r="6"
              className="fill-purple-400 stroke-slate-950"
              strokeWidth="2"
            />
            <circle
              cx={node.x}
              cy={node.y}
              r="10"
              className="fill-purple-500/30 animate-ping"
            />
          </g>
        ))}

        {/* 5. Axis Trait Labels */}
        {labelLocations.map((lbl, i) => {
          // Adjust text anchor according to x placement
          let textAnchor: 'middle' | 'start' | 'end' = 'middle';
          if (lbl.x > centerX + 15) textAnchor = 'start';
          if (lbl.x < centerX - 15) textAnchor = 'end';

          return (
            <g key={i} transform={`translate(${lbl.x}, ${lbl.y})`}>
              <text
                textAnchor={textAnchor}
                dy="0.3em"
                className="fill-slate-200 text-[11px] font-bold tracking-tight"
              >
                {lbl.trait}
              </text>
              <text
                textAnchor={textAnchor}
                dy="1.6em"
                className="fill-purple-400 text-[10px] font-extrabold"
              >
                {lbl.value}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
