import type { Metadata } from "next";
import { Big_Shoulders, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

// Condensed industrial display face drawn for the City of Chicago. The optical
// size axis is loaded so headlines can be set at the display end (see the
// .font-display rule in globals.css) rather than scaled up from a text cut.
const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  axes: ["opsz"],
  // next/font has no metric overrides for this family, so it can't synthesise a
  // matched fallback. Name condensed faces explicitly — swapping a very
  // condensed display face against a normal-width fallback reflows headlines.
  fallback: ["Arial Narrow", "Helvetica Neue", "sans-serif"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Chicago Pothole Tracker",
  description:
    "Chicago says it fixes a pothole in seven days. This tracks what actually happens, ward by ward, from the city's own 311 data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bigShoulders.variable} ${plexSans.variable} ${plexMono.variable} antialiased`}
    >
      <body className="bg-asphalt text-paint">
        <Header />
        {children}
      </body>
    </html>
  );
}
