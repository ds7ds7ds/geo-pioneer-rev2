import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { ArrowRight, Calendar, User } from 'lucide-react'

const BlogSection = () => {
  const blogPosts = [
    {
      id: 1,
      title: "From Skeptic to Believer: Addressing Homeowner Concerns",
      excerpt: "Adopting a new heating and cooling system can be daunting, especially one that's unfamiliar like geothermal. This section addresses the most common concerns about trust, quality, and proper sizing.",
      author: "Dmitry Kur",
      date: "March 10, 2024",
      readTime: "5 min read",
      category: "Homeowner Guide",
      tags: ["Trust", "Quality", "Sizing", "Concerns"]
    },
    {
      id: 2,
      title: "Geothermal Heating & Cooling 101: Efficiency, Benefits & Myths",
      excerpt: "Unlocking Superior Efficiency - Geothermal heat pumps, also known as ground-source heat pumps (GSHP), are among the most efficient home heating and cooling systems available today.",
      author: "Dmitry Kur",
      date: "March 8, 2024",
      readTime: "4 min read",
      category: "Education",
      tags: ["Efficiency", "Benefits", "Myths", "GSHP"]
    },
    {
      id: 3,
      title: "Renew Your Home to NetZero with GeoPioneer Innovations",
      excerpt: "Are you looking to transform your old house into a sustainable, energy-efficient home? GeoPioneer offers innovative solutions to help you achieve NetZero energy consumption.",
      author: "Dmitry Kur",
      date: "March 3, 2024",
      readTime: "3 min read",
      category: "NetZero",
      tags: ["NetZero", "Renovation", "Sustainability"]
    },
    {
      id: 4,
      title: "Achieve NetZero Standard with GeoPioneer Renewable Solutions",
      excerpt: "Are you passionate about renovating old houses to be more environmentally friendly? Look no further than GeoPioneer, a startup based in New England dedicated to sustainable home transformations.",
      author: "Dmitry Kur",
      date: "March 3, 2024",
      readTime: "3 min read",
      category: "Renewable Energy",
      tags: ["NetZero", "Renewable", "Environment"]
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
            Knowledge Center
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Latest Insights & Guides
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expert insights on geothermal technology, installation processes, and sustainable home transformations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogPosts.map((post) => (
            <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-gray-200 hover:border-blue-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-xs">
                    {post.category}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {post.date}
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription className="text-gray-600 line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    <span>{post.author}</span>
                    <span className="mx-2">•</span>
                    <span>{post.readTime}</span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
                  >
                    Read More
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            View All Articles
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  )
}

export default BlogSection
