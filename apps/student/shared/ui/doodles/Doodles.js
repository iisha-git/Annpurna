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

export function DoodleCarrot({ size = 24, color = '#FF9D00', strokeWidth = 2.4 }) {
  const s = strokeProps(color, strokeWidth);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* tapered root */}
      <Path d="M27 15c6 2 10 8 8 13L15 39c-4-4-2-13 4-19 2.4-2.4 5-5.4 8-5z" {...s} />
      {/* ridges */}
      <Path d="M21.5 26.5l5.5 2.2" {...s} />
      <Path d="M17.5 31.5l5.5 2.2" {...s} />
      {/* greens */}
      <Path d="M30 13c1-4 4-6 8-6-1 4-4 6-8 6z" {...s} />
      <Path d="M33 15c3-2 6-2 9 0-3 2.5-6.5 2.5-9 0z" {...s} />
    </Svg>
  );
}

export function DoodleApple({ size = 24, color = '#E8837A', strokeWidth = 2.4 }) {
  const s = strokeProps(color, strokeWidth);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* body */}
      <Path d="M24 16c-4.5-4-12-2-13.5 4.5C9 27 13.5 37 20 39c2.6.8 5.4.8 8 0 6.5-2 11-12 9.5-18.5C36 14 28.5 12 24 16z" {...s} />
      {/* stem */}
      <Path d="M24 15c-.5-3 .5-5 2.5-7" {...s} />
      {/* leaf */}
      <Path d="M26.5 8.5c3-1.5 6-1 8 1.5-2.8 1.8-5.8 1.8-8-1.5z" {...s} />
    </Svg>
  );
}

export function DoodleLeaf({ size = 24, color = '#9BC98F', strokeWidth = 2.4 }) {
  const s = strokeProps(color, strokeWidth);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* blade */}
      <Path d="M10 38C8 24 18 10 38 9c1.5 20-11 30.5-25.5 29.5z" {...s} />
      {/* vein */}
      <Path d="M12.5 35.5C20 27 28 20 35 13" {...s} />
    </Svg>
  );
}

export function DoodleBroccoli({ size = 24, color = '#9BC98F', strokeWidth = 2.4 }) {
  const s = strokeProps(color, strokeWidth);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* fluffy crown */}
      <Path d="M14 22a5.5 5.5 0 0 1 3-9 6 6 0 0 1 11-2.5A5.5 5.5 0 0 1 34 21" {...s} />
      <Path d="M13 22.5h22" {...s} />
      {/* stem */}
      <Path d="M20 22.5V29c0 2 1.5 3.5 4 3.5s4-1.5 4-3.5v-6.5" {...s} />
      {/* floret dots */}
      <Path d="M19 15.5h.01" {...s} />
      <Path d="M25 12.5h.01" {...s} />
      <Path d="M30 15.5h.01" {...s} />
    </Svg>
  );
}

export function DoodleCherries({ size = 24, color = '#F2A09B', strokeWidth = 2.4 }) {
  const s = strokeProps(color, strokeWidth);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* stems meeting at top */}
      <Path d="M17 27C16 20 19 13 26 9c1 6-1 12-6 18" {...s} />
      <Path d="M33 28c2-7 0-13-7-19" {...s} />
      {/* fruit */}
      <Path d="M17 30a6 6 0 1 1-8 6 6.2 6.2 0 0 1 8-6z" {...s} />
      <Path d="M35 31a6 6 0 1 1-8 6 6.2 6.2 0 0 1 8-6z" {...s} />
    </Svg>
  );
}
