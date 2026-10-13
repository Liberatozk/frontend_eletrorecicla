import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client'
import type { Usuario } from '../api/client'

type AuthState = {
  user: Usuario | null
  /** true enquanto a sessão salva (token) está sendo verificada ao abrir o site */
  carregando: boolean
  login: (email: string, senha: string) => Promise<Usuario>
  logout: () => void
  /** atualiza o usuário em memória depois de um PUT bem-sucedido */
  atualizarUsuario: (u: Usuario) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState<boolean>(() => getToken() !== null)

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  // Qualquer 401 numa rota protegida derruba a sessão.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Ao abrir o site: se há token, recupera o usuário; se não, só acorda o servidor.
  useEffect(() => {
    if (!getToken()) {
      void api.acordarServidor()
      return
    }
    let ativo = true
    api
      .me()
      .then((u) => {
        if (ativo) setUser(u)
      })
      .catch(() => {
        /* 401 já limpou a sessão pelo handler; outros erros deixam o usuário deslogado na tela */
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const login = useCallback(async (email: string, senha: string) => {
    const { token } = await api.login(email, senha)
    setToken(token)
    try {
      const u = await api.me()
      setUser(u)
      return u
    } catch (e) {
      clearToken()
      throw e
    }
  }, [])

  const atualizarUsuario = useCallback((u: Usuario) => setUser(u), [])

  const value = useMemo(
    () => ({ user, carregando, login, logout, atualizarUsuario }),
    [user, carregando, login, logout, atualizarUsuario]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
