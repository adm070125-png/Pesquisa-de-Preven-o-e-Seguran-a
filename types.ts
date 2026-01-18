
export type UserRole = 'Vendedor' | 'Supervisor' | 'Admin';

export interface User {
  id: string;
  nome: string;
  role: UserRole;
  status: 'Ativo' | 'Inativo';
}

export interface ActivitySession {
  startTime: string;
  endTime?: string;
  startLocation?: { lat: number; lng: number };
  endLocation?: { lat: number; lng: number };
}

export type ProfileType = 'Preventivo' | 'Parcialmente preventivo' | 'Reativo';

export interface SurveyRecord {
  id_pesquisa: string;
  userId: string;
  userName: string;
  timestampStart: string;
  timestampEnd?: string;
  locationStart: { lat: number; lng: number };
  locationEnd?: { lat: number; lng: number };
  data: FormData;
  status: 'em_andamento' | 'concluida' | 'cancelada';
  lastStep: number;
  isSynced?: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  bairro: string;
  cidade: string;
  endereco?: string;
  userId: string;
  userName: string;
  data_primeiro_contato: string;
  status: 'Ativo' | 'Inativo';
  pesquisaIds: string[];
  isSynced?: boolean;
}

export interface Venda {
  id: string;
  clienteId: string;
  nome_cliente: string;
  telefone: string;
  endereco: string;
  numero_contrato: string;
  vendedorId: string;
  vendedorNome: string;
  data_fechamento: string;
  status_venda: 'Ativo' | 'Cancelado';
  origem_pesquisaId?: string;
  criado_em: string;
  isSynced?: boolean;
}

export interface FormData {
  nome: string;
  telefone: string;
  bairro: string;
  cidade: string;
  perfilPreferencia: string; // Pergunta 2
  casaTipo: 'Própria' | 'Alugada' | ''; // Pergunta 3
  seguroResidencial: string; 
  oportunidadeResidencial: string;
  temVeiculo: 'Sim' | 'Não' | '';
  seguroVeicular: string;
  oportunidadeVeicular: string;
  planoSaude: 'Sim' | 'Não' | '';
  oportunidadeSaude: string;
  seguroVida: 'Sim' | 'Não' | '';
  oportunidadeVida: string;
  planoFunerario: 'Sim' | 'Não' | '';
  oportunidadeFunerario: string;
  dependentes: string[]; // Múltipla escolha
  preparacaoFamilia: string;
  custoImprevisto: string; // Pergunta 4
  melhorFormaResolver: string;
  importanciaFamilia: string; // Pergunta 5
  interesseConhecer: string;
  possoExplicar: string;
  observacoes: string;
}

export const INITIAL_DATA: FormData = {
  nome: '',
  telefone: '',
  bairro: '',
  cidade: '',
  perfilPreferencia: '',
  casaTipo: '',
  seguroResidencial: '',
  oportunidadeResidencial: '',
  temVeiculo: '',
  seguroVeicular: '',
  oportunidadeVeicular: '',
  planoSaude: '',
  oportunidadeSaude: '',
  seguroVida: '',
  oportunidadeVida: '',
  planoFunerario: '',
  oportunidadeFunerario: '',
  dependentes: [],
  preparacaoFamilia: '',
  custoImprevisto: '',
  melhorFormaResolver: '',
  importanciaFamilia: '',
  interesseConhecer: '',
  possoExplicar: '',
  observacoes: ''
};
