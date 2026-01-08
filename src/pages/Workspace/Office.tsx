import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import Workspace from '../../components/Workspace'

const Office = () => {
  const employee = useSelector((state: RootState) => state.employee)

  // ProtectedRoute handles token refresh, so we just need to check if token exists
  // If it doesn't exist here, ProtectedRoute will handle redirect
  if (!employee.accessToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Workspace />
    </div>
  )
}

export default Office
