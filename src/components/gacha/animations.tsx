/**
 * Keyframes used by the summon reveal.
 *
 * `globals.css` belongs to Sprint 01, so the gacha animations ship as a tiny
 * style element rendered once by the Summon page instead.
 */
export function GachaAnimations() {
  return (
    <style>{`
      @keyframes gacha-pop {
        0%   { opacity: 0; transform: translateY(10px) scale(0.82); }
        55%  { opacity: 1; transform: translateY(0) scale(1.08); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes gacha-flash {
        0%   { opacity: 0.95; }
        100% { opacity: 0; }
      }
      @keyframes gacha-shine {
        0%, 100% { filter: brightness(1); }
        50%      { filter: brightness(1.35); }
      }
      .gacha-pop {
        animation: gacha-pop 260ms steps(6, end) both;
      }
      .gacha-flash {
        animation: gacha-flash 420ms ease-out both;
      }
      .gacha-legendary {
        animation: gacha-shine 1.4s steps(8, end) infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .gacha-pop, .gacha-flash, .gacha-legendary { animation: none; }
        .gacha-flash { opacity: 0; }
      }
    `}</style>
  );
}
