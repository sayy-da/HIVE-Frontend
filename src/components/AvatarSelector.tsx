import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { setEmployeeData } from '../features/employee/employeeSlice'
import { updateEmployeeAvatar } from '../API/employee.api'

const avatars = [
  { id: 'adam', name: 'Adam' },
  { id: 'ash', name: 'Ash' },
  { id: 'lucy', name: 'Lucy' },
  { id: 'nancy', name: 'Nancy' },
]

export default function AvatarSelector() {
  const dispatch: AppDispatch = useDispatch()
  const employee = useSelector((state: RootState) => state.employee)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSelector, setShowSelector] = useState(false)

  const handleAvatarSelect = async (avatarId: string) => {
    if (avatarId === employee.characterTexture || isUpdating) return

    setIsUpdating(true)
    try {
      await updateEmployeeAvatar(avatarId)
      dispatch(setEmployeeData({ characterTexture: avatarId }))
      setShowSelector(false)
    } catch (error) {
      console.error('Failed to update avatar:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!showSelector) {
    return (
      <button
        onClick={() => setShowSelector(true)}
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        style={{ zIndex: 10000 }}
      >
        Change Avatar
      </button>
    )
  }

  return (
    <div
      className="absolute top-4 left-4 z-50 bg-white rounded-lg shadow-lg p-4"
      style={{ zIndex: 10000 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Select Avatar</h3>
        <button
          onClick={() => setShowSelector(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {avatars.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => handleAvatarSelect(avatar.id)}
            disabled={isUpdating}
            className={`p-4 border-2 rounded-lg transition-all ${
              employee.characterTexture === avatar.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-center">
              <div className="text-sm font-medium mb-2">{avatar.name}</div>
              <div className="text-xs text-gray-500">
                {employee.characterTexture === avatar.id ? 'Current' : 'Select'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

