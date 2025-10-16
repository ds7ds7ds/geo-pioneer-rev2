// PDF Generation and Email Service
import jsPDF from 'jspdf'

export const generateAndSendReport = async (formData, reportType = 'general') => {
  try {
    // Generate PDF content based on report type
    const reportContent = generateReportContent(formData, reportType)
    
    // Generate actual PDF
    const pdfBlob = await generatePDF(reportContent)
    
    // Download PDF for user
    downloadPDF(pdfBlob, `GeoPioneer-Assessment-${reportContent.reportMetadata.reportId}.pdf`)
    
    // Send email with PDF attachment (simulated for now)
    const response = await sendEmailWithPDF(formData, reportContent, pdfBlob)
    
    return {
      success: true,
      message: `Report generated and sent to ${formData.email}`,
      reportId: reportContent.reportMetadata.reportId,
      timestamp: new Date().toISOString(),
      pdfGenerated: true
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return {
      success: false,
      message: 'Failed to generate report. Please try again.',
      error: error.message
    }
  }
}

const generatePDF = async (reportContent) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = 20
  
  // Header
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text(reportContent.title, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15
  
  // Report ID and Date
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Report ID: ${reportContent.reportMetadata.reportId}`, 20, yPosition)
  pdf.text(`Generated: ${new Date(reportContent.reportMetadata.generatedAt).toLocaleDateString()}`, pageWidth - 20, yPosition, { align: 'right' })
  yPosition += 15
  
  // Customer Information
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Customer Information', 20, yPosition)
  yPosition += 8
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Name: ${reportContent.customerInfo.name}`, 20, yPosition)
  yPosition += 5
  pdf.text(`Email: ${reportContent.customerInfo.email}`, 20, yPosition)
  yPosition += 5
  pdf.text(`Phone: ${reportContent.customerInfo.phone}`, 20, yPosition)
  yPosition += 5
  if (reportContent.customerInfo.address) {
    pdf.text(`Address: ${reportContent.customerInfo.address}`, 20, yPosition)
    yPosition += 5
  }
  yPosition += 10
  
  // Assessment Details
  if (reportContent.calculatorData) {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Property & System Information', 20, yPosition)
    yPosition += 8
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Square Footage: ${reportContent.calculatorData.squareFootage}`, 20, yPosition)
    yPosition += 5
    pdf.text(`Current Heating Fuel: ${reportContent.calculatorData.heatingFuel}`, 20, yPosition)
    yPosition += 5
    pdf.text(`Annual Heating Cost: $${reportContent.calculatorData.annualHeatingCost}`, 20, yPosition)
    yPosition += 5
    pdf.text(`Annual Electricity Cost: $${reportContent.calculatorData.annualElectricityCost}`, 20, yPosition)
    yPosition += 5
    if (reportContent.calculatorData.zipCode) {
      pdf.text(`ZIP Code: ${reportContent.calculatorData.zipCode}`, 20, yPosition)
      yPosition += 5
    }
    yPosition += 10
    
    // Calculation Results
    if (reportContent.calculationResults) {
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Your Calculated Savings', 20, yPosition)
      yPosition += 8
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Annual Savings: $${reportContent.calculationResults.annualSavings?.toLocaleString() || '0'}`, 20, yPosition)
      yPosition += 6
      pdf.text(`25-Year Savings: $${reportContent.calculationResults.lifetimeSavings?.toLocaleString() || '0'}`, 20, yPosition)
      yPosition += 6
      pdf.text(`Break-even Period: ${reportContent.calculationResults.paybackPeriod || 'N/A'} years`, 20, yPosition)
      yPosition += 10
    }
  } else if (reportContent.currentSystem) {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Current System Information', 20, yPosition)
    yPosition += 8
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Current Heating System: ${reportContent.currentSystem}`, 20, yPosition)
    yPosition += 5
    if (reportContent.squareFootage) {
      pdf.text(`Square Footage: ${reportContent.squareFootage}`, 20, yPosition)
      yPosition += 5
    }
    yPosition += 10
  }
  
  // Available Programs
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Available Rebates & Incentives', 20, yPosition)
  yPosition += 8
  
  reportContent.programs.forEach((program, index) => {
    if (yPosition > pageHeight - 30) {
      pdf.addPage()
      yPosition = 20
    }
    
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${program.name}: ${program.amount}`, 20, yPosition)
    yPosition += 5
    
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    const descLines = pdf.splitTextToSize(program.description, pageWidth - 40)
    pdf.text(descLines, 20, yPosition)
    yPosition += descLines.length * 4 + 5
  })
  
  yPosition += 5
  
  // Installation Steps
  if (yPosition > pageHeight - 50) {
    pdf.addPage()
    yPosition = 20
  }
  
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Installation Process', 20, yPosition)
  yPosition += 8
  
  reportContent.installationSteps.forEach((step, index) => {
    if (yPosition > pageHeight - 25) {
      pdf.addPage()
      yPosition = 20
    }
    
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Step ${step.step}: ${step.title} (${step.duration})`, 20, yPosition)
    yPosition += 5
    
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    const stepLines = pdf.splitTextToSize(step.description, pageWidth - 40)
    pdf.text(stepLines, 20, yPosition)
    yPosition += stepLines.length * 4 + 5
  })
  
  // Timeline
  if (yPosition > pageHeight - 20) {
    pdf.addPage()
    yPosition = 20
  }
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Total Project Timeline: ${reportContent.totalTimeframe}`, 20, yPosition)
  yPosition += 10
  
  // Additional Information
  if (reportContent.additionalInfo) {
    if (yPosition > pageHeight - 30) {
      pdf.addPage()
      yPosition = 20
    }
    
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Additional Information', 20, yPosition)
    yPosition += 8
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    const infoLines = pdf.splitTextToSize(reportContent.additionalInfo, pageWidth - 40)
    pdf.text(infoLines, 20, yPosition)
  }
  
  // Footer
  const footerY = pageHeight - 15
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('GeoPioneer - Your Geothermal Energy Partner', pageWidth / 2, footerY, { align: 'center' })
  pdf.text('Contact: info@geopioneer.com | (555) 123-4567', pageWidth / 2, footerY + 4, { align: 'center' })
  
  return pdf.output('blob')
}

const downloadPDF = (pdfBlob, filename) => {
  const url = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const sendEmailWithPDF = async (formData, reportContent, pdfBlob) => {
  // Convert blob to base64 for email attachment
  const base64PDF = await blobToBase64(pdfBlob)
  
  // Prepare email data
  const emailData = {
    to: formData.email,
    cc: 'info@geopioneer.com',
    subject: `Your ${reportContent.title}`,
    html: generateEmailHTML(formData, reportContent),
    attachments: [{
      filename: `GeoPioneer-Assessment-${reportContent.reportMetadata.reportId}.pdf`,
      content: base64PDF,
      type: 'application/pdf'
    }]
  }
  
  // Log email data (in production, this would be sent to your email service)
  console.log('Email would be sent with the following data:', emailData)
  console.log('PDF attachment size:', pdfBlob.size, 'bytes')
  
  // Simulate successful email sending
  return { success: true, emailId: generateReportId() }
}

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

const generateEmailHTML = (formData, reportContent) => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0066cc;">Thank you for your interest in geothermal energy!</h2>
          
          <p>Dear ${formData.name},</p>
          
          <p>Thank you for requesting a geothermal assessment from GeoPioneer. We've attached your comprehensive assessment report that includes:</p>
          
          <ul>
            <li>Available rebates and incentives (up to $${reportContent.reportType === 'retrofit' ? '35,000' : '30,000'} total)</li>
            <li>Step-by-step installation process</li>
            <li>Project timeline and next steps</li>
            <li>Your specific property assessment details</li>
          </ul>
          
          <p><strong>Next Steps:</strong></p>
          <p>We'll contact you within 24 hours to schedule your on-site evaluation and answer any questions you may have.</p>
          
          <p>Best regards,<br>
          The GeoPioneer Team<br>
          <a href="mailto:info@geopioneer.com">info@geopioneer.com</a><br>
          (555) 123-4567</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Report ID: ${reportContent.reportMetadata.reportId}<br>
            Generated: ${new Date().toLocaleDateString()}
          </p>
        </div>
      </body>
    </html>
  `
}

const generateReportContent = (formData, reportType) => {
  const baseContent = {
    customerInfo: {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      submissionDate: formData.submissionDate,
      submissionTime: formData.submissionTime
    },
    reportMetadata: {
      reportId: generateReportId(),
      generatedAt: new Date().toISOString(),
      reportType: reportType
    }
  }

  if (reportType === 'calculator') {
    return {
      ...baseContent,
      title: 'GeoPioneer Savings Calculator Assessment Report',
      calculatorData: {
        squareFootage: formData.squareFootage,
        heatingFuel: formData.heatingFuel,
        annualHeatingCost: formData.annualHeatingCost,
        annualElectricityCost: formData.annualElectricityCost,
        zipCode: formData.zipCode
      },
      calculationResults: formData.calculationResults,
      programs: [
        {
          name: 'Massachusetts Clean Energy Center (MassCEC) Rebates',
          amount: 'Up to $10,000',
          description: 'State rebates for residential geothermal installations',
          eligibility: 'All qualifying residential geothermal systems'
        },
        {
          name: 'Federal Tax Credit (ITC)',
          amount: '30% of total cost',
          description: 'Federal investment tax credit through 2032',
          eligibility: 'All residential geothermal installations'
        },
        {
          name: 'Mass Save Heat Pump Rebates',
          amount: 'Up to $10,000',
          description: 'Additional rebates for qualifying heat pump systems',
          eligibility: 'Homes served by participating utilities'
        }
      ],
      installationSteps: [
        { step: 1, title: 'Site Assessment & Design', duration: '1-2 weeks', description: 'Comprehensive site evaluation, soil analysis, and custom system design based on your calculated needs' },
        { step: 2, title: 'Permits & Approvals', duration: '2-4 weeks', description: 'Obtain necessary permits and utility approvals' },
        { step: 3, title: 'Ground Loop Installation', duration: '1-3 days', description: 'Drilling and installation of ground loop system' },
        { step: 4, title: 'Indoor Equipment Installation', duration: '1-2 days', description: 'Heat pump installation and ductwork modifications' },
        { step: 5, title: 'System Commissioning', duration: '1 day', description: 'Testing, balancing, and system optimization' },
        { step: 6, title: 'Final Inspection & Training', duration: '1 day', description: 'Final inspections and homeowner training' }
      ],
      totalTimeframe: '6-12 weeks from contract signing'
    }
  } else if (reportType === 'retrofit') {
    return {
      ...baseContent,
      title: 'GeoPioneer Existing Home Retrofit Assessment Report',
      currentSystem: formData.currentSystem,
      squareFootage: formData.squareFootage,
      additionalInfo: formData.additionalInfo,
      programs: [
        {
          name: 'Massachusetts Clean Energy Center (MassCEC) Rebates',
          amount: 'Up to $10,000',
          description: 'State rebates for residential geothermal retrofits',
          eligibility: 'Existing homes with qualifying heating systems'
        },
        {
          name: 'Federal Tax Credit (ITC)',
          amount: '30% of total cost',
          description: 'Federal investment tax credit through 2032',
          eligibility: 'All residential geothermal installations'
        },
        {
          name: 'Mass Save Heat Pump Rebates',
          amount: 'Up to $10,000',
          description: 'Additional rebates for qualifying retrofit installations',
          eligibility: 'Homes served by participating utilities'
        },
        {
          name: 'Oil Heat Replacement Program',
          amount: 'Up to $5,000',
          description: 'Special incentives for oil heating system replacements',
          eligibility: 'Homes currently using oil heating'
        }
      ],
      installationSteps: [
        { step: 1, title: 'Home Energy Assessment', duration: '1 week', description: 'Comprehensive evaluation of existing systems, ductwork, and insulation' },
        { step: 2, title: 'Site Survey & Soil Analysis', duration: '1 week', description: 'Ground conditions assessment and loop field design' },
        { step: 3, title: 'Custom System Design', duration: '1-2 weeks', description: 'Tailored geothermal system design for your home' },
        { step: 4, title: 'Permits & Approvals', duration: '2-4 weeks', description: 'Obtain necessary permits and utility approvals' },
        { step: 5, title: 'Ground Loop Installation', duration: '1-3 days', description: 'Minimal disruption drilling and loop installation' },
        { step: 6, title: 'Indoor System Retrofit', duration: '2-3 days', description: 'Heat pump installation and ductwork modifications' },
        { step: 7, title: 'System Integration & Testing', duration: '1 day', description: 'Connect systems and comprehensive testing' },
        { step: 8, title: 'Final Inspection & Training', duration: '1 day', description: 'Final inspections and homeowner system training' }
      ],
      totalTimeframe: '8-14 weeks from contract signing',
      estimatedSavings: {
        annualSavings: '$2,000 - $4,000',
        lifetimeSavings: '$50,000 - $100,000',
        paybackPeriod: '7-12 years'
      }
    }
  } else {
    return {
      ...baseContent,
      title: 'GeoPioneer Geothermal Assessment Report',
      propertyType: formData.propertyType,
      additionalInfo: formData.additionalInfo,
      programs: [
        {
          name: 'Massachusetts Clean Energy Center (MassCEC) Rebates',
          amount: 'Up to $10,000',
          description: 'State rebates for residential geothermal installations'
        },
        {
          name: 'Federal Tax Credit (ITC)',
          amount: '30% of total cost',
          description: 'Federal investment tax credit through 2032'
        },
        {
          name: 'Mass Save Heat Pump Rebates',
          amount: 'Up to $10,000',
          description: 'Additional rebates for qualifying heat pump systems'
        }
      ],
      installationSteps: [
        { step: 1, title: 'Site Assessment & Design', duration: '1-2 weeks', description: 'Comprehensive site evaluation, soil analysis, and custom system design' },
        { step: 2, title: 'Permits & Approvals', duration: '2-4 weeks', description: 'Obtain necessary permits and utility approvals' },
        { step: 3, title: 'Ground Loop Installation', duration: '1-3 days', description: 'Drilling and installation of ground loop system' },
        { step: 4, title: 'Indoor Equipment Installation', duration: '1-2 days', description: 'Heat pump installation and ductwork modifications' },
        { step: 5, title: 'System Commissioning', duration: '1 day', description: 'Testing, balancing, and system optimization' },
        { step: 6, title: 'Final Inspection & Training', duration: '1 day', description: 'Final inspections and homeowner training' }
      ],
      totalTimeframe: '6-12 weeks from contract signing'
    }
  }
}

const simulateEmailService = async (formData, reportContent) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Log the email that would be sent
  console.log('Email would be sent to:', formData.email)
  console.log('CC:', 'info@geopioneer.com')
  console.log('Subject:', `Your ${reportContent.title}`)
  console.log('Report Content:', reportContent)
  
  // In production, this would make an actual API call to your email service
  // Example: await fetch('/api/send-report', { method: 'POST', body: JSON.stringify({ formData, reportContent }) })
  
  return { success: true, emailId: generateReportId() }
}

const generateReportId = () => {
  return 'RPT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
}

// Export individual functions for testing
export { generateReportContent, simulateEmailService, generateReportId }
