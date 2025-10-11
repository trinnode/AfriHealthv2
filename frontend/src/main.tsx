import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import type { ReactNode, ErrorInfo } from 'react'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ui/Toast.tsx'

// Error boundary component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
          <h1 style={{ color: '#FF6B35' }}>⚠️ Application Error</h1>
          <pre style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>

  </StrictMode>,
)
