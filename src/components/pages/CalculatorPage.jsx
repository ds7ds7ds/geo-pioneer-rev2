import React, { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Calculator, Home, Building, DollarSign, Zap, Leaf, TrendingUp, BarChart3 } from 'lucide-react'

// Chart Components
const CapexComparisonChart = ({ data }) => {
  const systems = Object.entries(data).sort(([,a], [,b]) => a - b)
  const maxCost = Math.max(...Object.values(data))
  
  return (
    <div className="space-y-6">
      <h4 className="font-semibold text-gray-900">System Cost Comparison</h4>
      
      {/* Bar Chart */}
      <div className="relative h-64 bg-gray-50 rounded-lg p-4">
        <div className="flex items-end justify-between h-full space-x-2">
          {systems.map(([system, cost], index) => {
            const height = (cost / maxCost) * 100
            const isGeothermal = system === 'Geothermal'
            const shortName = system.replace(' + AC', '').replace('Natural Gas', 'Gas')
            
            return (
              <div key={system} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center mb-2">
                  <span className={`text-xs font-bold mb-1 ${isGeothermal ? 'text-green-600' : 'text-gray-700'}`}>
                    ${Math.round(cost / 1000)}K
                  </span>
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-1000 ${
                      isGeothermal 
                        ? 'bg-gradient-to-t from-green-500 to-green-400' 
                        : 'bg-gradient-to-t from-gray-400 to-gray-300'
                    }`}
                    style={{ height: `${height}%`, minHeight: '20px' }}
                  />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {shortName}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-700 font-medium">Geothermal</div>
          <div className="text-lg font-bold text-green-800">
            ${Math.round(data.Geothermal / 1000)}K
          </div>
          <div className="text-xs text-green-600">After incentives</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-700 font-medium">Avg Alternative</div>
          <div className="text-lg font-bold text-gray-800">
            ${Math.round(Object.values(data).filter((_, i) => Object.keys(data)[i] !== 'Geothermal').reduce((a, b) => a + b, 0) / (Object.keys(data).length - 1) / 1000)}K
          </div>
          <div className="text-xs text-gray-600">Before any rebates</div>
        </div>
      </div>
    </div>
  )
}

const ROIChart = ({ data }) => {
  // Extended timeline for GSHP vs other systems
  const years = [0, 5, 10, 15, 20, 25, 30]
  const dataPoints = years.map(year => ({
    year,
    savings: year === 0 ? -data.netCost : (data.cumulativeSavings * year) - data.netCost,
    cumulativeSavings: year === 0 ? 0 : data.cumulativeSavings * year
  }))
  
  // Find break-even point
  const breakEvenYear = data.netCost / data.cumulativeSavings
  const maxValue = Math.max(...dataPoints.map(p => p.savings), 0)
  const minValue = Math.min(...dataPoints.map(p => p.savings), 0)
  const range = maxValue - minValue
  
  return (
    <div className="space-y-6">
      <h4 className="font-semibold text-gray-900">Return on Investment Timeline</h4>
      
      {/* Simple Line Graph */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {/* Chart Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">Cumulative Cash Flow Over Time</div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Investment Period</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Profit Period</span>
            </div>
          </div>
        </div>
        
        {/* Line Chart Area */}
        <div className="relative h-80 bg-gray-50 rounded-lg p-6">
          {/* Background grid */}
          <div className="absolute inset-6">
            {[0, 25, 50, 75, 100].map(percent => (
              <div key={percent} className="absolute w-full border-t border-gray-200" 
                   style={{ top: `${percent}%` }}></div>
            ))}
          </div>
          
          {/* Zero line - positioned at 50% (middle) */}
          <div className="absolute w-full border-t-2 border-gray-600 border-dashed z-10" 
               style={{ 
                 top: '50%',
                 left: '24px',
                 right: '24px'
               }}>
            <span className="absolute -left-16 -top-3 text-xs font-medium text-gray-700 bg-white px-2 rounded">
              $0
            </span>
          </div>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-6 bottom-6 flex flex-col justify-between text-xs text-gray-600">
            <span>${Math.round(maxValue / 1000)}K</span>
            <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>$0</span>
            <span>${Math.round(minValue / 1000)}K</span>
          </div>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-6 right-6 flex justify-between text-xs text-gray-600">
            {years.map((year, index) => (
              <span 
                key={year} 
                style={{ 
                  marginLeft: index === 0 ? '36px' : '0' // Shift Year 0 right by 0.5 inches (36px)
                }}
              >
                Year {year}
              </span>
            ))}
          </div>
          
          {/* Line Graph */}
          <svg className="absolute inset-6 w-full h-full" style={{ width: 'calc(100% - 48px)', height: 'calc(100% - 48px)' }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset={`${(breakEvenYear / 30) * 100}%`} stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            
            {/* Area under curve (positive values only) */}
            <path
              d={`M ${dataPoints.map((point, index) => {
                const x = (index / (dataPoints.length - 1)) * 100
                const y = 50 + ((point.savings / Math.max(Math.abs(maxValue), Math.abs(minValue))) * 35) // Center around 50% with ±35% range
                return `${index === 0 ? 'M' : 'L'} ${x}% ${Math.max(y, 50)}%`
              }).join(' ')} L 100% 50% L 0% 50% Z`}
              fill="url(#areaGradient)"
              className="opacity-50"
            />
            
            {/* Main line */}
            <polyline
              points={dataPoints.map((point, index) => {
                const x = (index / (dataPoints.length - 1)) * 100
                const y = 50 - ((point.savings / Math.max(Math.abs(maxValue), Math.abs(minValue))) * 35) // Center around 50% with ±35% range
                return `${x}%,${y}%`
              }).join(' ')}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              className="drop-shadow-sm"
            />
            
            {/* Data points */}
            {dataPoints.map((point, index) => {
              const x = (index / (dataPoints.length - 1)) * 100
              const y = 50 - ((point.savings / Math.max(Math.abs(maxValue), Math.abs(minValue))) * 35) // Center around 50% with ±35% range
              const isPositive = point.savings >= 0
              
              return (
                <g key={index}>
                  {/* Line from data point to zero line */}
                  <line
                    x1={`${x}%`}
                    y1={`${y}%`}
                    x2={`${x}%`}
                    y2="50%"
                    stroke={isPositive ? "#10b981" : "#ef4444"}
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity="0.5"
                  />
                  
                  {/* Point circle */}
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="6"
                    fill={isPositive ? "#10b981" : "#ef4444"}
                    stroke="white"
                    strokeWidth="2"
                    className="drop-shadow-sm hover:r-8 transition-all cursor-pointer"
                  />
                  
                  {/* Value label */}
                  <text
                    x={`${x}%`}
                    y={`${y < 50 ? y - 15 : y + 20}%`}
                    textAnchor="middle"
                    className={`text-xs font-bold fill-current ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {isPositive ? '+' : ''}${Math.round(point.savings / 1000)}K
                  </text>
                </g>
              )
            })}
            
            {/* Break-even indicator */}
            <line
              x1={`${(breakEvenYear / 30) * 100}%`}
              y1="0%"
              x2={`${(breakEvenYear / 30) * 100}%`}
              y2="100%"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="opacity-70"
            />
          </svg>
          
          {/* Break-even label */}
          <div 
            className="absolute top-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded"
            style={{ left: `${24 + (breakEvenYear / 30) * (100 - 48)}%` }}
          >
            Break-even: {breakEvenYear.toFixed(1)} years
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="group text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm text-red-700 font-medium mb-1">Initial Investment</div>
            <div className="text-2xl font-bold text-red-800">${Math.round(data.netCost / 1000)}K</div>
            <div className="text-xs text-red-600 mt-1">After incentives</div>
          </div>
          <div className="group text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm text-blue-700 font-medium mb-1">Annual Savings</div>
            <div className="text-2xl font-bold text-blue-800">${Math.round(data.cumulativeSavings / 1000)}K</div>
            <div className="text-xs text-blue-600 mt-1">Every year</div>
          </div>
          <div className="group text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm text-green-700 font-medium mb-1">30-Year Return</div>
            <div className="text-2xl font-bold text-green-800">
              ${Math.round(dataPoints[dataPoints.length - 1].savings / 1000)}K
            </div>
            <div className="text-xs text-green-600 mt-1">Total profit</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const LifetimeCostChart = ({ data }) => {
  const systems = [data.geothermal, data.conventional]
  const maxCost = Math.max(...systems.map(s => s.totalLifetimeCost))
  
  return (
    <div className="space-y-6">
      <h4 className="font-semibold text-gray-900">30-Year Total Cost of Ownership</h4>
      
      {/* Bar Chart */}
      <div className="relative h-64 bg-gray-50 rounded-lg p-4">
        <div className="flex items-end justify-between h-full space-x-4">
          {systems.map((system, index) => {
            const height = (system.totalLifetimeCost / maxCost) * 100
            const isGeothermal = system.name.includes('Geothermal')
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center mb-2">
                  <span className={`text-xs font-bold mb-1 ${isGeothermal ? 'text-green-600' : 'text-red-700'}`}>
                    ${Math.round(system.totalLifetimeCost / 1000)}K
                  </span>
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-1000 relative ${
                      isGeothermal 
                        ? 'bg-gradient-to-t from-green-500 to-green-400' 
                        : 'bg-gradient-to-t from-red-500 to-red-400'
                    }`}
                    style={{ height: `${height}%`, minHeight: '20px' }}
                  >
                    {/* Show replacement indicator for conventional systems */}
                    {!isGeothermal && (
                      <div className="absolute top-1/2 left-0 right-0 border-t-2 border-yellow-400 border-dashed">
                        <span className="absolute -right-2 -top-3 text-xs bg-yellow-100 px-1 rounded text-yellow-800">
                          Replace
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-800 leading-tight mb-1">
                    {system.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {system.lifespan} year lifespan
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Cost Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-800 mb-2">Geothermal GSHP</div>
          <div className="space-y-1 text-xs text-green-700">
            <div className="flex justify-between">
              <span>Initial Cost:</span>
              <span>${Math.round(data.geothermal.upfrontCost / 1000)}K</span>
            </div>
            <div className="flex justify-between">
              <span>30yr Operating:</span>
              <span>${Math.round((data.geothermal.annualCost * 30) / 1000)}K</span>
            </div>
            <div className="flex justify-between">
              <span>Replacements:</span>
              <span>$0K</span>
            </div>
            <hr className="border-green-300" />
            <div className="flex justify-between font-semibold">
              <span>Total 30yr:</span>
              <span>${Math.round(data.geothermal.totalLifetimeCost / 1000)}K</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm font-medium text-red-800 mb-2">{data.conventional.name}</div>
          <div className="space-y-1 text-xs text-red-700">
            <div className="flex justify-between">
              <span>Initial Cost:</span>
              <span>${Math.round(data.conventional.upfrontCost / 1000)}K</span>
            </div>
            <div className="flex justify-between">
              <span>30yr Operating:</span>
              <span>${Math.round((data.conventional.annualCost * 30) / 1000)}K</span>
            </div>
            <div className="flex justify-between">
              <span>Replacement (15yr):</span>
              <span>${Math.round(data.conventional.replacementCost / 1000)}K</span>
            </div>
            <hr className="border-red-300" />
            <div className="flex justify-between font-semibold">
              <span>Total 30yr:</span>
              <span>${Math.round(data.conventional.totalLifetimeCost / 1000)}K</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Savings Summary */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <div className="text-sm font-medium text-blue-800">30-Year Lifetime Savings</div>
          <div className="text-2xl font-bold text-blue-600">
            ${Math.round((data.conventional.totalLifetimeCost - data.geothermal.totalLifetimeCost) / 1000)}K
          </div>
          <div className="text-xs text-blue-700">
            Geothermal saves {Math.round(((data.conventional.totalLifetimeCost - data.geothermal.totalLifetimeCost) / data.conventional.totalLifetimeCost) * 100)}% over conventional systems
          </div>
        </div>
      </div>
    </div>
  )
}

const CalculatorPage = () => {
  const [activeTab, setActiveTab] = useState('existing')
  const [calculatorData, setCalculatorData] = useState({
    // Common fields
    squareFootage: '',
    zipCode: '',
    
    // Current system
    heatingFuel: '',
    coolingSystem: '',
    annualHeatingCost: '',
    annualElectricityCost: '',
    
    // New construction specific
    homeType: '',
    constructionTier: '',
    
    // Contact (optional)
    name: '',
    email: '',
    phone: ''
  })
  
  const [results, setResults] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [assessmentData, setAssessmentData] = useState({
    assessmentType: 'full', // 'full' or 'consultation'
    propertyAddress: '',
    timeframe: '',
    additionalInfo: ''
  })

  // Massachusetts energy prices
  const energyPrices = {
    electricity: 0.35, // $/kWh
    naturalGas: 1.50,  // $/therm
    heatingOil: 3.44,  // $/gallon
    propane: 3.50      // $/gallon
  }

  // Geothermal COP values
  const geothermalCOP = {
    heating: 4.2, // Winter COP
    cooling: 6.5  // Summer COP
  }

  const calculateSavings = () => {
    const sqft = parseInt(calculatorData.squareFootage) || 0
    const heatingCost = parseFloat(calculatorData.annualHeatingCost) || 0
    const electricityCost = parseFloat(calculatorData.annualElectricityCost) || 0
    
    // Validation
    if (sqft === 0) {
      alert('Please enter your home square footage')
      return
    }
    
    if (!calculatorData.heatingFuel) {
      alert('Please select your current heating fuel type')
      return
    }
    
    if (heatingCost === 0) {
      alert('Please enter your annual heating cost')
      return
    }
    
    console.log('Calculating savings with:', { sqft, heatingCost, electricityCost, heatingFuel: calculatorData.heatingFuel })

    // Calculate current total energy costs
    const currentAnnualCost = heatingCost + electricityCost

    // Estimate geothermal energy consumption
    // Typical home uses ~12-15 kWh per sq ft annually for HVAC
    const estimatedAnnualKWh = sqft * 13 // Conservative estimate
    
    // Geothermal efficiency factor (compared to conventional systems)
    let efficiencyFactor = 1
    switch (calculatorData.heatingFuel) {
      case 'oil':
        efficiencyFactor = 0.35 // 65% more efficient
        break
      case 'propane':
        efficiencyFactor = 0.30 // 70% more efficient
        break
      case 'electric':
        efficiencyFactor = 0.40 // 60% more efficient
        break
      case 'naturalGas':
        efficiencyFactor = 0.45 // 55% more efficient
        break
      default:
        efficiencyFactor = 0.35
    }

    const geothermalAnnualKWh = estimatedAnnualKWh * efficiencyFactor
    const geothermalAnnualCost = geothermalAnnualKWh * energyPrices.electricity

    // Calculate savings
    const annualSavings = currentAnnualCost - geothermalAnnualCost
    const monthlySavings = annualSavings / 12
    const tenYearSavings = annualSavings * 10
    const twentyFiveYearSavings = annualSavings * 25

    // Energy reduction percentage
    const energyReduction = Math.round((1 - efficiencyFactor) * 100)

    // System costs (estimates)
    const systemCostBase = sqft * 25 // $25 per sq ft base cost
    const massSaveRebate = 15000
    const federalTaxCredit = systemCostBase * 0.30
    const netSystemCost = systemCostBase - massSaveRebate - federalTaxCredit

    // Payback period
    const paybackYears = netSystemCost / annualSavings

    // CAPEX Comparison Data
    const capexComparison = {
      'Geothermal': Math.round(netSystemCost),
      'Propane + AC': activeTab === 'new-construction' ? 48000 : Math.round(sqft * 12),
      'ASHP': activeTab === 'new-construction' ? 60000 : Math.round(sqft * 15),
      'Natural Gas + AC': Math.round(sqft * 10)
    }

    // ROI Chart Data
    const roiData = {
      netCost: netSystemCost,
      cumulativeSavings: annualSavings
    }

    // Lifetime Cost Comparison Data (GSHP 25-50 years vs others 10-15 years)
    const lifetimeCostData = {
      geothermal: {
        name: 'Geothermal GSHP',
        lifespan: 30,
        upfrontCost: netSystemCost,
        annualCost: geothermalAnnualCost,
        replacementCost: 0, // No replacement needed in 30 years
        totalLifetimeCost: netSystemCost + (geothermalAnnualCost * 30)
      },
      conventional: {
        name: calculatorData.heatingFuel === 'oil' ? 'Oil Furnace + AC' : 
              calculatorData.heatingFuel === 'propane' ? 'Propane Furnace + AC' :
              calculatorData.heatingFuel === 'naturalGas' ? 'Gas Furnace + AC' : 'Electric Heat + AC',
        lifespan: 15,
        upfrontCost: sqft * 8, // Lower upfront cost
        annualCost: currentAnnualCost,
        replacementCost: sqft * 8, // Need replacement after 15 years
        totalLifetimeCost: (sqft * 8) + (currentAnnualCost * 15) + (sqft * 8) + (currentAnnualCost * 15) // 30 years total
      }
    }

    // For new construction, compare with alternatives
    let newConstructionComparison = null
    if (activeTab === 'new-construction') {
      const propaneSystemCost = 48000
      const ashpSystemCost = 60000
      const geothermalSystemCost = Math.round(netSystemCost)
      
      newConstructionComparison = {
        propane: {
          upfrontCost: propaneSystemCost,
          annualCost: 9600,
          tenYearTotal: propaneSystemCost + (9600 * 10)
        },
        ashp: {
          upfrontCost: ashpSystemCost,
          annualCost: 8600,
          tenYearTotal: ashpSystemCost + (8600 * 10)
        },
        geothermal: {
          upfrontCost: geothermalSystemCost,
          annualCost: geothermalAnnualCost,
          tenYearTotal: geothermalSystemCost + (geothermalAnnualCost * 10)
        }
      }
    }

    setResults({
      currentAnnualCost,
      geothermalAnnualCost,
      annualSavings,
      monthlySavings,
      tenYearSavings,
      twentyFiveYearSavings,
      energyReduction,
      systemCostBase,
      massSaveRebate,
      federalTaxCredit,
      netSystemCost,
      paybackYears,
      newConstructionComparison,
      capexComparison,
      roiData,
      lifetimeCostData
    })
    setShowResults(true)
  }

  const handleInputChange = (field, value) => {
    setCalculatorData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAssessmentChange = (field, value) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAssessmentSubmit = () => {
    // Validate required fields
    if (!calculatorData.name || !calculatorData.email || !calculatorData.phone) {
      alert('Please fill in all required contact information (Name, Email, Phone)')
      return
    }

    // Prepare assessment data
    const assessmentRequest = {
      contactInfo: {
        name: calculatorData.name,
        email: calculatorData.email,
        phone: calculatorData.phone
      },
      projectType: activeTab,
      assessmentType: assessmentData.assessmentType,
      propertyDetails: {
        address: assessmentData.propertyAddress,
        squareFootage: calculatorData.squareFootage,
        zipCode: calculatorData.zipCode
      },
      currentSystem: {
        heatingFuel: calculatorData.heatingFuel,
        coolingSystem: calculatorData.coolingSystem,
        annualHeatingCost: calculatorData.annualHeatingCost,
        annualElectricityCost: calculatorData.annualElectricityCost
      },
      projectInfo: {
        timeframe: assessmentData.timeframe,
        additionalInfo: assessmentData.additionalInfo
      },
      calculatorResults: results
    }

    // In a real application, this would send to your backend
    console.log('Assessment Request:', assessmentRequest)
    
    // Show success message
    alert(`Thank you ${calculatorData.name}! Your free assessment request has been submitted. We'll contact you within 24 hours to schedule your ${assessmentData.assessmentType === 'full' ? 'comprehensive site assessment' : 'consultation call'}.`)
  }

  const handleDownloadReport = () => {
    if (!results) {
      alert('Please calculate your savings first to generate a report.')
      return
    }

    // In a real application, this would generate and download a PDF report
    const reportData = {
      projectType: activeTab,
      calculatorData,
      results,
      timestamp: new Date().toISOString()
    }
    
    console.log('Report Data:', reportData)
    alert('Report download functionality will be implemented. Your calculation results have been logged.')
  }

  const renderExistingHomesCalculator = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="squareFootage">Home Square Footage *</Label>
          <Input
            id="squareFootage"
            type="number"
            placeholder="e.g., 2500"
            value={calculatorData.squareFootage}
            onChange={(e) => handleInputChange('squareFootage', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            placeholder="e.g., 02101"
            value={calculatorData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="heatingFuel">Current Heating Fuel *</Label>
          <Select value={calculatorData.heatingFuel} onValueChange={(value) => handleInputChange('heatingFuel', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select heating fuel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oil">Heating Oil</SelectItem>
              <SelectItem value="propane">Propane</SelectItem>
              <SelectItem value="naturalGas">Natural Gas</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="coolingSystem">Current Cooling System</Label>
          <Select value={calculatorData.coolingSystem} onValueChange={(value) => handleInputChange('coolingSystem', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select cooling system" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="central-ac">Central Air Conditioning</SelectItem>
              <SelectItem value="window-units">Window Units</SelectItem>
              <SelectItem value="none">No Cooling System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="annualHeatingCost">Annual Heating Cost *</Label>
          <Input
            id="annualHeatingCost"
            type="number"
            placeholder="e.g., 3500"
            value={calculatorData.annualHeatingCost}
            onChange={(e) => handleInputChange('annualHeatingCost', e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-1">Your total yearly heating bill</p>
        </div>
        <div>
          <Label htmlFor="annualElectricityCost">Annual Electricity Cost</Label>
          <Input
            id="annualElectricityCost"
            type="number"
            placeholder="e.g., 2400"
            value={calculatorData.annualElectricityCost}
            onChange={(e) => handleInputChange('annualElectricityCost', e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-1">Your total yearly electricity bill</p>
        </div>
      </div>
    </div>
  )

  const renderNewConstructionCalculator = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="squareFootage">Home Square Footage *</Label>
          <Input
            id="squareFootage"
            type="number"
            placeholder="e.g., 4000"
            value={calculatorData.squareFootage}
            onChange={(e) => handleInputChange('squareFootage', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="homeType">Home Type</Label>
          <Select value={calculatorData.homeType} onValueChange={(value) => handleInputChange('homeType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select home type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single-family">Single Family</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="custom">Custom Home</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="constructionTier">Construction Efficiency Tier</Label>
          <Select value={calculatorData.constructionTier} onValueChange={(value) => handleInputChange('constructionTier', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select efficiency tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tier1">Tier 1 (Standard)</SelectItem>
              <SelectItem value="tier2">Tier 2 (High Efficiency)</SelectItem>
              <SelectItem value="tier3">Tier 3 (Premium)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            placeholder="e.g., 02101"
            value={calculatorData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="heatingFuel">Compare Against</Label>
          <Select value={calculatorData.heatingFuel} onValueChange={(value) => handleInputChange('heatingFuel', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select system to compare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="propane">Propane + AC</SelectItem>
              <SelectItem value="naturalGas">Natural Gas + AC</SelectItem>
              <SelectItem value="electric">Air Source Heat Pump</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">New Construction Benefits</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Maximize federal and state incentives</li>
          <li>• No retrofit complications or existing system removal</li>
          <li>• Optimal system sizing and integration</li>
          <li>• Potential for GaaS (Geo as a Service) model</li>
        </ul>
      </div>
    </div>
  )

  const renderResults = () => {
    if (!results) return null

    return (
      <div className="space-y-8">
        {/* Energy Savings Highlight */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-800">Energy Savings</CardTitle>
            <div className="text-4xl font-bold text-green-600">{results.energyReduction}%</div>
            <CardDescription className="text-green-700">
              Energy reduction compared to your current system
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Cost Savings */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Monthly Savings</CardTitle>
              <div className="text-2xl font-bold text-blue-600">
                ${Math.round(results.monthlySavings).toLocaleString()}
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Annual Savings</CardTitle>
              <div className="text-2xl font-bold text-blue-600">
                ${Math.round(results.annualSavings).toLocaleString()}
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">25-Year Savings</CardTitle>
              <div className="text-2xl font-bold text-blue-600">
                ${Math.round(results.twentyFiveYearSavings).toLocaleString()}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* System Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>System Cost & Incentives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Base System Cost:</span>
                <span className="font-semibold">${results.systemCostBase.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>MassSave Rebate:</span>
                <span className="font-semibold">-${results.massSaveRebate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Federal Tax Credit (30%):</span>
                <span className="font-semibold">-${Math.round(results.federalTaxCredit).toLocaleString()}</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>Net System Cost:</span>
                <span>${Math.round(results.netSystemCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Payback Period:</span>
                <span>{results.paybackYears.toFixed(1)} years</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Construction Comparison */}
        {activeTab === 'new-construction' && results.newConstructionComparison && (
          <Card>
            <CardHeader>
              <CardTitle>10-Year Total Cost Comparison</CardTitle>
              <CardDescription>Upfront cost + 10 years of operating costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800">Geothermal</h4>
                    <div className="text-2xl font-bold text-green-600">
                      ${Math.round(results.newConstructionComparison.geothermal.tenYearTotal).toLocaleString()}
                    </div>
                    <Badge className="bg-green-600 text-white mt-2">Best Value</Badge>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800">Propane + AC</h4>
                    <div className="text-2xl font-bold text-gray-600">
                      ${Math.round(results.newConstructionComparison.propane.tenYearTotal).toLocaleString()}
                    </div>
                    <div className="text-sm text-red-600 mt-2">
                      +${Math.round(results.newConstructionComparison.propane.tenYearTotal - results.newConstructionComparison.geothermal.tenYearTotal).toLocaleString()} more
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800">Air Source HP</h4>
                    <div className="text-2xl font-bold text-gray-600">
                      ${Math.round(results.newConstructionComparison.ashp.tenYearTotal).toLocaleString()}
                    </div>
                    <div className="text-sm text-red-600 mt-2">
                      +${Math.round(results.newConstructionComparison.ashp.tenYearTotal - results.newConstructionComparison.geothermal.tenYearTotal).toLocaleString()} more
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <div className="space-y-6">
          {/* ROI Chart - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Return on Investment Timeline
              </CardTitle>
              <CardDescription>
                See your savings grow over time (30-year projection)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ROIChart data={results.roiData} />
            </CardContent>
          </Card>

          {/* Side by Side Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Investment Comparison
                </CardTitle>
                <CardDescription>
                  Compare upfront costs across heating systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CapexComparisonChart data={results.capexComparison} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-purple-600" />
                  30-Year Lifetime Cost
                </CardTitle>
                <CardDescription>
                  Total cost including replacements (GSHP 30yr vs Conventional 15yr lifespan)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LifetimeCostChart data={results.lifetimeCostData} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Free Assessment Section */}
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-cyan-800">Get Your Free Assessment</CardTitle>
            <CardDescription className="text-cyan-700">
              Receive a comprehensive site evaluation and personalized geothermal plan for your {activeTab === 'existing' ? 'existing home' : 'new construction project'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Assessment Type Selection */}
            <div className="mb-6">
              <Label className="text-base font-semibold text-gray-800 mb-3 block">
                What type of assessment do you need?
              </Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 border-2 rounded-lg hover:border-cyan-400 transition-colors cursor-pointer bg-white ${
                    assessmentData.assessmentType === 'full' ? 'border-cyan-400' : 'border-cyan-200'
                  }`}
                  onClick={() => handleAssessmentChange('assessmentType', 'full')}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 border-2 border-cyan-400 rounded-full mt-1 flex items-center justify-center">
                      {assessmentData.assessmentType === 'full' && <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {activeTab === 'existing' ? 'Home Retrofit Assessment' : 'New Construction Planning'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {activeTab === 'existing' 
                          ? 'Evaluate your existing home for geothermal retrofit potential, including soil analysis and system sizing'
                          : 'Complete geothermal system design and integration planning for your new construction project'
                        }
                      </p>
                      <ul className="mt-2 text-xs text-gray-500 space-y-1">
                        {activeTab === 'existing' ? (
                          <>
                            <li>• Site survey and soil analysis</li>
                            <li>• Existing system evaluation</li>
                            <li>• Retrofit feasibility study</li>
                            <li>• Detailed cost estimate</li>
                          </>
                        ) : (
                          <>
                            <li>• Site planning and design</li>
                            <li>• System sizing and layout</li>
                            <li>• Construction coordination</li>
                            <li>• Permit assistance</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 border-2 rounded-lg hover:border-gray-400 transition-colors cursor-pointer bg-white ${
                    assessmentData.assessmentType === 'consultation' ? 'border-gray-400' : 'border-gray-200'
                  }`}
                  onClick={() => handleAssessmentChange('assessmentType', 'consultation')}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 border-2 border-gray-400 rounded-full mt-1 flex items-center justify-center">
                      {assessmentData.assessmentType === 'consultation' && <div className="w-3 h-3 bg-gray-400 rounded-full"></div>}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Consultation Only</h4>
                      <p className="text-sm text-gray-600">
                        Initial consultation to discuss options, answer questions, and provide general guidance
                      </p>
                      <ul className="mt-2 text-xs text-gray-500 space-y-1">
                        <li>• 30-minute phone/video call</li>
                        <li>• General feasibility discussion</li>
                        <li>• Cost range estimates</li>
                        <li>• Next steps planning</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={calculatorData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={calculatorData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="(555) 123-4567"
                  value={calculatorData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Property Details */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="propertyAddress">Property Address</Label>
                <Input
                  id="propertyAddress"
                  placeholder="123 Main St, City, State, ZIP"
                  value={assessmentData.propertyAddress}
                  onChange={(e) => handleAssessmentChange('propertyAddress', e.target.value)}
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
              <div>
                <Label htmlFor="timeframe">Project Timeframe</Label>
                <Select value={assessmentData.timeframe} onValueChange={(value) => handleAssessmentChange('timeframe', value)}>
                  <SelectTrigger className="border-cyan-200 focus:border-cyan-400">
                    <SelectValue placeholder="When are you planning?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Within 3 months</SelectItem>
                    <SelectItem value="soon">3-6 months</SelectItem>
                    <SelectItem value="planning">6-12 months</SelectItem>
                    <SelectItem value="future">More than 1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mb-6">
              <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
              <textarea
                id="additionalInfo"
                placeholder={activeTab === 'existing' 
                  ? "Tell us about your current heating/cooling system, any specific concerns, or questions you have..."
                  : "Tell us about your construction project, timeline, builder information, or any specific requirements..."
                }
                value={assessmentData.additionalInfo}
                onChange={(e) => handleAssessmentChange('additionalInfo', e.target.value)}
                className="w-full p-3 border border-cyan-200 rounded-md focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200 resize-none"
                rows="4"
              />
            </div>

            {/* Assessment Benefits */}
            <div className="bg-white p-4 rounded-lg border border-cyan-200 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">What You'll Receive:</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Detailed site evaluation report</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Custom system design and sizing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Accurate cost estimates</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Financing and incentive guidance</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Timeline and project planning</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>No obligation consultation</span>
                  </div>
                </div>
              </div>
            </div>



            {/* Trust Indicators */}
            <div className="mt-6 pt-6 border-t border-cyan-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-cyan-600">500+</div>
                  <div className="text-xs text-gray-600">Homes Assessed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-600">15+</div>
                  <div className="text-xs text-gray-600">Years Experience</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-600">100%</div>
                  <div className="text-xs text-gray-600">Free Assessment</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Calculator className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Geothermal Savings Calculator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover how much you can save with geothermal heating and cooling. 
            Get personalized calculations for your home or new construction project.
          </p>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="existing" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Existing Homes
              </TabsTrigger>
              <TabsTrigger value="new-construction" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                New Construction
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    Existing Home Renovation Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate savings from retrofitting your existing home with geothermal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderExistingHomesCalculator()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="new-construction">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-green-600" />
                    New Construction Calculator
                  </CardTitle>
                  <CardDescription>
                    Compare geothermal costs and savings for new construction projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderNewConstructionCalculator()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>



          {/* Results */}
          {showResults && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Your Geothermal Savings Report
              </h2>
              {renderResults()}
              
              {/* Simple Assessment Form */}
              <Card className="mt-8 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl text-green-800">Get Your Detailed Assessment Report</CardTitle>
                  <CardDescription className="text-green-700">
                    Download a comprehensive PDF report with your calculations and next steps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label htmlFor="reportName">Full Name *</Label>
                      <Input
                        id="reportName"
                        placeholder="Your full name"
                        value={assessmentData.name}
                        onChange={(e) => handleAssessmentChange('name', e.target.value)}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reportEmail">Email Address *</Label>
                      <Input
                        id="reportEmail"
                        type="email"
                        placeholder="your.email@example.com"
                        value={assessmentData.email}
                        onChange={(e) => handleAssessmentChange('email', e.target.value)}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label htmlFor="reportPhone">Phone Number *</Label>
                      <Input
                        id="reportPhone"
                        placeholder="(555) 123-4567"
                        value={assessmentData.phone}
                        onChange={(e) => handleAssessmentChange('phone', e.target.value)}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reportAddress">Property Address</Label>
                      <Input
                        id="reportAddress"
                        placeholder="123 Main St, City, State"
                        value={assessmentData.address}
                        onChange={(e) => handleAssessmentChange('address', e.target.value)}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Button 
                      size="lg"
                      onClick={async () => {
                        // Validate required fields
                        if (!assessmentData.name || !assessmentData.email || !assessmentData.phone) {
                          alert('Please fill in your name, email, and phone number to generate the report.')
                          return
                        }
                        
                        // Prepare form data
                        const formData = {
                          name: assessmentData.name,
                          email: assessmentData.email,
                          phone: assessmentData.phone,
                          address: assessmentData.address,
                          squareFootage: formState.squareFootage,
                          heatingFuel: formState.heatingFuel,
                          annualHeatingCost: formState.annualHeatingCost,
                          annualElectricityCost: formState.annualElectricityCost,
                          zipCode: formState.zipCode,
                          calculationResults: results,
                          submissionDate: new Date().toLocaleDateString(),
                          submissionTime: new Date().toLocaleTimeString(),
                          assessmentType: 'Calculator Assessment'
                        }
                        
                        // Generate and download PDF report
                        try {
                          const { generateAndSendReport } = await import('../../services/reportService.js')
                          const result = await generateAndSendReport(formData, 'calculator')
                          
                          if (result.success) {
                            alert(`Thank you ${formData.name}! 

Your comprehensive savings assessment report has been generated and downloaded.

Report ID: ${result.reportId}

The report includes:
✅ Your calculated savings: $${results?.annualSavings?.toLocaleString() || '0'}/year
✅ ROI analysis and break-even timeline
✅ Available rebates and incentives (up to $30,000 total)
✅ Step-by-step installation process

Email notification sent to: ${formData.email}
CC: info@geopioneer.com

We'll contact you within 24 hours to schedule your on-site evaluation.`)
                          } else {
                            alert(`Error: ${result.message}. Please try again or contact us directly at (555) 123-4567.`)
                          }
                        } catch (error) {
                          console.error('Report generation error:', error)
                          alert('There was an issue generating your report. Please try again or contact us directly at (555) 123-4567.')
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                    >
                      📄 Generate Report & Submit Assessment
                    </Button>
                  </div>
                  
                  <div className="mt-4 text-center text-sm text-gray-600">
                    <p>Your report will include detailed savings calculations, available rebates, and installation timeline.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

          {/* Calculate Button */}
          <div className="mt-8 text-center">
            <Button 
              size="lg" 
              onClick={calculateSavings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3"
            >
              Calculate My Savings
            </Button>
          </div>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Our Calculator is Different
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Zap className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <CardTitle>Accurate Energy Modeling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Based on actual Massachusetts energy prices and geothermal COP values of 4+ winter, 6+ summer
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-4" />
                <CardTitle>Real Incentive Calculations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Includes current MassSave $15K rebate and 30% federal tax credit calculations
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                <CardTitle>Long-term Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  See 10-year and 25-year savings projections to understand total lifetime value
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CalculatorPage
