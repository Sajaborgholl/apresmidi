import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Après-midi — Digital Invitations",
  description: "Beautiful digital invitation websites for weddings, birthdays, and bachelorette parties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,700;0,800;1,400&family=Caveat:wght@600;700&family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Dancing+Script:wght@400;500;600;700&family=Fraunces:ital,wght@0,600;0,700;1,500&family=Permanent+Marker&family=Playfair+Display:wght@700;800&family=Poppins:wght@400;500;600;700&family=Quicksand:wght@500;600;700&family=Space+Grotesk:wght@500;700&family=Yellowtail&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
