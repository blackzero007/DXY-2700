import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "@/pages/Home"
import SampleDetail from "@/pages/SampleDetail"
import ToastContainer from "@/components/ToastContainer"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sample/:id" element={<SampleDetail />} />
      </Routes>
      <ToastContainer />
    </Router>
  )
}
