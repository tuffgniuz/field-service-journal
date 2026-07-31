import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const common = { fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function TabIcon({
  name,
  color,
  size = 22,
}: {
  name: 'log' | 'studies' | 'report' | 'profile';
  color: string;
  size?: number;
}) {
  if (name === 'log') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Circle cx={12} cy={12} r={8.5} />
        <Path d="M12 8v4l3 2" />
      </Svg>
    );
  }
  if (name === 'studies') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Circle cx={9} cy={8} r={3} />
        <Path d="M3.5 20c0-3.6 2.4-5.8 5.5-5.8s5.5 2.2 5.5 5.8" />
        <Circle cx={17} cy={8.8} r={2.2} opacity={0.55} />
        <Path d="M14.8 20c0-2.7 1.2-4.4 3.3-4.4s3.3 1.7 3.3 4.4" opacity={0.55} />
      </Svg>
    );
  }
  if (name === 'report') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Path d="M4 20L20 4" />
        <Path d="M20 4L13 20L10.5 13L4 10.5Z" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Circle cx={12} cy={8.5} r={3.6} />
      <Path d="M4.5 20.2c0-4.2 3.2-6.4 7.5-6.4s7.5 2.2 7.5 6.4" />
    </Svg>
  );
}

export function DarkModeIcon({ dark, color, size = 20 }: { dark: boolean; color: string; size?: number }) {
  if (dark) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Circle cx={12} cy={12} r={4.5} />
      <Path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </Svg>
  );
}

export function SettingsIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Path d="M4 6h9" />
      <Circle cx={16} cy={6} r={2.2} />
      <Path d="M4 12h3" />
      <Circle cx={10} cy={12} r={2.2} />
      <Path d="M15 12h5" />
      <Path d="M4 18h9" />
      <Circle cx={16} cy={18} r={2.2} />
    </Svg>
  );
}

export function CameraIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Path d="M4 8.5h3l1.5-2h7l1.5 2h3v11.5H4Z" />
      <Circle cx={12} cy={13.5} r={3.6} />
    </Svg>
  );
}

export type ShareChannel = 'whatsapp' | 'telegram' | 'sms' | 'email';

export function ShareIcon({ name, color, size = 20 }: { name: ShareChannel; color: string; size?: number }) {
  if (name === 'whatsapp') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Path d="M7 17l-1.2 3.4L9.4 19A8 8 0 1 0 4 12a7.9 7.9 0 0 0 1 3.9L7 17ZM9 9.3c.2-.5.5-.5.8-.5h.6c.2 0 .4 0 .6.5s.6 1.6.7 1.7c.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.2.7.2.4 1 1.5 2.1 2.2 1.5 1 2.1 1 2.5.9.3-.1.6-.6.8-.9.2-.2.4-.3.6-.2l1.5.8c.2.1.4.2.4.4 0 .8-.3 1.7-1.5 2-1 .3-2.3.3-4.4-.8-2.6-1.3-4.3-3.8-4.5-4.1-.2-.3-1.3-1.8-1.3-3.3 0-1.5.8-2.2 1.1-2.6Z" />
      </Svg>
    );
  }
  if (name === 'telegram') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Circle cx={12} cy={12} r={8.5} />
        <Path d="M7.2 12.1l9-3.3-2.4 8.6-2.9-2.2-1.9 1.8-.3-3 6.2-4.7-7.5 4.1Z" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (name === 'sms') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Path d="M4 5.5h16v10H9l-3.5 3v-3H4Z" />
        <Path d="M8 10h8M8 13h5" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Path d="M3.5 5.5h17v13h-17Z" />
      <Path d="M4 6.5l8 6 8-6" />
    </Svg>
  );
}
