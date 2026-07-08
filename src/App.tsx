import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { NumberFlash } from './games/NumberFlash'
import { EchoCalc } from './games/EchoCalc'
import { ColorClash } from './games/ColorClash'
import { DigitRush } from './games/DigitRush'
import { Scores } from './pages/Scores'
import { About } from './pages/About'

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/number-flash" element={<NumberFlash />} />
        <Route path="/play/echo-calc" element={<EchoCalc />} />
        <Route path="/play/color-clash" element={<ColorClash />} />
        <Route path="/play/digit-rush" element={<DigitRush />} />
        <Route path="/scores" element={<Scores />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  )
}