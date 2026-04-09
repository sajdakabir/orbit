import React from 'react'

interface Auth0ProviderProps {
  children: React.ReactNode
}

// Auth0 has been removed — Better Auth is the sole auth provider.
// This component is kept as a passthrough for backwards compatibility.
export const Auth0Provider: React.FC<Auth0ProviderProps> = ({ children }) => {
  return <>{children}</>
}

export default Auth0Provider
