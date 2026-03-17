import "./globals.css";
import { AppShell } from "../components/chrome/app-shell";
import { ConnectionStatusProvider } from "../lib/connection-status";

export const metadata = {
  title: "InkOS",
  description: "InkOS v3 workbench",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ConnectionStatusProvider>
          <AppShell>{children}</AppShell>
        </ConnectionStatusProvider>
      </body>
    </html>
  );
}
