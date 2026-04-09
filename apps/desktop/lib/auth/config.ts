// Auth configuration (Better Auth)
// Auth0 has been removed — these are kept for legacy compatibility with
// token validation code that references config.domain.
export const Auth0Config = {
  domain: '',
  clientId: '',
  audience: '',
  redirectUri: `${import.meta.env.VITE_GRPC_BASE_URL}/callback`,
  scope: '',
  useRefreshTokens: false,
  cacheLocation: 'localstorage' as const,
}
