"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Search, Filter, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { listProjects } from "@/lib/api"

export default function CampaignsPage() {
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  })

  const projects = projectsQuery.data ?? []

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-background to-muted/50 py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent mb-6">
              Discover Amazing
            </h1>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
              Projects
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mt-6 max-w-2xl mx-auto">
              Browse thousands of innovative campaigns across all categories. Find your next favorite project.
            </p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search 10K+ campaigns by title, creator, or description..." 
                  className="pl-12 h-14 text-lg"
                />
              </div>
              <Button className="h-14 lg:col-span-1">
                <Filter className="mr-2 h-5 w-5" />
                Filters
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
              Back to Home
            </Link>
            <div className="ml-auto flex gap-2">
              <Link href="/campaigns/new">
                <Button className="h-12">Create Project</Button>
              </Link>
              <Button variant="outline" size="sm">
                Grid View
              </Button>
            </div>
          </div>

          {projectsQuery.isLoading ? (
            <div className="text-center text-muted-foreground py-24">Loading projects...</div>
          ) : projectsQuery.isError ? (
            <div className="text-center text-muted-foreground py-24">
              Could not load projects. Make sure the backend is running on {process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}.
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-2xl font-bold mb-3">No projects yet</div>
              <div className="text-muted-foreground mb-8">Create the first project to test AON/KIA/Milestone funding flows.</div>
              <Link href="/campaigns/new">
                <Button size="lg" className="px-12 h-14 text-lg font-semibold shadow-xl">
                  Create Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {projects.map((project, index) => {
                const progress = project.goal_amount > 0 ? Math.min(100, Math.round((project.current_amount / project.goal_amount) * 100)) : 0
                const amountFmt = new Intl.NumberFormat(undefined, { style: "currency", currency: project.currency || "USD", maximumFractionDigits: 0 })
                const raised = amountFmt.format(project.current_amount)
                const goal = amountFmt.format(project.goal_amount)

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/campaigns/${project.slug}`}>
                      <Card className="group h-full hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden hover:-translate-y-2">
                        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-muted to-accent/50">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent" />
                          <div className="absolute top-4 right-4 flex gap-2">
                            <span className="px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-bold rounded-full">
                              {project.state}
                            </span>
                            <span className="px-3 py-1 bg-background/80 text-foreground text-xs font-bold rounded-full border">
                              {project.funding_model.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <CardHeader className="p-6">
                          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            {project.category}
                          </div>
                          <CardTitle className="group-hover:text-primary transition-colors line-clamp-2 text-lg font-bold leading-tight">
                            {project.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 pt-1">
                            <span className="text-muted-foreground font-medium">{project.backers_count} backers</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 pb-8">
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm font-medium">
                                <span>Raised</span>
                                <span className="font-black text-2xl">{raised}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div className="bg-gradient-to-r from-green-500 to-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>of {goal} goal</span>
                                <span>{progress}%</span>
                              </div>
                            </div>
                            <Button className="w-full h-12" size="lg">
                              View Campaign
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Load More */}
          {projects.length > 0 ? (
            <div className="text-center mt-24">
              <Button size="lg" className="px-12 h-14 text-lg font-semibold shadow-xl" disabled>
                Load More
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

