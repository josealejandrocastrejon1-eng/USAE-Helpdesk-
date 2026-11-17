import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { USAE_OFFICIAL_LOGO_URL } from '../utils/helpdesk';

interface BrandLogoProps {
  compact?: boolean;
  darkBackground?: boolean;
}

export function BrandLogo({ compact = false, darkBackground = false }: BrandLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <span className="inline-flex items-center gap-2.5 shrink-0">
      {!imgFailed ? (
        <img
          src={USAE_OFFICIAL_LOGO_URL}
          alt="Logo USAE"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className={`${
            compact ? 'h-9 w-auto max-w-[116px]' : 'h-11 w-auto max-w-[160px]'
          } object-contain rounded bg-white px-1 py-0.5 border border-slate-200 shrink-0`}
        />
      ) : (
        <span
          className={`inline-flex items-center justify-center rounded-lg shrink-0 ${
            compact ? 'h-8 w-8' : 'h-10 w-10'
          } bg-blue-700 text-white`}
        >
          <ShieldCheck className="w-5 h-5" aria-hidden="true" />
        </span>
      )}
      <span
        className={`font-display font-bold tracking-tight whitespace-nowrap ${
          compact ? 'text-base sm:text-lg' : 'text-lg'
        } ${darkBackground ? 'text-white' : 'text-slate-900'}`}
      >
        USAE Helpdesk
      </span>
    </span>
  );
}
