import { useState } from 'react';
import { cn } from '../../lib/utils';

export function ExposureSimulator() {
  const [aperture, setAperture] = useState(4); // f/1.4 index
  const [shutter, setShutter] = useState(6); // 1/250s index
  const [iso, setIso] = useState(1); // ISO 100 index

  const apertureValues = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
  const shutterValues = ['1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125', '1/60', '1/30', '1/15', '1s'];
  const isoValues = [100, 200, 400, 800, 1600, 3200, 6400];

  // Calculate exposure (simplified)
  const apertureEv = -2 * Math.log2(apertureValues[aperture]);
  const shutterEv = shutter < shutterValues.length - 1
    ? Math.log2(parseFloat(shutterValues[shutter]) || 250)
    : 0;
  const isoEv = Math.log2(isoValues[iso] / 100);

  // Total exposure (higher = brighter)
  const totalEv = apertureEv + shutterEv + isoEv;
  // Normalize to 0-100 (0 = very dark, 50 = correct, 100 = very bright)
  const exposureLevel = Math.max(0, Math.min(100, 50 + totalEv * 10));

  const brightness = Math.round(20 + (exposureLevel / 100) * 80);

  const getExposureStatus = () => {
    if (exposureLevel >= 40 && exposureLevel <= 60) return { label: '曝光正常', color: 'text-success' };
    if (exposureLevel < 25) return { label: '严重欠曝', color: 'text-error' };
    if (exposureLevel < 40) return { label: '略微欠曝', color: 'text-warning' };
    if (exposureLevel > 75) return { label: '严重过曝', color: 'text-error' };
    return { label: '略微过曝', color: 'text-warning' };
  };

  const status = getExposureStatus();

  // Depth of field indicator
  const dofPercent = Math.round(20 + aperture * 9);

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
      <h3 className="text-xl font-bold text-text-primary mb-2">曝光模拟器</h3>
      <p className="text-sm text-text-muted mb-8">拖动滑块调整参数，观察曝光和景深的变化</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview */}
        <div className="relative">
          <div
            className="aspect-[4/3] rounded-xl overflow-hidden relative transition-all duration-300"
            style={{ backgroundColor: `hsl(210, ${brightness * 0.3}%, ${Math.max(5, brightness * 0.7)}%)` }}
          >
            {/* Scene elements */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Mountains */}
              <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 400 160" className="w-full" style={{ opacity: Math.min(1, brightness / 60) }}>
                  <polygon points="0,160 80,60 160,160" fill={`hsl(210, 10%, ${brightness * 0.4}%)`} />
                  <polygon points="100,160 200,40 300,160" fill={`hsl(210, 10%, ${brightness * 0.35}%)`} />
                  <polygon points="250,160 350,70 400,160" fill={`hsl(210, 10%, ${brightness * 0.45}%)`} />
                </svg>
              </div>

              {/* Sun */}
              <div
                className="absolute top-6 right-8 w-12 h-12 rounded-full"
                style={{
                  backgroundColor: `hsl(45, 100%, ${Math.min(95, brightness * 1.2)}%)`,
                  boxShadow: `0 0 ${brightness}px ${brightness / 3}px hsla(45, 100%, 70%, ${brightness / 200})`,
                  opacity: Math.min(1, brightness / 40),
                }}
              />

              {/* Text overlay */}
              <div className="relative z-10 text-center mt-4">
                <div
                  className="text-3xl font-bold"
                  style={{ color: `hsl(0, 0%, ${Math.min(95, brightness * 1.1)}%)` }}
                >
                  {brightness < 15 ? '太暗了...' : brightness > 85 ? '过曝了!' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Exposure meter */}
          <div className="mt-4 bg-surface-hover rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">曝光指示</span>
              <span className={cn('text-sm font-semibold', status.color)}>{status.label}</span>
            </div>
            <div className="relative h-3 bg-background rounded-full overflow-hidden">
              {/* Meter scale */}
              <div className="absolute inset-0 flex">
                <div className="w-[40%] bg-gradient-to-r from-red-900/40 to-yellow-900/30" />
                <div className="w-[20%] bg-green-900/40" />
                <div className="w-[40%] bg-gradient-to-r from-yellow-900/30 to-red-900/40" />
              </div>
              {/* Indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-text-primary shadow-lg transition-all duration-200"
                style={{ left: `calc(${exposureLevel}% - 8px)` }}
              />
              {/* Center mark */}
              <div className="absolute top-0 left-[50%] w-0.5 h-full bg-white/40" />
            </div>

            {/* DOF indicator */}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-text-muted w-16">景深范围</span>
              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/50 rounded-full transition-all duration-300"
                  style={{ width: `${dofPercent}%` }}
                />
              </div>
              <span className="text-xs text-text-muted">
                {apertureValues[aperture] <= 2.8 ? '浅' : apertureValues[aperture] <= 8 ? '中等' : '深'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-8">
          {/* Aperture */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-text-primary">
                光圈 <span className="text-text-muted font-normal">(Aperture)</span>
              </label>
              <span className="text-lg font-bold text-primary tabular-nums">
                f/{apertureValues[aperture]}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={apertureValues.length - 1}
              value={aperture}
              onChange={(e) => setAperture(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>f/1.4 (大光圈)</span>
              <span>f/22 (小光圈)</span>
            </div>
            <p className="text-xs text-text-muted mt-2">
              大光圈 → 进光多、背景虚化 &nbsp;|&nbsp; 小光圈 → 进光少、全清晰
            </p>
          </div>

          {/* Shutter Speed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-text-primary">
                快门速度 <span className="text-text-muted font-normal">(Shutter)</span>
              </label>
              <span className="text-lg font-bold text-primary tabular-nums">
                {shutterValues[shutter]}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={shutterValues.length - 1}
              value={shutter}
              onChange={(e) => setShutter(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>1/4000s (快)</span>
              <span>1s (慢)</span>
            </div>
            <p className="text-xs text-text-muted mt-2">
              快门快 → 冻结瞬间 &nbsp;|&nbsp; 快门慢 → 运动模糊、进光多
            </p>
          </div>

          {/* ISO */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-text-primary">
                感光度 <span className="text-text-muted font-normal">(ISO)</span>
              </label>
              <span className="text-lg font-bold text-primary tabular-nums">
                ISO {isoValues[iso]}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={isoValues.length - 1}
              value={iso}
              onChange={(e) => setIso(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>ISO 100 (干净)</span>
              <span>ISO 6400 (噪点多)</span>
            </div>
            {/* Noise indicator */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-text-muted">噪点程度</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'w-4 h-2 rounded-full transition-colors',
                      iso >= level * 1.2 ? 'bg-yellow-500' : 'bg-border'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
