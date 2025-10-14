import { api } from 'src/boot/axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface AuthResponse {
  user: {
    id: number
    deletedAt: string | null
    email: string
    isAdmin: boolean
  }
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthResponse['user'] | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  if (accessToken.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken.value}`
  }

  function setAuthData(data: AuthResponse) {
    user.value = data.user
    accessToken.value = data.tokens.accessToken
    refreshToken.value = data.tokens.refreshToken
    localStorage.setItem('accessToken', data.tokens.accessToken)
    localStorage.setItem('refreshToken', data.tokens.refreshToken)
    api.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${data.tokens.accessToken}`
  }

  function clearAuthData() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    delete api.defaults.headers.common['Authorization']
  }

  async function login(email: string, password: string) {
    const response = await api.post<AuthResponse>('/auth/login-by-email', {
      email,
      password,
    })
    setAuthData(response.data)
  }

  async function loginWithGoogle() {
    try {
      window.location.href =
        'https://accounts.google.com/o/oauth2/v2/auth?' +
        'response_type=code&' +
        'client_id=956794572640-6r238g8aksml0urfpamerf5an4l2rufm.apps.googleusercontent.com&' +
        'redirect_uri=http://localhost:8080/auth/google/callback&' +
        'scope=email profile'
    } catch (error) {
      console.error('Google login error:', error)
      throw error
    }
  }

  async function logout() {
    clearAuthData()
  }

  function isAuthenticated() {
    return !!accessToken.value
  }

  return {
    user,
    accessToken,
    refreshToken,
    login,
    loginWithGoogle,
    logout,
    isAuthenticated,
  }
})
