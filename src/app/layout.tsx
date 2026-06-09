import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import FirebaseAnalytics from "@/components/firebase/FirebaseAnalytics";
import { Providers } from "./Providers";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

export const metadata: Metadata = {
 title: "International Delhi Public School - ERP Portal",
 description: "ERP Digital Portal for International Delhi Public School",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en">
 <body className={`${jost.variable} font-jost antialiased`}>
 <FirebaseAnalytics />
 <Providers>
 {children}
 </Providers>
 </body>
 </html>
 );
}
