import { useCallback, useEffect, useState } from 'react'

const ACTIVE_ROLE_KEY = 'open_active_role'

function getStoredRole(fallback = 'player') {
  return window.localStorage.getItem(ACTIVE_ROLE_KEY) || fallback
}

function setStoredRole(role) {
  window.localStorage.setItem(ACTIVE_ROLE_KEY, role)
  window.dispatchEvent(new CustomEvent('open-active-role-updated', { detail: role }))
}

function useActiveRole(fallback = 'player') {
  const [activeRole, setActiveRoleState] = useState(() => getStoredRole(fallback))

  useEffect(() => {
    const handleRoleUpdate = (event) => {
      setActiveRoleState(event.detail || getStoredRole(fallback))
    }

    window.addEventListener('open-active-role-updated', handleRoleUpdate)

    return () => {
      window.removeEventListener('open-active-role-updated', handleRoleUpdate)
    }
  }, [fallback])

  const setActiveRole = useCallback((role) => {
    setStoredRole(role)
  }, [])

  return [activeRole, setActiveRole]
}

export { ACTIVE_ROLE_KEY, setStoredRole }
export default useActiveRole
