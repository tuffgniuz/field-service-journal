import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const common = { fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function TabIcon({
  name,
  color,
  size = 22,
}: {
  name: 'log' | 'studies' | 'schedule' | 'report' | 'profile';
  color: string;
  size?: number;
}) {
  if (name === 'schedule') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Path d="M4 5h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        <Path d="M16 3v4M8 3v4M3 10h18" />
      </Svg>
    );
  }
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

export function EditIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Path d="M17 3l4 4L9 19l-4.5 1.5L6 16z" />
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

export function ClockIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 7.5v5l3.2 2" />
    </Svg>
  );
}

export function PartnerIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Circle cx={9} cy={8.5} r={2.6} />
      <Path d="M4.5 18.5c0-3.2 1.9-5 4.5-5s4.5 1.8 4.5 5" />
      <Circle cx={16.2} cy={9.2} r={2.1} opacity={0.65} />
      <Path d="M13.7 18.5c0-2.4 1.2-3.9 3.2-3.9 1.6 0 2.8 1 3.3 2.7" opacity={0.65} />
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

export function CalendarIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Path d="M4 5h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      <Path d="M16 3v4M8 3v4M3 10h18" />
    </Svg>
  );
}

export function TrashIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  );
}

export function CheckIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color} strokeWidth={2.4}>
      <Path d="M5 13l4 4L19 7" />
    </Svg>
  );
}

export function ActivityTypeIcon({
  type,
  color,
  size = 16,
}: {
  type: 'field_service' | 'bible_study' | 'return_visit' | 'cart' | 'street' | 'other';
  color: string;
  size?: number;
}) {
  if (type === 'field_service') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Path d="M5 6h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
        <Path d="M8 4v4M16 4v4M4 10h16" />
        <Path d="M8 14h3M13 14h3M8 17h5" />
      </Svg>
    );
  }
  if (type === 'bible_study') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Path d="M12 6.5C10 5 7 4.7 4 5.4v13c3-0.7 6-0.4 8 1.1 2-1.5 5-1.8 8-1.1v-13c-3-0.7-6-0.4-8 1.1Z" />
        <Path d="M12 6.5v13" />
      </Svg>
    );
  }
  if (type === 'return_visit') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Path d="M6 3.5h9a1 1 0 0 1 1 1V20H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
        <Circle cx={12.5} cy={12} r={0.8} fill={color} />
      </Svg>
    );
  }
  if (type === 'cart') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.8h7.2a2 2 0 0 0 2-1.6L20.5 9H6" />
        <Circle cx={10} cy={20} r={1.3} />
        <Circle cx={17} cy={20} r={1.3} />
      </Svg>
    );
  }
  if (type === 'street') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
        <Path d="M6 21V3" />
        <Path d="M6 5h12l-2.5 3.5L18 12H6" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Circle cx={6} cy={12} r={1.3} fill={color} />
      <Circle cx={12} cy={12} r={1.3} fill={color} />
      <Circle cx={18} cy={12} r={1.3} fill={color} />
    </Svg>
  );
}
