import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrolling } from "@/components/smooth-scrolling";
import { SubscriptionProvider } from "@/components/shared/subscription-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.indianbusinesskit.in"),
  title: "Indian Business Kit - India's 1st POS + ERP + CRM",
  description: "India’s first POS + ERP + CRM – fully in Hindi & English. Billing, GST, inventory, CRM, payroll – all on one app, with or without internet. Trusted by 100,000+ MSMEs since 2005.",
  keywords: ["POS", "ERP", "CRM", "Billing", "GST", "Inventory", "CRM", "Payroll", "MSME", "Hindi", "English", "Indian Business Kit"],
  openGraph: {
    title: "Indian Business Kit - India's 1st POS + ERP + CRM",
    description: "India’s first POS + ERP + CRM – fully in Hindi & English. Billing, GST, inventory, CRM, payroll – all on one app, with or without internet. Trusted by 100,000+ MSMEs since 2005.",
    url: "https://www.indianbusinesskit.in",
    siteName: "Indian Business Kit",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://www.indianbusinesskit.in/og-image.png",
        width: 1200,
        height: 630,
        alt: "Indian Business Kit - POS + ERP + CRM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Indian Business Kit - India's 1st POS + ERP + CRM",
    description: "India’s first POS + ERP + CRM – fully in Hindi & English. Billing, GST, inventory, CRM, payroll – all on one app, with or without internet. Trusted by 100,000+ MSMEs since 2005.",
    images: ["https://www.indianbusinesskit.in/og-image.png"],
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={{
        signIn: {
          start: {
            title: "Sign in to IBM",
            subtitle: "to continue to Business Management System",
          },
        },
        signUp: {
          start: {
            title: "Create your IBM account",
            subtitle: "to continue to Business Management System",
          },
        },
      }}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#18E299",
          fontSize: "1.1rem", // Properly scale all text
        },
        elements: {
          formButtonPrimary: "bg-[#18E299] hover:bg-[#15c586] text-black font-bold shadow-none",
          footerActionLink: "text-[#18E299] hover:text-[#15c586] font-semibold",
        }
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <SubscriptionProvider>
            <SmoothScrolling>{children}</SmoothScrolling>
          </SubscriptionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
