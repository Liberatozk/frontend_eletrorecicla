import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

const AVISO =
  'O cadastro de empresas e pontos de coleta ainda não está disponível nesta versão. Nenhum dado foi enviado.'

type CampoProps = {
  label: string
  name: string
  placeholder: string
  type?: string
  required?: boolean
}

function Campo({ label, name, placeholder, type = 'text', required = true }: CampoProps) {
  return (
    <label className="input-label">
      {label}
      {required ? ' *' : ''}
      <input name={name} type={type} placeholder={placeholder} required={required} />
    </label>
  )
}

// Estrutura comum: formulário só visual, o botão avisa que ainda não envia nada.
function Formulario({ children, botao }: { children: ReactNode; botao: string }) {
  const [aviso, setAviso] = useState('')

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAviso(AVISO)
  }

  return (
    <form onSubmit={enviar}>
      {children}
      {aviso && (
        <p className="form-notice" role="status">
          {aviso}
        </p>
      )}
      <button type="submit" className="btn btn-primary">
        {botao}
      </button>
    </form>
  )
}

export function EmpresaForm() {
  return (
    <Formulario botao="Cadastrar Empresa">
      <div className="form-grid">
        <Campo label="Razão Social" name="razaoSocial" placeholder="Preencha este campo" />
        <div className="two-col">
          <Campo label="CNPJ" name="cnpj" placeholder="00.000.000/0000-00" />
          <Campo label="Cidade" name="cidade" placeholder="Preencha este campo" />
        </div>
        <Campo label="Email Corporativo" name="email" type="email" placeholder="contato@empresa.com.br" />
        <Campo label="Telefone" name="telefone" type="tel" placeholder="(00) 00000-0000" />
        <Campo label="Endereço Completo" name="endereco" placeholder="Preencha este campo" />
        <Campo label="Estado" name="estado" placeholder="Preencha este campo" />
        <div className="two-col">
          <Campo label="Latitude" name="latitude" placeholder="-23.550520" required={false} />
          <Campo label="Longitude" name="longitude" placeholder="-46.633308" required={false} />
        </div>
        <p className="field-help">As coordenadas serão utilizadas para exibição do ponto de coleta no mapa.</p>
        <div className="two-col">
          <Campo label="Crie uma Senha" name="senha" type="password" placeholder="••••••••••••" />
          <Campo label="Confirme a Senha" name="confirmar" type="password" placeholder="••••••••••••" />
        </div>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" required /> Aceito os Termos de Uso e Política de Privacidade da plataforma.
      </label>
      <label className="checkbox-row">
        <input type="checkbox" /> Desejo receber dicas de reciclagem e novidades da EletroRecicla.
      </label>
    </Formulario>
  )
}

const MATERIAIS = [
  'Celulares e Tablets',
  'Pilhas e Baterias',
  'Computadores e Periféricos',
  'Eletrodomésticos Pequenos',
]

export function PontoForm() {
  return (
    <Formulario botao="Cadastrar Ponto de Coleta">
      <div className="form-grid">
        <label className="input-label">
          Empresa Responsável *
          {/* Opção de exemplo: numa versão futura a lista virá de GET /empresas/aprovadas */}
          <select name="empresa" required defaultValue="">
            <option value="" disabled>
              Selecione a empresa
            </option>
            <option value="1">EcoPonto Reciclagem Ltda</option>
          </select>
        </label>
        <Campo label="Nome do Ponto de Coleta" name="nome" placeholder="Preencha este campo" />
        <div className="two-col">
          <Campo label="Responsável pelo Local" name="responsavel" placeholder="Preencha este campo" />
          <Campo label="Telefone de Contato" name="telefone" type="tel" placeholder="(00) 00000-0000" />
        </div>
        <Campo label="Email de Contato" name="email" type="email" placeholder="contato@ecoponto.com.br" />
        <Campo label="Endereço Completo" name="endereco" placeholder="Preencha este campo" />
        <div className="two-col">
          <Campo label="Latitude" name="latitude" placeholder="-23.550520" required={false} />
          <Campo label="Longitude" name="longitude" placeholder="-46.633308" required={false} />
        </div>
        <p className="field-help">A localização será exibida para usuários que procuram locais para descarte.</p>
        <div>
          <p className="form-section-title">Materiais Aceitos</p>
          <div className="materials-checks">
            {MATERIAIS.map((m) => (
              <label key={m} className="checkbox-row">
                <input type="checkbox" name="materiais" value={m} /> {m}
              </label>
            ))}
          </div>
        </div>
        <label className="input-label">
          Observações
          <textarea
            name="observacoes"
            rows={4}
            placeholder="Adicione orientações de acesso, horários ou outras informações úteis."
          />
        </label>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" required /> Confirmo a veracidade das informações fornecidas.
      </label>
    </Formulario>
  )
}