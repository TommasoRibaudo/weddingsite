'use client';
import Image from 'next/image';

type Props = {
  name: string;
  photoUrl: string | null;
  size?: number;
  className?: string;
};

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export default function GuestAvatar({ name, photoUrl, size = 32, className = '' }: Props) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.35) };

  if (photoUrl) {
    return (
      <div
        className={`shrink-0 overflow-hidden rounded-full bg-green-pale ${className}`}
        style={style}
      >
        <Image
          src={photoUrl}
          alt={name}
          width={size}
          height={size}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 flex items-center justify-center rounded-full bg-green-pale text-green font-body font-semibold select-none ${className}`}
      style={style}
    >
      {initials(name)}
    </div>
  );
}
