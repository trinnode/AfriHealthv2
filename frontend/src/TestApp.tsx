import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

function TestPage() {
  return (
    <div style={{ padding: "20px", backgroundColor: "#1a1a1a", minHeight: "100vh", color: "white" }}>
      <h1 style={{ color: "#FF6B35" }}>🏥 AfriHealth Ledger - Test Mode</h1>
      <p>If you see this, React is rendering correctly!</p>
      
      <div style={{ marginTop: "30px" }}>
        <Link to="/patient" style={{ 
          padding: "15px 30px", 
          backgroundColor: "#FF6B35", 
          color: "black", 
          textDecoration: "none",
          borderRadius: "8px",
          marginRight: "10px",
          display: "inline-block"
        }}>
          Patient Portal
        </Link>
        
        <Link to="/provider" style={{ 
          padding: "15px 30px", 
          backgroundColor: "#4A5F3A", 
          color: "white", 
          textDecoration: "none",
          borderRadius: "8px",
          display: "inline-block"
        }}>
          Provider Portal
        </Link>
      </div>

      <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#2a2a2a", borderRadius: "8px" }}>
        <h3>System Status:</h3>
        <ul>
          <li>✅ React: Loaded</li>
          <li>✅ React Router: Working</li>
          <li>✅ TypeScript: Compiled</li>
          <li>✅ Vite: Serving</li>
        </ul>
      </div>
    </div>
  );
}

function PatientTest() {
  return (
    <div style={{ padding: "20px", backgroundColor: "#1a1a1a", minHeight: "100vh", color: "white" }}>
      <h1>Patient Dashboard (Test)</h1>
      <Link to="/" style={{ color: "#FF6B35" }}>← Back to Home</Link>
      <p style={{ marginTop: "20px" }}>Patient dashboard would load here...</p>
    </div>
  );
}

function ProviderTest() {
  return (
    <div style={{ padding: "20px", backgroundColor: "#1a1a1a", minHeight: "100vh", color: "white" }}>
      <h1>Provider Dashboard (Test)</h1>
      <Link to="/" style={{ color: "#FF6B35" }}>← Back to Home</Link>
      <p style={{ marginTop: "20px" }}>Provider dashboard would load here...</p>
    </div>
  );
}

export default function TestApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="/patient" element={<PatientTest />} />
        <Route path="/provider" element={<ProviderTest />} />
      </Routes>
    </Router>
  );
}
