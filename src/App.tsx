import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "@/pages/Home"
import SampleDetail from "@/pages/SampleDetail"
import Batches from "@/pages/Batches"
import BatchDetail from "@/pages/BatchDetail"
import Tags from "@/pages/Tags"
import ToastContainer from "@/components/ToastContainer"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sample/:id" element={<SampleDetail />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/batch/:id" element={<BatchDetail />} />
        <Route path="/tags" element={<Tags />} />
      </Routes>
      <ToastContainer />
    </Router>
  )
}
