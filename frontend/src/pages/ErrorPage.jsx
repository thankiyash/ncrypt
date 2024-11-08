import { useNavigate } from 'react-router-dom'

const ErrorPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-lg mb-6">Page not found</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90"
        >
          Go Home
        </button>
      </div>
    </div>
  )
}

export default ErrorPage