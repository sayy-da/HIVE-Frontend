import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RootState, AppDispatch } from '../store'
import { logout } from '../features/employee/employeeSlice'
import { logoutEmployee, getEmployeeProfile, changeEmployeePassword, updateEmployeeProfile } from '../API/employee.api'
import { updateEmployeeAvatar } from '../API/employee.api'
import { setEmployeeData } from '../features/employee/employeeSlice'
import { Employee } from '../API/company.api'
import { Settings, LogOut, User, KeyRound, UserCircle, X, Eye, EyeOff, Edit, Save } from 'lucide-react'
import { successPopup, errorPopup } from '../utils/popup'

const avatars = [
  { id: 'adam', name: 'Adam' },
  { id: 'ash', name: 'Ash' },
  { id: 'lucy', name: 'Lucy' },
  { id: 'nancy', name: 'Nancy' },
]

export default function SettingsMenu() {
  const dispatch: AppDispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const employee = useSelector((state: RootState) => state.employee)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [profileData, setProfileData] = useState<Employee | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false })
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editAddress, setEditAddress] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Check if it's first time (no avatar selected) and show selector
  useEffect(() => {
    // Check if characterTexture is not set (undefined, null, or empty string)
    // This means the user hasn't selected an avatar yet
    if (employee._id && !employee.characterTexture) {
      // Check if avatar was already set in this session
      const avatarSelected = sessionStorage.getItem(`avatarSelected_${employee._id}`)
      if (!avatarSelected) {
        setIsFirstTime(true)
        setShowAvatarSelector(true)
      }
    }
  }, [employee._id, employee.characterTexture])

  // Disable WASD controls when any modal is open
  useEffect(() => {
    const isModalOpen = isMenuOpen || showAvatarSelector || showProfile || showChangePassword
    if (typeof window !== 'undefined') {
      (window as any).modalOpen = isModalOpen
    }
  }, [isMenuOpen, showAvatarSelector, showProfile, showChangePassword])

  // Prevent Phaser from capturing WASD and E keys when typing in input fields
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable)
      )
      
      // If user is typing and presses WASD or E, stop propagation to prevent Phaser from capturing it
      if (isTyping && ['w', 'a', 's', 'd', 'e', 'W', 'A', 'S', 'D', 'E'].includes(event.key)) {
        event.stopPropagation()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true) // Use capture phase

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logoutEmployee()
      dispatch(logout())
      successPopup('Logged out successfully')
      const companyIdParam = searchParams.get('companyid') || employee.companyId
      if (companyIdParam) {
        navigate(`/employee/login?companyid=${companyIdParam}`, { replace: true })
      } else {
        navigate('/employee/login', { replace: true })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to logout'
      errorPopup(errorMessage)
      // Even if logout fails, clear local state
      dispatch(logout())
      const companyIdParam = searchParams.get('companyid') || employee.companyId
      if (companyIdParam) {
        navigate(`/employee/login?companyid=${companyIdParam}`, { replace: true })
      } else {
        navigate('/employee/login', { replace: true })
      }
    } finally {
      setIsLoggingOut(false)
      setIsMenuOpen(false)
    }
  }

  const handleAvatarSelect = async (avatarId: string) => {
    if (avatarId === employee.characterTexture || isUpdating) return

    setIsUpdating(true)
    try {
      await updateEmployeeAvatar(avatarId)
      dispatch(setEmployeeData({ characterTexture: avatarId }))
      
      // Mark avatar as selected for this session
      if (employee._id) {
        sessionStorage.setItem(`avatarSelected_${employee._id}`, 'true')
      }
      
      setShowAvatarSelector(false)
      setIsMenuOpen(false)
      setIsFirstTime(false)
      
      if (isFirstTime) {
        successPopup('Avatar selected! Welcome to the workspace!')
        // Update window.workspaceUserData and initialize game
        window.workspaceUserData = {
          userId: employee._id,
          userName: employee.name || employee.email?.split('@')[0] || 'User',
          characterTexture: avatarId,
        }
        // Trigger Workspace component to initialize game
        window.dispatchEvent(new CustomEvent('avatarSelected'))
      } else {
        successPopup('Avatar updated successfully')
        // Update window.workspaceUserData if game is already running
        if (window.workspaceUserData) {
          window.workspaceUserData.characterTexture = avatarId
        }
      }
    } catch (error) {
      console.error('Failed to update avatar:', error)
      errorPopup('Failed to update avatar')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePasswordClick = () => {
    setShowChangePassword(true)
    setIsMenuOpen(false)
  }

  const handleForgotPassword = () => {
    const companyIdParam = searchParams.get('companyid') || employee.companyId
    if (companyIdParam) {
      navigate(`/employee/forgot-password?companyid=${companyIdParam}`)
    } else {
      navigate('/employee/forgot-password')
    }
    setShowChangePassword(false)
  }

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      errorPopup('All fields are required')
      return
    }

    if (newPassword.length < 6) {
      errorPopup('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      errorPopup('New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      errorPopup('New password must be different from current password')
      return
    }

    setIsChangingPassword(true)
    try {
      await changeEmployeePassword(currentPassword, newPassword)
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to change password'
      errorPopup(errorMessage)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleEditProfileClick = () => {
    if (profileData) {
      setEditAddress(profileData.address || '')
      setIsEditingProfile(true)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editAddress.trim()) {
      errorPopup('Please enter an address')
      return
    }

    setIsUpdatingProfile(true)
    try {
      const updatedProfile = await updateEmployeeProfile(editAddress)
      setProfileData(updatedProfile)
      setIsEditingProfile(false)
      // Update Redux state
      dispatch(setEmployeeData({ address: editAddress }))
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update profile'
      errorPopup(errorMessage)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  return (
    <>
      {/* Settings Button */}
      <div ref={menuRef} className="absolute top-4 right-4 z-50" style={{ zIndex: 10000 }}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5 text-gray-700" />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-12 right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => {
                  setShowAvatarSelector(true)
                  setIsMenuOpen(false)
                }}
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors text-gray-700"
              >
                <UserCircle className="h-5 w-5" />
                <span>Change Avatar</span>
              </button>

              <button
                onClick={async () => {
                  setIsMenuOpen(false)
                  setIsLoadingProfile(true)
                  try {
                    const profile = await getEmployeeProfile()
                    console.log('Profile loaded:', profile)
                    setProfileData(profile)
                    setShowProfile(true)
                  } catch (error: any) {
                    console.error('Failed to load profile:', error)
                    const errorMessage = error?.response?.data?.error || error?.message || 'Failed to load profile data'
                    errorPopup(errorMessage)
                  } finally {
                    setIsLoadingProfile(false)
                  }
                }}
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors text-gray-700"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </button>

              <button
                onClick={handleChangePasswordClick}
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors text-gray-700"
              >
                <KeyRound className="h-5 w-5" />
                <span>Change Password</span>
              </button>

              <div className="border-t border-gray-200 my-1" />

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-50 transition-colors text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="h-5 w-5" />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/10"
          style={{ zIndex: 10001 }}
          onClick={(e) => {
            // Prevent closing on backdrop click if it's first time
            if (isFirstTime && e.target === e.currentTarget) {
              e.preventDefault()
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {isFirstTime ? 'Welcome! Select Your Avatar' : 'Select Avatar'}
              </h3>
              {!isFirstTime && (
                <button
                  onClick={() => setShowAvatarSelector(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {isFirstTime && (
              <p className="text-sm text-gray-600 mb-4">
                Please select an avatar to continue to the workspace.
              </p>
            )}
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
                    <div className="text-sm font-medium mb-2 text-gray-800">{avatar.name}</div>
                    <div className="text-xs text-gray-500">
                      {employee.characterTexture === avatar.id ? 'Current' : 'Select'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/10"
          style={{ zIndex: 10001 }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Profile</h3>
              <div className="flex items-center gap-2">
                {!isEditingProfile && profileData && (
                  <button
                    onClick={handleEditProfileClick}
                    className="text-blue-600 hover:text-blue-700 transition-colors p-1"
                    title="Edit Profile"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                )}
                <button
                onClick={() => {
                  setShowProfile(false)
                  setProfileData(null)
                  setIsEditingProfile(false)
                  setEditAddress('')
                }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading profile...</div>
              </div>
            ) : profileData ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="text-sm font-medium text-gray-600">Employee ID</label>
                  <p className="text-gray-800 mt-1 text-sm font-mono">{profileData._id || 'Not set'}</p>
                </div>
                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your address"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false)
                          setEditAddress('')
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-800 mt-1">{profileData.name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-800 mt-1">{profileData.email || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Position</label>
                      <p className="text-gray-800 mt-1">{profileData.position || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-800 mt-1">{profileData.address || 'Not set'}</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Role</label>
                  <p className="text-gray-800 mt-1 capitalize">{profileData.role || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-gray-800 mt-1 capitalize">{profileData.status || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Company ID</label>
                  <p className="text-gray-800 mt-1 text-sm font-mono">
                    {typeof profileData.companyId === 'object' && profileData.companyId !== null
                      ? (profileData.companyId as any)._id || String(profileData.companyId)
                      : profileData.companyId || 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Active</label>
                  <p className="text-gray-800 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profileData.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profileData.active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email Verified</label>
                  <p className="text-gray-800 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profileData.isEmailVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {profileData.isEmailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Avatar</label>
                  <p className="text-gray-800 mt-1 capitalize">{profileData.characterTexture || employee.characterTexture || 'adam'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No profile data available</div>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/10"
          style={{ zIndex: 10001 }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Change Password</h3>
              <button
                onClick={() => {
                  setShowChangePassword(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-full px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

