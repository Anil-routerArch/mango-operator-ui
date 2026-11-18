import React from 'react';
import { Box } from '@chakra-ui/react';
import { themeColors } from '@/theme';

export interface DeviceSparklineProps {
  data: number[];
  width?: number | string;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  showPoints?: boolean;
}

/**
 * Lightweight, zero-dependency SVG sparkline component.
 * Ideal for displaying mini trend lines in CPU, Memory, and Throughput cards.
 */
export const DeviceSparkline: React.FC<DeviceSparklineProps> = ({
  data,
  width = '100%',
  height = 36,
  strokeColor = themeColors.brand.accent,
  fillColor = 'rgba(8, 105, 255, 0.08)',
  strokeWidth = 1.8,
  showPoints = false,
}) => {
  if (!data || data.length < 2) {
    return (
      <Box w={width} h={`${height}px`} bg="rgba(0,0,0,0.02)" borderRadius="4px" />
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const paddingY = 4;
  const graphH = height - paddingY * 2;
  const svgWidth = 120; // Internal SVG coordinate space

  // Generate coordinate points
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * svgWidth;
    const y = paddingY + graphH - ((val - min) / range) * graphH;
    return { x, y };
  });

  // Construct SVG cubic bezier curve or line path
  const linePath = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1];
    const cpX1 = prev.x + (pt.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (pt.x - prev.x) / 2;
    const cpY2 = pt.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y}`;
  }, '');

  // Fill area path closing down to bottom
  const areaPath = `${linePath} L ${svgWidth} ${height} L 0 ${height} Z`;

  return (
    <Box w={width} h={`${height}px`} overflow="hidden">
      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={`sparkline-grad-${strokeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={fillColor || `url(#sparkline-grad-${strokeColor.replace('#', '')})`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showPoints &&
          points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={2}
              fill="#fff"
              stroke={strokeColor}
              strokeWidth={1.5}
            />
          ))}
      </svg>
    </Box>
  );
};

export default DeviceSparkline;

