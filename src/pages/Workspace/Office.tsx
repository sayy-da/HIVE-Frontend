import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'

const Office = () => {
  const [searchParams] = useSearchParams()
  const companyid = searchParams.get("companyid")
  const employee = useSelector((state: RootState) => state.employee)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Employee Workspace</h1>
        {employee.name && (
          <p className="text-lg text-gray-700 mb-2">Welcome, {employee.name}!</p>
        )}
        {employee.email && (
          <p className="text-sm text-gray-600 mb-2">Email: {employee.email}</p>
        )}
        {employee.position && (
          <p className="text-sm text-gray-600 mb-2">Position: {employee.position}</p>
        )}
        {companyid && (
          <p className="text-sm text-gray-600 mb-6">Company ID: {companyid}</p>
        )}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700">Welcome to your workspace!</p>
        </div>
      </div>
    </div>
  )
}

export default Office
