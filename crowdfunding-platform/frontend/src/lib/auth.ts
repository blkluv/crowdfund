const ACCESS_TOKEN_KEY = "cf_access_token"
const REFRESH_TOKEN_KEY = "cf_refresh_token"

export function getAccessToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setTokens(tokens: { access_token: string; refresh_token?: string }) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  if (tokens.refresh_token) window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
}

export function clearTokens() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

