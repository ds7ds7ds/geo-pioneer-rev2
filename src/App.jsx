import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './components/pages/HomePage'
import ExistingHomesPage from './components/pages/ExistingHomesPage'
import NewConstructionPage from './components/pages/NewConstructionPage'
import CalculatorPage from './components/pages/CalculatorPage'
import BlogPage from './components/pages/BlogPage'
import AboutPage from './components/pages/AboutPage'
import ContactPage from './components/pages/ContactPage'
import './App.css'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/existing-homes" element={<ExistingHomesPage />} />
          <Route path="/new-construction" element={<NewConstructionPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
