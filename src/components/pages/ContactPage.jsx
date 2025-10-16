import React, { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Phone, Mail, MapPin, Clock, MessageSquare, Calculator, FileText } from 'lucide-react'

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    projectType: '',
    homeSize: '',
    currentHeating: '',
    message: '',
    preferredContact: ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
    alert('Thank you for your inquiry! We will contact you within 24 hours.')
  }

  const contactMethods = [
    {
      icon: <Phone className="h-6 w-6 text-blue-600" />,
      title: "Phone",
      value: "(555) 123-4567",
      description: "Call us for immediate assistance"
    },
    {
      icon: <Mail className="h-6 w-6 text-green-600" />,
      title: "Email",
      value: "info@geo-pioneer.com",
      description: "Send us your questions anytime"
    },
    {
      icon: <MapPin className="h-6 w-6 text-purple-600" />,
      title: "Service Area",
      value: "Massachusetts",
      description: "Serving all of Massachusetts"
    },
    {
      icon: <Clock className="h-6 w-6 text-orange-600" />,
      title: "Business Hours",
      value: "Mon-Fri 8AM-6PM",
      description: "Emergency service available"
    }
  ]

  const quickActions = [
    {
      title: "Calculate Savings",
      description: "Get instant estimates for your home",
      icon: <Calculator className="h-8 w-8 text-blue-600" />,
      action: "calculator",
      buttonText: "Use Calculator"
    },
    {
      title: "Schedule Assessment",
      description: "Book a free on-site evaluation",
      icon: <FileText className="h-8 w-8 text-green-600" />,
      action: "assessment",
      buttonText: "Schedule Now"
    },
    {
      title: "Emergency Service",
      description: "24/7 support for existing customers",
      icon: <Phone className="h-8 w-8 text-red-600" />,
      action: "emergency",
      buttonText: "Call Emergency"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Contact <span className="text-blue-600">GeoPioneer</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Ready to start your geothermal journey? Get in touch with Massachusetts' 
            leading geothermal installation experts.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactMethods.map((method, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-3">
                    {method.icon}
                  </div>
                  <CardTitle className="text-lg">{method.title}</CardTitle>
                  <div className="font-semibold text-gray-900">{method.value}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{method.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <p className="text-lg text-gray-600">
              Get started with these helpful tools and services
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {quickActions.map((action, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {action.icon}
                  </div>
                  <CardTitle className="text-xl">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    variant={action.action === 'emergency' ? 'destructive' : 'default'}
                  >
                    {action.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Your Free Consultation</h2>
            <p className="text-lg text-gray-600">
              Fill out the form below and we'll contact you within 24 hours to discuss your geothermal project
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Project Information
              </CardTitle>
              <CardDescription>
                Tell us about your home and energy needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                    <Select value={formData.preferredContact} onValueChange={(value) => handleInputChange('preferredContact', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="text">Text Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Property Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main St, Boston, MA 02101"
                  />
                </div>

                {/* Project Details */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="projectType">Project Type</Label>
                    <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing-home">Existing Home Retrofit</SelectItem>
                        <SelectItem value="new-construction">New Construction</SelectItem>
                        <SelectItem value="replacement">System Replacement</SelectItem>
                        <SelectItem value="consultation">General Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="homeSize">Home Size (sq ft)</Label>
                    <Input
                      id="homeSize"
                      value={formData.homeSize}
                      onChange={(e) => handleInputChange('homeSize', e.target.value)}
                      placeholder="e.g., 2500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentHeating">Current Heating</Label>
                    <Select value={formData.currentHeating} onValueChange={(value) => handleInputChange('currentHeating', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oil">Heating Oil</SelectItem>
                        <SelectItem value="propane">Propane</SelectItem>
                        <SelectItem value="natural-gas">Natural Gas</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Additional Information</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Tell us about your project goals, timeline, or any specific questions you have..."
                    rows={4}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Submit Request
                  </Button>
                  <Button type="button" size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Instead: (555) 123-4567
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Service Area Map */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Service Area</h2>
            <p className="text-lg text-gray-600">
              We proudly serve homeowners and builders throughout Massachusetts
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Coverage Areas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Greater Boston</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Boston</li>
                    <li>Cambridge</li>
                    <li>Somerville</li>
                    <li>Newton</li>
                    <li>Brookline</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">MetroWest</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Framingham</li>
                    <li>Natick</li>
                    <li>Wellesley</li>
                    <li>Weston</li>
                    <li>Wayland</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">North Shore</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Salem</li>
                    <li>Beverly</li>
                    <li>Marblehead</li>
                    <li>Gloucester</li>
                    <li>Newburyport</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">South Shore</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Quincy</li>
                    <li>Hingham</li>
                    <li>Cohasset</li>
                    <li>Scituate</li>
                    <li>Plymouth</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Free Site Assessment</h3>
              <p className="text-gray-600 mb-4">
                We provide complimentary on-site evaluations throughout our service area to assess:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Property suitability for geothermal</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Optimal drilling locations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>System sizing requirements</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Accurate cost estimates</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage
