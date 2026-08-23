import Svg, { Path } from 'react-native-svg';

import { colors } from '@/shared/theme/tokens';

/**
 * Hand-drawn doodle pack — stroke-only SVGs with wobbly paths and round
 * caps so nothing looks machine-stamped. All accept `color` so they
 * recolor to match their context.
 *
 * Drawn in a 48x48 viewBox; scale freely via `size`.
 */

const strokeProps = (color, strokeWidth) => ({
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
});

export function DoodleBowl({ size = 24, color = colors.accent, strokeWidth = 2.4 }) {
  const s = strokeProps(color, strokeWidth);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* rim */}
      <Path d="M5.5 24.6c6.1-1.4 12.3-1.9 18.5-1.9s12.4.5 18.5 1.9" {...s} />
      {/* body */}
      <Path d="M7 26c.2 3.4 1 6.6 2.8 9.3C12.7 39.8 17.9 43 24 43s11.3-3.2 14.2-7.7c1.8-2.7 2.6-5.9 2.8-9.3" {...s} />
      {/* foot */}
      <Path d="M18.5 43.5h11" {...s} />
      {/* steam squiggles */}
      <Path d="M17.5 5.5c2.3 2.2-2.4 4.6-.1 7.2" {...s} />
      <Path d="M25.5 3.5c2.5 2.4-2.7 5.1-.2 8" {...s} />
    </Svg>
  );
}

export function DoodleFlame({ size = 24, color = colors.accent, strokeWidth = 2.4 }) {
  const s = strokeProps(color, strokeWidth);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* outer flame */}
      <Path
        d="M24 4.5c1.2 5.8 8.5 9.2 8.5 17a8.5 8.5 0 1 1-17 0c0-3.1 1.3-5.2 2.7-7.3C20 11.6 22.9 9 24 4.5z"
        {...s}
      />
      {/* inner flame */}
      <Path
        d="M24 23c.7 2.3 3.2 3.4 3.2 5.8a3.2 3.2 0 1 1-6.4 0c0-2.4 2.5-3.5 3.2-5.8z"
        {...s}
      />
    </Svg>
  );
}

export function DoodleSparkles({ size = 24, color = colors.accent, strokeWidth = 2.4 }) {
  const s = strokeProps(color, strokeWidth);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* big sparkle */}
      <Path d="M30 6l2.2 6.3L38.5 15l-6.3 2.2L30 23.5l-2.2-6.3L21.5 15l6.3-2.7L30 6z" {...s} />
      {/* small sparkle */}
      <Path d="M13 27l1.4 4 4 1.4-4 1.4L13 38l-1.4-4.2-4-1.4 4-1.4L13 27z" {...s} />
      {/* dot accents */}
      <Path d="M36.5 33.5v5" {...s} />
      <Path d="M34 36h5" {...s} />
    </Svg>
  );
}
