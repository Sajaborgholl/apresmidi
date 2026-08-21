import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Après-midi — Digital Invitations",
  description: "Beautiful digital invitation websites for weddings, birthdays, and baptisms.",
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
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Dancing+Script:wght@400;500;600;700&family=Herr+Von+Muellerhoff&family=Permanent+Marker&family=Playfair+Display:wght@700;800&family=Poppins:wght@400;500;600;700&family=Quicksand:wght@500;600;700&family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
