import type { ReactNode } from "react";

function icon(path: ReactNode) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {path}
    </svg>
  );
}

export const appIcons = {
  brand: icon(
    <>
      <rect x="4" y="4.5" width="16" height="15" rx="1.5" />
      <path d="M9 4.5v15" />
    </>,
  ),
  dashboard: icon(
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </>,
  ),
  chief: icon(
    <>
      <path d="M12 4.5l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z" />
      <path d="M18 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>,
  ),
  books: icon(
    <>
      <path d="M5 5.5a2 2 0 0 1 2-2h11v15.5H8a3 3 0 0 0-3 3z" />
      <path d="M7 3.5v15.5" />
      <path d="M8 19h10" />
    </>,
  ),
  materials: icon(
    <>
      <path d="M12 4.5l8 4.5-8 4.5-8-4.5z" />
      <path d="M4 14.5l8 4.5 8-4.5" />
      <path d="M4 9l8 4.5 8-4.5" />
    </>
  ),
  automation: icon(
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
      <path d="M16.5 14.5l1.2 1.2 2.3-2.8" />
    </>
  ),
  settings: icon(
    <>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="M19.1 12a7.7 7.7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8.3 8.3 0 0 0-1.7-1l-.4-2.5h-4l-.4 2.5a8.3 8.3 0 0 0-1.7 1L5 6l-2 3.5 2 1.5a7.7 7.7 0 0 0-.1 1c0 .3 0 .7.1 1l-2 1.5 2 3.5 2.4-1a8.3 8.3 0 0 0 1.7 1l.4 2.5h4l.4-2.5a8.3 8.3 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1Z" />
    </>
  ),
  themeLight: icon(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v3" />
      <path d="M12 18.5v3" />
      <path d="M4.9 4.9l2.1 2.1" />
      <path d="M17 17l2.1 2.1" />
      <path d="M2.5 12h3" />
      <path d="M18.5 12h3" />
      <path d="M4.9 19.1l2.1-2.1" />
      <path d="M17 7l2.1-2.1" />
    </>,
  ),
  themeDark: icon(<path d="M20 15.5A8.5 8.5 0 1 1 8.5 4 7 7 0 0 0 20 15.5z" />),
};
