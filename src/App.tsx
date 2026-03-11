import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CostCalculatorPage } from './pages/CostCalculatorPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CostCalculatorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
