import Image from 'next/image';
import logoHorizontal from '../logo-1.png';
import logoStacked from '../logo-2.png';

type BrandLogoProps = {
  variant?: 'horizontal' | 'stacked';
  className?: string;
  decorative?: boolean;
  priority?: boolean;
};

export function BrandLogo({
  variant = 'horizontal',
  className = '',
  decorative = false,
  priority = false,
}: BrandLogoProps) {
  const src = variant === 'horizontal' ? logoHorizontal : logoStacked;
  const alt = decorative ? '' : 'oops.ninja';
  const classes = ['brand-logo', `brand-logo--${variant}`, className].filter(Boolean).join(' ');

  return <Image src={src} alt={alt} className={classes} priority={priority} />;
}
