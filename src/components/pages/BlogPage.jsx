import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { ArrowRight, Calendar, User, Search } from 'lucide-react'
import { Input } from '@/components/ui/input.jsx'

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const blogPosts = [
    {
      id: 1,
      title: "From Skeptic to Believer: Addressing Homeowner Concerns",
      excerpt: "Adopting a new heating and cooling system can be daunting, especially one that's unfamiliar like geothermal. This section addresses the most common concerns about trust, quality, and proper sizing.",
      author: "Dmitry Kur",
      date: "March 10, 2024",
      readTime: "5 min read",
      category: "Homeowner Guide",
      tags: ["Trust", "Quality", "Sizing", "Concerns"],
      slug: "from-skeptic-to-believer"
    },
    {
      id: 2,
      title: "Geothermal Heating & Cooling 101: Efficiency, Benefits & Myths",
      excerpt: "Unlocking Superior Efficiency - Geothermal heat pumps, also known as ground-source heat pumps (GSHP), are among the most efficient home heating and cooling systems available today.",
      author: "Dmitry Kur",
      date: "March 8, 2024",
      readTime: "4 min read",
      category: "Education",
      tags: ["Efficiency", "Benefits", "Myths", "GSHP"],
      slug: "geothermal-101"
    },
    {
      id: 3,
      title: "Renew Your Home to NetZero with GeoPioneer Innovations",
      excerpt: "Are you looking to transform your old house into a sustainable, energy-efficient home? GeoPioneer offers innovative solutions to help you achieve NetZero energy consumption.",
      author: "Dmitry Kur",
      date: "March 3, 2024",
      readTime: "3 min read",
      category: "NetZero",
      tags: ["NetZero", "Renovation", "Sustainability"],
      slug: "renew-home-netzero"
    },
    {
      id: 4,
      title: "Achieve NetZero Standard with GeoPioneer Renewable Solutions",
      excerpt: "Are you passionate about renovating old houses to be more environmentally friendly? Look no further than GeoPioneer, a startup based in New England dedicated to sustainable home transformations.",
      author: "Dmitry Kur",
      date: "March 3, 2024",
      readTime: "3 min read",
      category: "Renewable Energy",
      tags: ["NetZero", "Renewable", "Environment"],
      slug: "achieve-netzero-standard"
    }
  ]

  const categories = ['All', ...new Set(blogPosts.map(post => post.category))]

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
              Knowledge Center
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              GeoPioneer Blog
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Expert insights on geothermal technology, installation processes, and sustainable home transformations
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No articles found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 bg-white border-gray-200 hover:border-blue-300 flex flex-col">
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
                  <CardContent className="mt-auto">
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
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Home with Geothermal?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Get a free assessment and discover how much you can save with Massachusetts' most efficient heating and cooling solution
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg"
              className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3"
            >
              Calculate Your Savings
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-3"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default BlogPage

