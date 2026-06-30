import type { ScreenCapture } from '@roki/shared';

export function labelScreens(
  screens: ScreenCapture[],
  isMultiDisplay: boolean,
): ScreenCapture[] {
  return screens.map((screen, index) => {
    let label: string;
    if (!isMultiDisplay) {
      label = "user's screen (cursor is here)";
    } else if (screen.isCursorScreen) {
      label = `screen ${index + 1} of ${screens.length} — cursor is on this screen (primary focus)`;
    } else {
      label = `screen ${index + 1} of ${screens.length} — secondary screen`;
    }
    return { ...screen, label };
  });
}
