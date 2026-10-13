import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/** The typeface ecommercepark.eu uses. Self-hosted by Next, so no CDN call. */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FRI Hub",
  description:
    "Participant hub for the Future Retail Incubator at E-commerce Park of Scandinavia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="bg-paper text-ink flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
