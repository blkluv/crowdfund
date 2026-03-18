"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-32 md:pt-40 md:pb-48">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/20 to-secondary/20" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-foreground via-primary via-[30%] to-secondary bg-clip-text text-transparent leading-tight mb-8"
          >
            Crowdfunding <br className="md:hidden" />
            <span className="text-primary">Reimagined</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl lg:text-3xl text-muted-foreground/90 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Multi-model funding. Global reach. Enterprise security. 
            <br />Everything creators need to succeed.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button asChild size="lg" className="px-8 h-14 text-lg font-semibold shadow-2xl">
              <Link href="/campaigns">
                Explore Campaigns
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 h-14 text-lg font-semibold">
              <Link href="/creators">
                Start a Project
              </Link>
            </Button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap gap-6 justify-center mt-20 pt-12 border-t border-muted/50"
          >
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Multi-model funding (AON/KIA)
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Stripe + Global payments
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Enterprise security
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-1/2 right-10 w-72 h-72 bg-primary/5 rounded-3xl -rotate-12 hidden lg:block animate-pulse" />
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-xl animate-pulse hidden xl:block" />
    </section>
  )
}

