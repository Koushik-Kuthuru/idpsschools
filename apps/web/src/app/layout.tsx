import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

export const metadata: Metadata = {
 title: "International Delhi Public School - ERP Portal",
 description: "ERP Digital Portal for International Delhi Public School",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#144835",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en">
 <body className={`${jost.variable} font-jost antialiased`}>
 <Providers>
 {children}
 </Providers>
 </body>
 </html>
 );
}
