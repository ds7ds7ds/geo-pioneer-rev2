import React, { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { CheckCircle, DollarSign, Home, Leaf, Zap, TrendingUp, Building, Calculator, Shield, X } from 'lucide-react'

// Import images
import geothermalHomeDiagram from '../../assets/geothermal-home-diagram.png'

// Builder Quote Form Component
const BuilderQuoteForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    homeSize: '',
    homeType: '',
    hersRating: '',
    airExchanges: '',
    plannedFuelType: '',
    city: '',
    timeframe: '',
    financingType: '',
    upfrontBudget: '',
    bridgeFinancing: '',
    gasAvailable: '',
    builderName: '',
    builderContact: '',
    projectAddress: '',
    additionalNotes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Builder Quote Form Data:', formData)
    // Handle form submission
    alert('Builder quote request submitted! We will contact you within 24 hours.')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Get Builder Quote</h2>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Home Size */}
              <div>
                <Label htmlFor="homeSize">Home Size (sq ft)</Label>
                <Input
                  id="homeSize"
                  type="number"
                  placeholder="e.g., 2500"
                  value={formData.homeSize}
                  onChange={(e) => setFormData({...formData, homeSize: e.target.value})}
                  required
                />
              </div>

              {/* Home Type */}
              <div>
                <Label htmlFor="homeType">Home Type</Label>
                <Select onValueChange={(value) => setFormData({...formData, homeType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select home type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tier1">Tier 1 (Standard Construction)</SelectItem>
                    <SelectItem value="tier2">Tier 2 (High Performance)</SelectItem>
                    <SelectItem value="passive">Passive House</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* HERS Rating (for Tier 1/2) */}
              {(formData.homeType === 'tier1' || formData.homeType === 'tier2') && (
                <div>
                  <Label htmlFor="hersRating">HERS Rating</Label>
                  <Input
                    id="hersRating"
                    type="number"
                    placeholder="e.g., 55"
                    value={formData.hersRating}
                    onChange={(e) => setFormData({...formData, hersRating: e.target.value})}
                  />
                </div>
              )}

              {/* Air Exchanges (for Tier 1/2) */}
              {(formData.homeType === 'tier1' || formData.homeType === 'tier2') && (
                <div>
                  <Label htmlFor="airExchanges">Air Exchanges per Hour</Label>
                  <Input
                    id="airExchanges"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 3.0"
                    value={formData.airExchanges}
                    onChange={(e) => setFormData({...formData, airExchanges: e.target.value})}
                  />
                </div>
              )}

              {/* Planned Fuel Type */}
              <div>
                <Label htmlFor="plannedFuelType">Planned Fuel Type (Alternative)</Label>
                <Select onValueChange={(value) => setFormData({...formData, plannedFuelType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="propane">Propane</SelectItem>
                    <SelectItem value="natural-gas">Natural Gas</SelectItem>
                    <SelectItem value="oil">Oil</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="ashp">Air Source Heat Pump</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div>
                <Label htmlFor="city">City/Town</Label>
                <Input
                  id="city"
                  placeholder="e.g., Boston, MA"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                />
              </div>

              {/* Timeframe */}
              <div>
                <Label htmlFor="timeframe">Project Timeframe</Label>
                <Select onValueChange={(value) => setFormData({...formData, timeframe: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (0-3 months)</SelectItem>
                    <SelectItem value="short">Short term (3-6 months)</SelectItem>
                    <SelectItem value="medium">Medium term (6-12 months)</SelectItem>
                    <SelectItem value="long">Long term (12+ months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Financing Type */}
              <div>
                <Label htmlFor="financingType">Financing Preference</Label>
                <Select onValueChange={(value) => setFormData({...formData, financingType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select financing type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upfront">Upfront Payment</SelectItem>
                    <SelectItem value="bridge">Bridge Financing</SelectItem>
                    <SelectItem value="construction-loan">Construction Loan Integration</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Upfront Budget */}
              <div>
                <Label htmlFor="upfrontBudget">Upfront Budget Range</Label>
                <Select onValueChange={(value) => setFormData({...formData, upfrontBudget: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-30k">Under $30,000</SelectItem>
                    <SelectItem value="30-50k">$30,000 - $50,000</SelectItem>
                    <SelectItem value="50-75k">$50,000 - $75,000</SelectItem>
                    <SelectItem value="over-75k">Over $75,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Gas Available */}
              <div>
                <Label htmlFor="gasAvailable">Natural Gas Available</Label>
                <Select onValueChange={(value) => setFormData({...formData, gasAvailable: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gas availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Builder Information */}
              <div>
                <Label htmlFor="builderName">Builder/Contractor Name</Label>
                <Input
                  id="builderName"
                  placeholder="Builder company name"
                  value={formData.builderName}
                  onChange={(e) => setFormData({...formData, builderName: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="builderContact">Builder Contact</Label>
                <Input
                  id="builderContact"
                  placeholder="Phone or email"
                  value={formData.builderContact}
                  onChange={(e) => setFormData({...formData, builderContact: e.target.value})}
                />
              </div>

              {/* Project Address */}
              <div className="md:col-span-2">
                <Label htmlFor="projectAddress">Project Address</Label>
                <Input
                  id="projectAddress"
                  placeholder="Full project address"
                  value={formData.projectAddress}
                  onChange={(e) => setFormData({...formData, projectAddress: e.target.value})}
                />
              </div>

              {/* Additional Notes */}
              <div className="md:col-span-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any additional project details, special requirements, or questions..."
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600">
                Submit Quote Request
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ROI Calculator Component
const ROICalculator = ({ onClose }) => {
  const [calcData, setCalcData] = useState({
    homeSize: '',
    homeType: '',
    plannedFuelType: '',
    city: '',
    electricRate: '0.35'
  })
  
  const [results, setResults] = useState(null)

  const calculateROI = () => {
    const size = parseInt(calcData.homeSize) || 2500
    
    // New Construction MassSave Incentives (NOT replacement)
    const massSaveNewConstruction = {
      tier1: 9000,
      tier2: 15000,
      passive: 25000,
      gshp: 9000 // Additional for GSHP
    }
    
    const totalIncentive = massSaveNewConstruction[calcData.homeType] + massSaveNewConstruction.gshp
    const federalTaxCredit = 0.30 // 30% federal tax credit
    
    // Estimated costs (more realistic pricing)
    const geothermalCost = size * 22 // $22/sq ft estimate for new construction
    const netGeothermalCost = geothermalCost - totalIncentive - (geothermalCost * federalTaxCredit)
    
    // Alternative system costs (more realistic for new construction)
    const alternativeCosts = {
      'propane': size * 12, // Propane furnace + AC
      'natural-gas': size * 10, // Gas furnace + AC  
      'oil': size * 14, // Oil furnace + AC
      'electric': size * 8, // Electric heat + AC
      'ashp': size * 15 // Air source heat pump (was too high at $20)
    }
    
    const alternativeCost = alternativeCosts[calcData.plannedFuelType] || alternativeCosts['propane']
    
    // Annual operating costs (estimates)
    const geothermalAnnual = size * 1.9 // Very efficient
    const alternativeAnnual = {
      'propane': size * 3.8,
      'natural-gas': size * 2.8,
      'oil': size * 4.2,
      'electric': size * 4.5,
      'ashp': size * 3.2
    }
    
    const altAnnual = alternativeAnnual[calcData.plannedFuelType] || alternativeAnnual['propane']
    const annualSavings = altAnnual - geothermalAnnual
    const paybackYears = Math.max(0, (netGeothermalCost - alternativeCost) / annualSavings)
    
    setResults({
      geothermalCost,
      totalIncentive,
      federalCredit: geothermalCost * federalTaxCredit,
      netGeothermalCost,
      alternativeCost,
      costDifference: netGeothermalCost - alternativeCost,
      annualSavings,
      paybackYears,
      tenYearSavings: (annualSavings * 10) - Math.max(0, netGeothermalCost - alternativeCost),
      twentyYearSavings: (annualSavings * 20) - Math.max(0, netGeothermalCost - alternativeCost)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">New Construction ROI Calculator</h2>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Details</h3>
              
              <div>
                <Label htmlFor="calc-homeSize">Home Size (sq ft)</Label>
                <Input
                  id="calc-homeSize"
                  type="number"
                  placeholder="e.g., 2500"
                  value={calcData.homeSize}
                  onChange={(e) => setCalcData({...calcData, homeSize: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="calc-homeType">Home Type</Label>
                <Select onValueChange={(value) => setCalcData({...calcData, homeType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select home type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tier1">Tier 1 - $9K MassSave</SelectItem>
                    <SelectItem value="tier2">Tier 2 - $15K MassSave</SelectItem>
                    <SelectItem value="passive">Passive House - $25K MassSave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="calc-fuelType">Alternative Fuel Type</Label>
                <Select onValueChange={(value) => setCalcData({...calcData, plannedFuelType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="propane">Propane</SelectItem>
                    <SelectItem value="natural-gas">Natural Gas</SelectItem>
                    <SelectItem value="oil">Oil</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="ashp">Air Source Heat Pump</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="calc-city">City/Town</Label>
                <Input
                  id="calc-city"
                  placeholder="e.g., Boston, MA"
                  value={calcData.city}
                  onChange={(e) => setCalcData({...calcData, city: e.target.value})}
                />
              </div>

              <Button 
                onClick={calculateROI}
                className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
                disabled={!calcData.homeSize || !calcData.homeType || !calcData.plannedFuelType}
              >
                Calculate ROI
              </Button>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">ROI Analysis</h3>
              
              {results ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">Geothermal Investment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>System Cost:</span>
                          <span>${results.geothermalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>MassSave New Construction:</span>
                          <span>-${results.totalIncentive.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Federal Tax Credit (30%):</span>
                          <span>-${results.federalCredit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2">
                          <span>Net Cost:</span>
                          <span>${results.netGeothermalCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Alternative System</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between">
                        <span>System Cost:</span>
                        <span>${results.alternativeCost.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-blue-600">Financial Returns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Annual Savings:</span>
                          <span className="text-green-600">${results.annualSavings.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payback Period:</span>
                          <span>{results.paybackYears.toFixed(1)} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span>10-Year Net Savings:</span>
                          <span className="text-green-600">${results.tenYearSavings.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>20-Year Net Savings:</span>
                          <span className="text-green-600">${results.twentyYearSavings.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Fill in the project details and click "Calculate ROI" to see your analysis
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const NewConstructionPage = () => {
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showROICalculator, setShowROICalculator] = useState(false)

  const costComparison = [
    {
      system: "Geothermal",
      netCost: "$37,600",
      comparison: "Best Long-term Value",
      icon: <Leaf className="h-8 w-8 text-green-600" />,
      highlight: true,
      details: "4000 sq ft Tier 2: $88K - $24K MassSave - $26.4K Fed Credit"
    },
    {
      system: "Propane + AC",
      netCost: "$48,000",
      comparison: "+28% vs Geo",
      icon: <Home className="h-8 w-8 text-orange-600" />,
      highlight: false,
      details: "4000 sq ft: Propane furnace + central AC"
    },
    {
      system: "ASHP",
      netCost: "$60,000",
      comparison: "+59% vs Geo",
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      highlight: false,
      details: "4000 sq ft: Air source heat pump system"
    }
  ]

  const newConstructionIncentives = [
    {
      tier: "Tier 1",
      massSave: "$9,000",
      gshp: "$9,000",
      total: "$18,000",
      description: "Standard construction + GSHP bonus"
    },
    {
      tier: "Tier 2", 
      massSave: "$15,000",
      gshp: "$9,000",
      total: "$24,000",
      description: "High performance + GSHP bonus"
    },
    {
      tier: "Passive House",
      massSave: "$25,000", 
      gshp: "$9,000",
      total: "$34,000",
      description: "Passive house + GSHP bonus"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 border border-cyan-400/30">
              New Construction Specialists
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Build Smart with
              <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent block py-2 leading-tight">
                Geothermal from Day One
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Integrate geothermal into your new construction project and maximize incentives. 
              Get up to $34,000 in MassSave rebates plus 30% federal tax credits.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white px-8 py-4 text-lg"
                onClick={() => setShowQuoteForm(true)}
              >
                <Building className="h-5 w-5 mr-2" />
                Get Builder Quote
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 px-8 py-4 text-lg"
                onClick={() => setShowROICalculator(true)}
              >
                <Calculator className="h-5 w-5 mr-2" />
                Calculate ROI
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* New Construction Incentives */}
      <section className="py-16 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              New Construction MassSave Incentives
            </h2>
            <p className="text-gray-300 text-lg">
              Maximize your rebates with new construction programs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newConstructionIncentives.map((incentive, index) => (
              <Card key={index} className="bg-slate-700/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-cyan-400">{incentive.tier}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {incentive.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">MassSave:</span>
                      <span className="text-green-400 font-semibold">{incentive.massSave}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">GSHP Bonus:</span>
                      <span className="text-green-400 font-semibold">{incentive.gshp}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-600 pt-3">
                      <span className="text-white font-semibold">Total:</span>
                      <span className="text-cyan-400 font-bold text-lg">{incentive.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              New Construction Cost Comparison
            </h2>
            <p className="text-gray-300 text-lg">
              Example: Tier 2 house, 4000 sq ft in Massachusetts - see how geothermal compares
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {costComparison.map((system, index) => (
              <Card key={index} className={`${system.highlight ? 'bg-gradient-to-br from-green-900/50 to-cyan-900/50 border-green-500' : 'bg-slate-700/50 border-slate-600'}`}>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {system.icon}
                  </div>
                  <CardTitle className="text-white">{system.system}</CardTitle>
                  <CardDescription className={system.highlight ? 'text-green-400' : 'text-gray-300'}>
                    {system.comparison}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className={`text-3xl font-bold ${system.highlight ? 'text-green-400' : 'text-white'}`}>
                    {system.netCost}
                  </div>
                  <p className="text-gray-400 text-sm mt-2">Net installed cost</p>
                  {system.details && (
                    <p className="text-gray-500 text-xs mt-3 leading-relaxed">
                      {system.details}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Forms */}
      {showQuoteForm && <BuilderQuoteForm onClose={() => setShowQuoteForm(false)} />}
      {showROICalculator && <ROICalculator onClose={() => setShowROICalculator(false)} />}
    </div>
  )
}

export default NewConstructionPage
