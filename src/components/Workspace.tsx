import { useRef, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { RootState, AppDispatch } from '../store'
import getPhaserGame from '../workspace/game/PhaserGame'
import SettingsMenu from './SettingsMenu'
import { getEmployeeProfile } from '../API/employee.api'
import { setEmployeeData } from '../features/employee/employeeSlice'
import { successPopup } from '../utils/popup'

export default function Workspace() {
  const phaserContainerRef = useRef<HTMLDivElement>(null)
  const [searchParams] = useSearchParams()
  const employee = useSelector((state: RootState) => state.employee)
  const dispatch: AppDispatch = useDispatch()
  const statusCheckIntervalRef = useRef<number | null>(null)
  const previousStatusRef = useRef<string | null>(null)
  const [companyIdLoaded, setCompanyIdLoaded] = useState(false)

  // Load companyId from profile if missing
  useEffect(() => {
    const loadCompanyId = async () => {
      // If companyId is already available, no need to load
      if (employee.companyId) {
        console.log('[Workspace] CompanyId already available:', employee.companyId)
        setCompanyIdLoaded(true)
        return
      }

      console.log('[Workspace] CompanyId missing, attempting to load...', {
        hasEmployeeId: !!employee._id,
        hasAccessToken: !!employee.accessToken,
        hasCompanyIdInUrl: !!searchParams.get('companyid')
      })

      // Try to get from URL query parameter first
      const companyIdFromUrl = searchParams.get('companyid')
      if (companyIdFromUrl) {
        console.log('[Workspace] Loading companyId from URL:', companyIdFromUrl)
        dispatch(setEmployeeData({ companyId: companyIdFromUrl }))
        setCompanyIdLoaded(true)
        return
      }

      // If not in URL and not in Redux, fetch from API
      if (employee._id && employee.accessToken) {
        try {
          console.log('[Workspace] Fetching companyId from employee profile...')
          const profile = await getEmployeeProfile()
          console.log('[Workspace] Profile fetched:', { 
            hasCompanyId: !!profile.companyId, 
            companyId: profile.companyId 
          })
          if (profile.companyId) {
            dispatch(setEmployeeData({ companyId: profile.companyId }))
            setCompanyIdLoaded(true)
            console.log('[Workspace] CompanyId loaded from profile:', profile.companyId)
          } else {
            console.error('[Workspace] CompanyId not found in profile response')
            setCompanyIdLoaded(true) // Set to true anyway to prevent infinite waiting
          }
        } catch (error) {
          console.error('[Workspace] Failed to load companyId from profile:', error)
          setCompanyIdLoaded(true) // Set to true anyway to prevent infinite waiting
        }
      } else {
        console.log('[Workspace] Cannot load companyId - missing employee._id or accessToken')
        // Don't set companyIdLoaded to true yet, wait for employee data
      }
    }

    loadCompanyId()
  }, [employee.companyId, employee._id, employee.accessToken, searchParams, dispatch])

  const initializeGame = () => {
    if (!employee._id) return
    
    // Get companyId from Redux, URL, or fallback
    const companyId = employee.companyId || searchParams.get('companyid') || ''
    
    if (!companyId) {
      console.warn('[Workspace] CompanyId is missing, cannot initialize game properly')
      return
    }
    
    const userName = employee.name || employee.email?.split('@')[0] || 'User'
    const characterTexture = employee.characterTexture || 'adam'
    
    console.log('[Workspace] Initializing game with companyId:', companyId)
    
    window.workspaceUserData = {
      userId: employee._id,
      userName: userName,
      characterTexture: characterTexture,
      companyId: companyId, // Ensure companyId is always set
    } as typeof window.workspaceUserData
    
    const container = document.getElementById('phaser-container')
    if (container) {
      console.log('Workspace: Container found, initializing Phaser game...')
      const game = getPhaserGame()
      console.log('Workspace: Phaser game initialized', game)
    } else {
      console.warn('Workspace: phaser-container not found, retrying...')
      setTimeout(() => {
        const retryContainer = document.getElementById('phaser-container')
        if (retryContainer) {
          console.log('Workspace: Container found on retry, initializing Phaser game...')
          getPhaserGame()
        } else {
          console.error('Workspace: Container still not found after retry!')
        }
      }, 100)
    }
  }

  // Check employee status periodically when in workspace
  useEffect(() => {
    if (!employee._id || !employee.accessToken) {
      return
    }

    // Store initial status
    previousStatusRef.current = employee.status

    // Function to check and update status
    const checkStatus = async () => {
      try {
        const profile = await getEmployeeProfile()
        const currentStatus = profile.status

        // Update companyId if missing
        if (!employee.companyId && profile.companyId) {
          dispatch(setEmployeeData({ companyId: profile.companyId }))
          console.log('[Workspace] CompanyId loaded from profile:', profile.companyId)
        }

        // If status changed from "requested" to "approved", notify user
        if (previousStatusRef.current === 'requested' && currentStatus === 'approved') {
          successPopup('Your status has been approved! You can now access all features.')
          // Update Redux with new status
          dispatch(setEmployeeData({ status: currentStatus as any }))
        } else if (previousStatusRef.current !== currentStatus) {
          // Status changed to something else, just update silently
          dispatch(setEmployeeData({ status: currentStatus as any }))
        }

        previousStatusRef.current = currentStatus
      } catch (error) {
        console.error('[Workspace] Failed to check employee status:', error)
        // Don't show error popup to avoid annoying the user
      }
    }

    // Check immediately, then every 10 seconds
    checkStatus()
    statusCheckIntervalRef.current = setInterval(checkStatus, 10000) // 10 seconds

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
        statusCheckIntervalRef.current = null
      }
    }
  }, [employee._id, employee.accessToken, dispatch])

  useEffect(() => {
    // Initialize game as soon as we have employee ID, avatar, and companyId
    const companyId = employee.companyId || searchParams.get('companyid')
    
    if (employee._id && employee.characterTexture && companyId && companyIdLoaded) {
      initializeGame()
    } else if (employee._id && !companyId) {
      console.log('Workspace: Waiting for companyId before initializing game...', {
        hasCompanyId: !!employee.companyId,
        hasCompanyIdInUrl: !!searchParams.get('companyid'),
        companyIdLoaded
      })
    } else if (employee._id && !employee.characterTexture) {
      console.log('Workspace: Waiting for avatar selection before initializing game...')
    } else if (!employee._id) {
      console.log('Workspace: Waiting for employee ID...', { 
        hasId: !!employee._id,
        hasAccessToken: !!employee.accessToken
      })
    }

    // Listen for avatar selection event
    const handleAvatarSelected = () => {
      const companyId = employee.companyId || searchParams.get('companyid')
      if (employee._id && employee.characterTexture && companyId) {
        initializeGame()
      }
    }
    
    window.addEventListener('avatarSelected', handleAvatarSelected)

    return () => {
      window.removeEventListener('avatarSelected', handleAvatarSelected)
      // Cleanup
      delete window.workspaceUserData
    }
  }, [employee._id, employee.name, employee.email, employee.characterTexture, employee.companyId, companyIdLoaded, searchParams])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <SettingsMenu />
      <div
        id="phaser-container"
        ref={phaserContainerRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0
        }}
      />
    </div>
  )
}

