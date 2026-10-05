import { ClickSound } from "~/components/run/sfx/ClickSound";
import { HoverSound } from "~/components/run/sfx/HoverSound";

/**
 * What is heard on every page: a press on anything that can be pressed, a
 * knock on the cloth for a press on nothing, and a tick as a mouse comes onto
 * a control. Mounted once, in the root layout; two would tick twice.
 */
export function SoundRig() {
  return (
    <>
      <ClickSound />
      <HoverSound />
    </>
  );
}
