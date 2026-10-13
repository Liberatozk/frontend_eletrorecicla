// Camada única de comunicação com a API do EletroRecicla.
// A URL vem do arquivo .env (VITE_API_URL), nunca fixa no código.

const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/+$/, '')

export type PapelUsuario = 'CIDADAO' | 'ADMIN'

export type Usuario = {
  id: number
  nome: string
  email: string
  telefone: string | null
  cpf: string | null
  status: 'ATIVO' | 'INATIVO'
  role: PapelUsuario
  dataCadastro: string
}

export type CadastroInput = {
  nome: string
  email: string
  senha: string
  telefone?: string
  cpf?: string
}

// Todos opcionais: o backend só altera o que for enviado.
export type AtualizacaoInput = Partial<CadastroInput>

// ---------- Token ----------
const TOKEN_KEY = 'eletrorecicla_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* armazenamento indisponível: a sessão dura só até recarregar */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignorar */
  }
}

// O AuthContext registra aqui o que fazer quando a API responde 401
// numa rota protegida (sessão inválida).
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn
}

// ---------- Erros ----------
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function mensagemDeErro(status: number, data: unknown): string {
  // O backend devolve { "erro": "mensagem em português" } nos erros de regra de negócio.
  if (typeof data === 'object' && data !== null && 'erro' in data) {
    const erro = (data as { erro: unknown }).erro
    if (typeof erro === 'string' && erro) return erro
  }
  // 401 sem token e 403 podem vir sem corpo: decidimos pelo status.
  if (status === 401) return 'Sessão expirada ou credenciais inválidas.'
  if (status === 403) return 'Você não tem permissão para fazer isso.'
  if (status === 404) return 'Registro não encontrado.'
  if (status === 409) return 'Conflito ao salvar os dados.'
  return 'Erro inesperado. Tente novamente.'
}

// ---------- Requisição base ----------
type Opcoes = RequestInit & { semToken?: boolean }

// Timeout longo de propósito: o Render gratuito leva ~50 s para acordar.
const TIMEOUT_MS = 90_000

async function request<T>(path: string, opcoes: Opcoes = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, 'URL da API não configurada (VITE_API_URL no arquivo .env).')
  }

  const { semToken, ...init } = opcoes
  // Login e cadastro são públicos: não enviamos token neles (um token
  // vencido guardado no navegador não pode atrapalhar essas rotas).
  const token = semToken ? null : getToken()

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((init.headers as Record<string, string> | undefined) ?? {}),
      },
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError(0, 'O servidor demorou para responder. Tente novamente em instantes.')
    }
    // Falha de rede ou bloqueio de CORS (o navegador não diferencia os dois).
    throw new ApiError(0, 'Não foi possível conectar ao servidor.')
  } finally {
    window.clearTimeout(timer)
  }

  // 204 (DELETE) não tem corpo: por isso lemos como texto e só então tentamos JSON.
  const texto = await response.text()
  let data: unknown = null
  if (texto) {
    try {
      data = JSON.parse(texto)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.()
    throw new ApiError(response.status, mensagemDeErro(response.status, data))
  }
  return data as T
}

// ---------- Endpoints ----------
export const api = {
  login: (email: string, senha: string) =>
    request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
      semToken: true,
    }),

  cadastrar: (dados: CadastroInput) =>
    request<Usuario>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(dados),
      semToken: true,
    }),

  me: () => request<Usuario>('/usuarios/me'),

  atualizar: (id: number, dados: AtualizacaoInput) =>
    request<Usuario>(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),

  excluir: (id: number) => request<void>(`/usuarios/${id}`, { method: 'DELETE' }),

  // Chamada leve só para acordar o servidor do Render; erros são ignorados.
  acordarServidor: () => request<unknown>('/categorias', { semToken: true }).catch(() => undefined),
}
