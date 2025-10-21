import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { CheckCircle, DollarSign, Home, Leaf, Zap, Phone, ArrowRight, Calculator, FileText } from 'lucide-react'
import BlogSection from '../BlogSection.jsx'

// Import images - using high-quality presentation images
import geothermalHomeDiagram from '../../assets/geothermal-home-diagram.png'
import groundSourceSystem from '../../assets/ground-source-system.png'
import compactDrillingSite from '../../assets/compact-drilling-site.png'
import newEnglandHouse from '/211118-AdobeStock_17893488-sm.jpg'
import comacchioRig from '/1_PERFORATRICE-COMACCHIO-GEO-601-1-1024x771.jpg'
import comacchioRig2 from '/comacchio-geo-600_a.2048x0.jpg'
import geothermalOriginal from '../../assets/OZfoKICtUl3C.png'

// Geothermal Image Carousel Component
const GeothermalImageCarousel = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const images = [
    {
      src: geothermalHomeDiagram,
      alt: "Geothermal Home Installation Diagram",
      caption: "How geothermal works in your home - heating and cooling"
    },
    {
      src: groundSourceSystem,
      alt: "Ground Source Heat Pump System",
      caption: "Underground pipe system for year-round comfort"
    },
    {
      src: '/211118-AdobeStock_17893488-sm.jpg',
      alt: "Beautiful New England Home",
      caption: "Classic New England home perfect for geothermal installation"
    },
    {
      src: '/1_PERFORATRICE-COMACCHIO-GEO-601-1-1024x771.jpg',
      alt: "Comacchio GEO 601 Drilling Rig",
      caption: "Professional Comacchio GEO 601 drilling rig - precision and efficiency"
    },
    {
      src: '/comacchio-geo-600_a.2048x0.jpg',
      alt: "Comacchio GEO 600 in Action",
      caption: "Comacchio GEO 600 drilling system - minimal site disruption"
    },
    {
      src: geothermalOriginal,
      alt: "Geothermal Winter and Summer Operation",
      caption: "Winter heating and summer cooling operation schematic"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="relative overflow-hidden rounded-lg shadow-2xl bg-slate-800">
        <img 
          src={images[currentImageIndex].src}
          alt={images[currentImageIndex].alt}
          className="w-full h-auto object-contain transition-opacity duration-700"
          style={{ minHeight: '400px', maxHeight: '600px' }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <p className="text-white font-medium text-lg">{images[currentImageIndex].caption}</p>
        </div>
        
        {/* Navigation arrows */}
        <button
          onClick={() => setCurrentImageIndex(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentImageIndex(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Dot indicators */}
      <div className="flex justify-center mt-6 space-x-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              index === currentImageIndex 
                ? 'bg-gradient-to-r from-green-400 to-cyan-400 scale-110' 
                : 'bg-gray-500 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

const HomePage = () => {
  const [showAssessment, setShowAssessment] = useState(false)

  const keyBenefits = [
    {
      icon: <Zap className="h-8 w-8 text-cyan-400" />,
      title: "400-600% Efficiency",
      description: "Compared to 80-95% for fossil fuel systems",
      highlight: "4-6x more efficient"
    },
    {
      icon: <DollarSign className="h-8 w-8 text-green-400" />,
      title: "$200-$275/Month Savings",
      description: "Compared to oil/propane + AC systems",
      highlight: "Up to $3,300/year"
    },
    {
      icon: <Leaf className="h-8 w-8 text-green-400" />,
      title: "50-70% Energy Reduction",
      description: "Compared to conventional heating and cooling",
      highlight: "Eco-friendly solution"
    }
  ]

  const customerSegments = [
    {
      title: "Existing Homes",
      description: "Perfect for homes with 2000+ sq ft, central AC, and expensive heating fuels like oil or propane",
      features: [
        "Retrofit existing ductwork",
        "Minimal property disruption",
        "3-4 week installation",
        "Immediate savings"
      ],
      cta: "Learn About Renovation",
      link: "/existing-homes",
      icon: <Home className="h-12 w-12 text-blue-600" />,
      color: "blue"
    },
    {
      title: "New Construction",
      description: "Maximize incentives and minimize operating costs for new construction projects",
      features: [
        "Competitive upfront costs",
        "Maximum incentive eligibility",
        "Optimal system integration",
        "GaaS model available"
      ],
      cta: "Explore New Construction",
      link: "/new-construction",
      icon: <Zap className="h-12 w-12 text-green-600" />,
      color: "green"
    }
  ]

  const incentives = [
    {
      amount: "$15,000",
      title: "MassSave Rebate",
      description: "State rebate for geothermal installations"
    },
    {
      amount: "30%",
      title: "Federal Tax Credit",
      description: "IRA tax credit on total system cost"
    },
    {
      amount: "0%",
      title: "HEAT Loan",
      description: "7-year financing at 0% interest"
    }
  ]

  const whyChooseUs = [
    {
      title: "Massachusetts Expertise",
      description: "Specialized in New England's rocky terrain and compact drilling solutions",
      icon: <Home className="h-6 w-6 text-blue-600" />
    },
    {
      title: "Minimal Disruption",
      description: "European-style compact equipment requires only 10x10 ft drilling area",
      icon: <Leaf className="h-6 w-6 text-green-600" />
    },
    {
      title: "Complete Solution",
      description: "Heating, cooling, and hot water in one integrated system",
      icon: <Zap className="h-6 w-6 text-purple-600" />
    },
    {
      title: "Long-term Value",
      description: "25-50 year lifespan vs 10-15 years for conventional systems",
      icon: <DollarSign className="h-6 w-6 text-green-600" />
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center">
        <div className="absolute inset-0 bg-[url('/211118-AdobeStock_17893488-sm.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 border border-cyan-400/30">
                Massachusetts Geothermal Pioneers
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                Transform Your Home with
                <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent block py-2 leading-tight">Clean Geothermal Energy</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 mt-9 leading-relaxed">
                Say goodbye to expensive oil, propane, and inefficient air conditioning forever. 
                Our compact European-style drilling and innovative financing make complete 
                geothermal heating and cooling affordable for every Massachusetts homeowner.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white px-8 py-4 text-lg"
                  asChild
                >
                  <Link to="/calculator">
                    <Calculator className="h-5 w-5 mr-2" />
                    Calculate Your Savings
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 px-8 py-4 text-lg"
                  onClick={() => setShowAssessment(true)}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Get Free Assessment
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <GeothermalImageCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Massachusetts Homeowners Choose Geothermal
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Based on data from International Ground Source Heat Pump Association (IGSHPA)
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {keyBenefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  <Badge variant="secondary" className="mt-2">{benefit.highlight}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Segments Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Path to Geothermal
            </h2>
            <p className="text-lg text-gray-600">
              Whether you're retrofitting an existing home or building new, we have the perfect solution
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {customerSegments.map((segment, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow group">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="group-hover:scale-110 transition-transform">
                      {segment.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{segment.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {segment.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {segment.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${
                      segment.color === 'blue' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                    asChild
                  >
                    <Link to={segment.link}>
                      {segment.cta}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Geothermal Works
            </h2>
            <p className="text-lg text-gray-600">
              Uses stable underground temperatures (50-55°F year-round) for efficient heating and cooling
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Winter Heating</h3>
                    <p className="text-gray-600">
                      Extracts heat from the ground and delivers it to your home with 400%+ efficiency
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Summer Cooling</h3>
                    <p className="text-gray-600">
                      Pulls heat from your home and deposits it into the ground with 600%+ efficiency
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Home className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Vertical Bore Technology</h3>
                    <p className="text-gray-600">
                      400-1000 ft deep vertical bores ideal for Massachusetts properties with limited space
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <img 
                src={compactDrillingSite} 
                alt="Compact Drilling Equipment" 
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Incentives Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Substantial Incentives Available Now
            </h2>
            <p className="text-xl text-blue-100">
              Reduce your system cost by over 50% with combined federal and state incentives
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {incentives.map((incentive, index) => (
              <Card key={index} className="bg-white/10 border-white/20 text-white text-center hover:bg-white/20 transition-colors">
                <CardHeader>
                  <div className="text-4xl font-bold text-white mb-2">{incentive.amount}</div>
                  <CardTitle className="text-xl text-white">{incentive.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-100">{incentive.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose GeoPioneer
            </h2>
            <p className="text-lg text-gray-600">
              Massachusetts' leading geothermal installation company
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((reason, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {reason.icon}
                  </div>
                  <CardTitle className="text-lg">{reason.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{reason.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Saving with Geothermal?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Get a free assessment and discover how much you can save with Massachusetts' most efficient heating and cooling solution
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <a href="tel:+17816545879">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white bg-green-600/20 hover:bg-green-600 px-8 py-3 font-bold"
              >
                <Phone className="h-5 w-5 mr-2" />
                Call (781) 654-5879
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Assessment Modal */}
      {showAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Get Your Free Assessment</h2>
                <button 
                  onClick={() => setShowAssessment(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-gray-300 rounded-md focus:border-cyan-400 focus:outline-none"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input 
                      type="email" 
                      className="w-full p-3 border border-gray-300 rounded-md focus:border-cyan-400 focus:outline-none"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input 
                      type="tel" 
                      className="w-full p-3 border border-gray-300 rounded-md focus:border-cyan-400 focus:outline-none"
                      placeholder="(781) 654-5879"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                    <select className="w-full p-3 border border-gray-300 rounded-md focus:border-cyan-400 focus:outline-none">
                      <option value="">Select property type</option>
                      <option value="existing">Existing Home</option>
                      <option value="new">New Construction</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:border-cyan-400 focus:outline-none"
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
                  <textarea 
                    className="w-full p-3 border border-gray-300 rounded-md focus:border-cyan-400 focus:outline-none resize-none"
                    rows="3"
                    placeholder="Tell us about your project, current heating system, or any specific questions..."
                  />
                </div>
                
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-cyan-800 mb-2">What You'll Receive:</h4>
                  <ul className="text-sm text-cyan-700 space-y-1">
                    <li>• Comprehensive site evaluation</li>
                    <li>• Custom system design and sizing</li>
                    <li>• Detailed cost estimates</li>
                    <li>• Financing and incentive guidance</li>
                    <li>• No obligation consultation</li>
                  </ul>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button 
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                    onClick={async () => {
                      // Collect form data
                      const formData = {
                        name: document.querySelector('input[placeholder="Your full name"]').value,
                        email: document.querySelector('input[placeholder="your@email.com"]').value,
                        phone: document.querySelector('input[placeholder="(781) 654-5879"]').value,
                        propertyType: document.querySelector('select').value,
                        address: document.querySelector('input[placeholder="123 Main St, City, State, ZIP"]').value,
                        additionalInfo: document.querySelector('textarea').value,
                        submissionDate: new Date().toLocaleDateString(),
                        submissionTime: new Date().toLocaleTimeString()
                      }
                      
                      // Validate required fields
                      if (!formData.name || !formData.email || !formData.phone) {
                        alert('Please fill in all required fields (Name, Email, Phone)')
                        return
                      }
                      
                      // Import and use the report service
                      try {
                        const { generateAndSendReport } = await import('../../services/reportService.js')
                        const result = await generateAndSendReport(formData, 'general')
                        
                        if (result.success) {
                          alert(`Thank you ${formData.name}! 

Your comprehensive geothermal assessment report has been generated and sent to:
📧 Customer: ${formData.email}
📧 CC: info@geopioneer.com

Report ID: ${result.reportId}

The report includes:
✅ Available rebates and incentives (up to $30,000 total)
✅ Step-by-step installation process (6-12 week timeline)
✅ Financing options and next steps
✅ Your specific property assessment details

We'll contact you within 24 hours to schedule your on-site evaluation.`)
                        } else {
                          alert(`Error: ${result.message}. Please try again or contact us directly at (781) 654-5879.`)
                        }
                      } catch (error) {
                        console.error('Report generation error:', error)
                        alert('There was an issue generating your report. Please try again or contact us directly at (781) 654-5879.')
                      }
                      
                      setShowAssessment(false)
                    }}
                  >
                    Generate Report & Submit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowAssessment(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog Section */}
      <BlogSection />

      {/* Our Story & Team Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Our Story & Expertise
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              GeoPioneer brings together decades of combined expertise in drilling, engineering, and sustainable energy solutions
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Card className="p-8 bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader>
                  <CardTitle className="text-2xl text-green-800">Leadership & Execution Team</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Managing Director</h4>
                        <p className="text-gray-700">Master's Degree in Engineering, Certified Designer and Installer for Ground Source Heat Pumps (IGSHPA)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Operations Executive</h4>
                        <p className="text-gray-700">More than half a decade of operations experience with effective project management and support from start to finish</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Drilling Team</h4>
                        <p className="text-gray-700">Top-notch drilling teams using high-tech Comacchio rigs, proven track record of over one million feet drilled worldwide</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="p-8 bg-white/80 backdrop-blur-sm border-blue-200">
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-800">Professional Credentials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">Licensed</Badge>
                      <div>
                        <p className="text-gray-700">Drilling licenses in Massachusetts, Rhode Island, Maine, Connecticut, New York, and through the National Ground Water Association (NGWA)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge className="bg-green-100 text-green-800 border-green-200">Certified</Badge>
                      <div>
                        <p className="text-gray-700">Certified ground source heat pump designer with Master's degree in Reservoir Engineering</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">Proven</Badge>
                      <div>
                        <p className="text-gray-700">Over one million feet of successful drilling worldwide with high-tech European equipment</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-800">Ready to Transform Your Home?</CardTitle>
                <CardDescription className="text-lg text-blue-700">
                  Contact our expert team for your free geothermal assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a 
                    href="tel:+17816545879" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    Call (781) 654-5879
                  </a>
                  <a 
                    href="mailto:info@geopioneer.com" 
                    className="inline-flex items-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                  >
                    <FileText className="h-5 w-5" />
                    info@geopioneer.com
                  </a>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Serving Massachusetts, Rhode Island, Maine, Connecticut, and New York
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
