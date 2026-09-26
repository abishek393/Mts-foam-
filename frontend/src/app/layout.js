import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

// Only the document shell lives here. The public site's header, footer and
// providers are in (site)/layout.js so that /admin can render its own chrome
// without the marketing navigation wrapped around every table.

// The document's serif display face, with a sans for body copy.
const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: `${SITE.fullName} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
