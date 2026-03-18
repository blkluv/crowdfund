 "use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn, User, Heart, Search, Bell } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto h-16 px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" />
          <span className="font-bold bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent text-xl tracking-tight">
            CrowdFund Pro
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/campaigns" className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors">
            Campaigns
          </Link>
          <Link href="/creators" className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors">
            For Creators
          </Link>
          <Link href="/about" className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors">
            About
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/login">Back this project</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/creators">Start project</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden h-9 w-9 p-0"
            onClick={() => setIsOpen(!isOpen)}
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-background"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <Link href="/campaigns" className="py-2 text-lg font-medium" onClick={() => setIsOpen(false)}>
                Campaigns
              </Link>
              <Link href="/creators" className="py-2 text-lg font-medium" onClick={() => setIsOpen(false)}>
                For Creators
              </Link>
              <Link href="/about" className="py-2 text-lg font-medium" onClick={() => setIsOpen(false)}>
                About
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

