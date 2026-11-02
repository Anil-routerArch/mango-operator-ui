import React from 'react';
import { Box } from '@chakra-ui/react';
import { DeviceCard } from '@/pages/Devices/components/common';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceAvailabilityCardProps {
  device: UnifiedFleetDevice;
}

export const DeviceAvailabilityCard: React.FC<DeviceAvailabilityCardProps> = ({ device }) => {
  const isConnected = !!device.connected;

  // Timestamps across 24h
  const timeLabels = [
    '12:00', '14:00', '16:00', '18:00', '20:00', '22:00',
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00',
  ];

  // SVG coordinate dimensions
  const svgW = 600;
  const svgH = 140;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 15;
  const padBottom = 25;
  const plotW = svgW - padLeft - padRight;
  const plotH = svgH - padTop - padBottom;

  // Availability curve: if offline, drops at ~80% of width
  // If online, remains 100%
  const dropX = padLeft + plotW * 0.82;
  const dropY = padTop + plotH; // 0%
  const normalY = padTop; // 100%

  const pathD = isConnected
    ? `M ${padLeft} ${normalY} L ${padLeft + plotW} ${normalY}`
    : `M ${padLeft} ${normalY} L ${dropX - 30} ${normalY} C ${dropX - 10} ${normalY}, ${dropX - 5} ${dropY}, ${dropX} ${dropY} L ${padLeft + plotW} ${dropY}`;

  return (
    <DeviceCard title="Availability — Last 24 Hours" minH="220px">
      <Box w="100%" h="170px" position="relative">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
        >
          {/* Horizontal Grid Lines */}
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
            const y = padTop + plotH * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={ratio === 0 ? 'none' : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="sans-serif"
                >
                  {Math.round(ratio * 100)}%
                </text>
              </g>
            );
          })}

          {/* Availability Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Offline drop marker */}
          {!isConnected && (
            <g>
              <circle
                cx={dropX}
                cy={dropY}
                r="4.5"
                fill="#dc2626"
                stroke="#fff"
                strokeWidth="2"
              />
              <rect
                x={dropX + 8}
                y={dropY - 18}
                width="84"
                height="20"
                rx="4"
                fill="#fff"
                stroke="#fca5a5"
                strokeWidth="1"
              />
              <text
                x={dropX + 50}
                y={dropY - 5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#dc2626"
                fontFamily="sans-serif"
              >
                Offline · 8 min
              </text>
            </g>
          )}

          {/* X Axis Time Labels */}
          {timeLabels.map((lbl, idx) => {
            const x = padLeft + (idx / (timeLabels.length - 1)) * plotW;
            return (
              <text
                key={idx}
                x={x}
                y={svgH - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="sans-serif"
              >
                {lbl}
              </text>
            );
          })}
        </svg>
      </Box>
    </DeviceCard>
  );
};

export default DeviceAvailabilityCard;

