"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Hero } from "@/components/Hero"
import { motion } from "framer-motion"
import { Trophy, Users, DollarSign, Globe } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const stats = [
    { value: "10M+", label: "Backers", icon: Users },
    { value: "$50M+", label: "Funded", icon: DollarSign },
    { value: "5K+", label: "Projects", icon: Trophy },
    { value: "190+", label: "Countries", icon: Globe },
  ]

  const featuredCampaigns = [
    {
      id: 1,
      title: "Sustainable Eco Village",
      creator: "GreenFuture Collective",
      funded: 85,
      goal: 100000,
      image: "/api/placeholder/400/300"
    },
    {
      id: 2,
      title: "AI Music Generator",
      creator: "SoundAI Labs",
      funded: 120,
      goal: 75000,
      image: "/api/placeholder/400/300"
    },
    {
      id: 3,
      title: "VR Fitness Platform",
      creator: "FitVerse Inc",
      funded: 45,
      goal: 200000,
      image: "/api/placeholder/400/300"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <Hero />

      {/* Stats */}
      <section className="py-20 bg-gradient-to-r from-background to-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="text-muted-foreground mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent mb-6">
              Featured Campaigns
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover innovative projects reaching their funding goals. Join the movement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/campaigns/${campaign.id}`}>
                  <Card className="h-full group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <div className="relative h-64 bg-gradient-to-br from-muted to-accent rounded-t-lg overflow-hidden group-hover:scale-105 transition-transform duration-500">
                      <div 
                        className="absolute inset-0 bg-cover bg-center" 
                        style={{ backgroundImage: `url(${campaign.image})` }}
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-semibold rounded-full">
                            {campaign.funded}% Funded
                          </span>
                        </div>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {campaign.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-foreground">by</span>
                        <span className="text-muted-foreground">{campaign.creator}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Goal</span>
                            <span>${campaign.goal.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-700" 
                              style={{ width: `${Math.min(campaign.funded, 100)}%` }}
                            />
                          </div>
                        </div>
                        <Button className="w-full" size="lg">
                          Back this project
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

