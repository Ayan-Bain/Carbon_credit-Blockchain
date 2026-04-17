'use client';

import { useEffect, useRef } from 'react';
import { colors } from '@/lib/design-tokens';

interface DistributionItem {
  label: string;
  percentage: number;
  color: string;
}

interface AssetDistributionProps {
  distribution: DistributionItem[];
}

export default function AssetDistribution({ distribution }: AssetDistributionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || distribution.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    const size = 192;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) * 0.75;

    // Draw pie chart
    let currentAngle = -Math.PI / 2;

    distribution.forEach((item) => {
      const sliceAngle = (item.percentage / 100) * 2 * Math.PI;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      currentAngle += sliceAngle;
    });

    // Draw center circle (donut hole)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
  }, [distribution]);

  const totalProjects = distribution.length;

  return (
    <div className="rounded-lg bg-white p-8 shadow-lg">
      {/* Header */}
      <h3
        className="text-lg font-extrabold mb-6"
        style={{ color: colors.primary.darkest }}
      >
        Asset Distribution
      </h3>

      {/* Chart */}
      <div className="flex justify-center mb-6">
        <div className="relative w-48 h-48">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p
              className="text-3xl font-bold"
              style={{ color: colors.primary.darkest }}
            >
              {totalProjects}
            </p>
            <p
              className="text-xs font-semibold uppercase"
              style={{ color: colors.text.medium }}
            >
              Projects
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {distribution.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: colors.primary.darkest }}
              >
                {item.label}
              </p>
            </div>
            <p
              className="text-sm font-semibold"
              style={{ color: colors.primary.darkest }}
            >
              {item.percentage}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
