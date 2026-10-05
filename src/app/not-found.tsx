import type { Metadata } from "next";

import { PixelSprite } from "~/components/PixelSprite";
import { Board, TableLink } from "~/components/ui";

export const metadata: Metadata = { title: "Lost — HaduMon" };

export default function NotFound() {
  return (
    <div className="beside-tower">
      <Board className="max-w-xl">
        <div className="flex flex-col items-start gap-3">
          <span className="border-ink bg-ink text-cream border px-1.5 text-xs leading-5 font-black">
            404
          </span>
          <h1 className="text-print text-3xl sm:text-[40px]">
            This alley is empty.
          </h1>
          <PixelSprite catId="flameclaw" size={96} label="A lost cat" />
          <p className="text-base">
            The page you were looking for does not exist.
          </p>
          <TableLink href="/" variant="primary" className="mt-1">
            Back home
          </TableLink>
        </div>
      </Board>
    </div>
  );
}
