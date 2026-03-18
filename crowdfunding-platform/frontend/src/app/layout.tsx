import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Providers from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CrowdFund Pro - Advanced Crowdfunding Platform",
  description: "Multi-model funding with AON/KIA/milestones, Stripe payments, global support, real-time updates",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)] pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  )
}

