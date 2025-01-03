import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"
import { ArrowRight, BookOpen, Search, Upload } from 'lucide-react'
import SearchBar from "@/components/SearchBar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const steps = [
  {
    step: 1,
    title: "Share book title",
    description: "Write the full title so people don't mix it up with another book.",
    icon: BookOpen,
  },
  {
    step: 2,
    title: "Find a match",
    description: "The AI will show details about that book.",
    icon: Search,
  },
  {
    step: 3,
    title: "Edit and list",
    description: "Add pictures, the condition, and fix anything before putting your item up for sale.",
    icon: Upload,
  },
]

export default async function SellPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto min-h-screen space-y-8 py-8 md:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Start your listing
          </h1>
          <p className="text-muted-foreground">
            Follow these simple steps to list your book for sale
          </p>
        </div>

        <SearchBar />

        <div className="relative">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
          <div className="relative grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <Card key={step.step} className="border-2">
                <CardHeader className="pb-2">
                  <Badge className="w-fit">{`Step ${step.step}`}</Badge>
                </CardHeader>
                <CardContent className="grid justify-items-center gap-4 text-center">
                  <div className="rounded-full border-2 p-2.5">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-muted-foreground sm:block" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
