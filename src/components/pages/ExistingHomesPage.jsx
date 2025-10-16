import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { CheckCircle, DollarSign, Home, Leaf, Zap, Clock, Shield, TrendingUp, Wrench } from 'lucide-react'

// Import images
import groundSourceSystem from '../../assets/ground-source-system.png'
import compactDrillingSite from '../../assets/compact-drilling-site.png'

const ExistingHomesPage = () => {
  const [showAssessment, setShowAssessment] = useState(false)

  const idealCandidates = [
    {
      icon: <Home className="h-8 w-8 text-blue-600" />,
      title: "2000+ sq ft Living Space",
      description: "Perfect for medium to large homes with higher energy demands"
    },
    {
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      title: "Central AC System",
      description: "Leverages existing ductwork for efficient distribution"
    },
    {
      icon: <DollarSign className="h-8 w-8 text-blue-600" />,
      title: "Propane/Oil/Electric Heating",
      description: "Greatest savings when replacing expensive heating fuels"
    }
  ]

  const keyAdvantages = [
    {
      percentage: "50-70%",
      title: "Energy Reduction",
      description: "Compared to conventional heating and cooling systems",
      icon: <Leaf className="h-6 w-6 text-green-600" />
    },
    {
      percentage: "400-600%",
      title: "Efficiency",
      description: "Compared to 80-95% for fossil fuel systems",
      icon: <Zap className="h-6 w-6 text-blue-600" />
    },
    {
      percentage: "5-8%",
      title: "House Value Increase",
      description: "Typical increase for homes with geothermal systems",
      icon: <TrendingUp className="h-6 w-6 text-purple-600" />
    }
  ]

  const installationSteps = [
    {
      step: 1,
      title: "Site Assessment & Permitting",
      description: "Property evaluation and ~2 weeks permitting process",
      duration: "2 weeks"
    },
    {
      step: 2,
      title: "Vertical Drilling & Loop Installation",
      description: "2 days using compact equipment (10x10 ft area)",
      duration: "2 days"
    },
    {
      step: 3,
      title: "HVAC Installation",
      description: "2 days to connect to existing ductwork",
      duration: "2 days"
    },
    {
      step: 4,
      title: "Commissioning & Training",
      description: "1-2 days for system testing and homeowner education",
      duration: "1-2 days"
    }
  ]

  const benefits = [
    {
      title: "Lower Monthly Costs",
      description: "Save $200-$275/month compared to oil/propane + AC",
      icon: <DollarSign className="h-6 w-6 text-green-600" />
    },
    {
      title: "Complete Home Solution",
      description: "Heating, cooling & hot water in one integrated system",
      icon: <Home className="h-6 w-6 text-blue-600" />
    },
    {
      title: "No Outside Unit",
      description: "More yard space, no noise, better aesthetics",
      icon: <Leaf className="h-6 w-6 text-green-600" />
    },
    {
      title: "2x Longer Lifespan",
      description: "25-50 years vs. 10-15 years for conventional systems",
      icon: <Shield className="h-6 w-6 text-purple-600" />
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Geothermal for <span className="text-blue-600">Existing Homes</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Transform your home's heating and cooling with Massachusetts' most efficient geothermal solutions. 
              Perfect for homes with existing ductwork and expensive heating fuels.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                onClick={() => setShowAssessment(true)}
              >
                Get Free Assessment
              </Button>
              <Link to="/calculator">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
                >
                  Calculate Savings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ideal Candidates Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ideal for Existing Homes with:
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {idealCandidates.map((candidate, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {candidate.icon}
                  </div>
                  <CardTitle className="text-xl">{candidate.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{candidate.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Advantages Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Key Advantages
            </h2>
            <p className="text-lg text-gray-600">
              Based on data from International Ground Source Heat Pump Association (IGSHPA)
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {keyAdvantages.map((advantage, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {advantage.icon}
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {advantage.percentage}
                  </div>
                  <CardTitle className="text-xl">{advantage.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How Geothermal Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What is Geothermal?
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">How Geothermal Works:</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Leaf className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Uses stable underground temperatures</h4>
                    <p className="text-gray-600">(50-55°F year-round) for heating & cooling</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Zap className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Summer Cooling</h4>
                    <p className="text-gray-600">Pulls heat from your home and deposits it into the ground</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Zap className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Winter Heating</h4>
                    <p className="text-gray-600">Extracts heat from the ground and delivers it to your home</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <img 
                src={groundSourceSystem} 
                alt="Geothermal System Diagram" 
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vertical Bore Technology Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img 
                src={compactDrillingSite} 
                alt="Compact Drilling Equipment" 
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Vertical Bore Solution for New England's Rocky Terrain
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Vertical bores (400-1000 ft deep) are ideal for Massachusetts properties</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Requires minimal surface area - perfect for limited yard space</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">More stable performance than horizontal systems in all seasons</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">GeoPioneer specializes in precision vertical drilling techniques</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">European-style compact drilling equipment - minimal property disruption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Geothermal Today Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Geothermal Today
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Incentives Highlight */}
          <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Substantial Incentives</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">30%</div>
                <div className="text-gray-700">Federal Tax Credit</div>
              </div>
              <div className="text-2xl text-gray-400">+</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">$15K</div>
                <div className="text-gray-700">MassSave Rebate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Process Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Installation Process
            </h2>
            <p className="text-lg text-gray-600">
              Total timeline: 3-4 weeks start to finish
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {installationSteps.map((step, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {step.step}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <Badge variant="secondary" className="mt-2">{step.duration}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Requirements */}
          <div className="mt-12 bg-white rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Requirements</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Wrench className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Drilling Area</h4>
                <p className="text-gray-600">10x10 ft area (10ft from property line)</p>
              </div>
              <div className="text-center">
                <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Electrical Panel</h4>
                <p className="text-gray-600">100A-200A electrical panel preferred</p>
              </div>
              <div className="text-center">
                <Home className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Best For</h4>
                <p className="text-gray-600">Homes with oil/propane + central AC</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Home's Energy?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get a free assessment and discover how much you can save with geothermal
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <a href="tel:+15551234567">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white bg-blue-600/20 hover:bg-blue-600 px-8 py-3 font-bold"
              >
                Call (555) 123-4567
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
                      className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-400 focus:outline-none"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input 
                      type="email" 
                      className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-400 focus:outline-none"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input 
                      type="tel" 
                      className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-400 focus:outline-none"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Heating System</label>
                    <select className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-400 focus:outline-none">
                      <option value="">Select current system</option>
                      <option value="oil">Oil Heating</option>
                      <option value="propane">Propane Heating</option>
                      <option value="electric">Electric Heating</option>
                      <option value="gas">Natural Gas</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Home Square Footage</label>
                    <input 
                      type="number" 
                      className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-400 focus:outline-none"
                      placeholder="2500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-400 focus:outline-none"
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
                  <textarea 
                    className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-400 focus:outline-none resize-none"
                    rows="3"
                    placeholder="Tell us about your current system, any issues, or specific questions about geothermal retrofit..."
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Existing Home Assessment Includes:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Site survey and soil analysis</li>
                    <li>• Existing system evaluation</li>
                    <li>• Retrofit feasibility study</li>
                    <li>• Detailed cost estimates</li>
                    <li>• Financing and incentive guidance</li>
                    <li>• No obligation consultation</li>
                  </ul>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={async () => {
                      // Collect form data
                      const formData = {
                        name: document.querySelector('input[placeholder="Your full name"]').value,
                        email: document.querySelector('input[placeholder="your@email.com"]').value,
                        phone: document.querySelector('input[placeholder="(555) 123-4567"]').value,
                        currentSystem: document.querySelector('select').value,
                        squareFootage: document.querySelector('input[placeholder="2500"]').value,
                        address: document.querySelector('input[placeholder="123 Main St, City, State, ZIP"]').value,
                        additionalInfo: document.querySelector('textarea').value,
                        submissionDate: new Date().toLocaleDateString(),
                        submissionTime: new Date().toLocaleTimeString(),
                        assessmentType: 'Existing Home Retrofit'
                      }
                      
                      // Validate required fields
                      if (!formData.name || !formData.email || !formData.phone) {
                        alert('Please fill in all required fields (Name, Email, Phone)')
                        return
                      }
                      
                      // Import and use the report service
                      try {
                        const { generateAndSendReport } = await import('../../services/reportService.js')
                        const result = await generateAndSendReport(formData, 'retrofit')
                        
                        if (result.success) {
                          alert(`Thank you ${formData.name}! 

Your comprehensive existing home retrofit assessment report has been generated and sent to:
📧 Customer: ${formData.email}
📧 CC: info@geopioneer.com

Report ID: ${result.reportId}

The retrofit report includes:
✅ Existing home evaluation checklist
✅ Available rebates and incentives (up to $35,000 total)
✅ Step-by-step retrofit process (8-14 week timeline)
✅ Integration with your current ${formData.currentSystem || 'heating'} system
✅ Financing options and next steps
✅ Your specific property assessment details

We'll contact you within 24 hours to schedule your comprehensive home evaluation.`)
                        } else {
                          alert(`Error: ${result.message}. Please try again or contact us directly at (555) 123-4567.`)
                        }
                      } catch (error) {
                        console.error('Report generation error:', error)
                        alert('There was an issue generating your report. Please try again or contact us directly at (555) 123-4567.')
                      }
                      
                      setShowAssessment(false)
                    }}
                  >
                    Generate Retrofit Report & Submit
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
    </div>
  )
}

export default ExistingHomesPage
