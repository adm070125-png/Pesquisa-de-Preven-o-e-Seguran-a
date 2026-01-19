
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Shield, User as UserIcon, LogOut, Play, History, 
  ChevronRight, ChevronLeft, CheckCircle2, Smartphone, 
  Lock, Plus, AlertCircle, Download, FileText, 
  Map as MapIconLucide, Search, BookUser, Briefcase, 
  Calendar, Tag, Check, WifiOff, CloudUpload, Save, Infinity, Receipt, Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { FormData, INITIAL_DATA, User, UserRole, ActivitySession, SurveyRecord, Cliente, Venda } from './types';
import { STEPS_COUNT } from './constants';
import { PhoneInput } from './components/InputMask';
import { ProgressBar } from './components/ProgressBar';
import { calculateProfile } from './utils/profileCalculator';

declare const L: any;

const LogoFull: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex flex-col items-center gap-1 ${className}`}>
    <div className="flex items-baseline gap-1">
      <span className="text-[10px] font-black tracking-[0.4em] text-[#005F6B] opacity-90 uppercase">Grupo</span>
    </div>
    <div className="flex items-center gap-0">
      <span className="text-3xl font-black tracking-tighter text-[#005F6B] uppercase">ETHE</span>
      <span className="text-3xl font-black tracking-tighter text-[#7CA8B5] uppercase">RNOS</span>
    </div>
    <Infinity className="w-6 h-6 text-[#005F6B] mt-1" />
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 p-6 ${className}`}>
    {children}
  </div>
);

const OptionButton: React.FC<{ label: string; selected: boolean; onClick: () => void }> = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
      selected 
        ? 'bg-[#f0f7f8] border-[#005F6B] shadow-md ring-1 ring-[#005F6B]' 
        : 'bg-white border-slate-100 hover:border-[#7CA8B5]'
    }`}
  >
    <span className={`text-sm font-semibold ${selected ? 'text-[#005F6B]' : 'text-slate-600'}`}>{label}</span>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'bg-[#005F6B] border-[#005F6B]' : 'bg-white border-slate-200'}`}>
      {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
    </div>
  </button>
);

const SubQuestion: React.FC<{ question: string; value: string; onChange: (v: string) => void }> = ({ question, value, onChange }) => (
  <div className="ml-4 pl-4 border-l-2 border-[#7CA8B5]/30 my-4 animate-in slide-in-from-left-2">
    <p className="text-[10px] font-black text-[#005F6B]/60 uppercase tracking-widest mb-3">{question}</p>
    <div className="grid grid-cols-2 gap-2">
      {['Sim', 'Não'].map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${
            value === opt ? 'bg-[#005F6B] text-white border-[#005F6B] shadow-lg' : 'bg-white text-slate-400 border-slate-100'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const AdminMap: React.FC<{ records: SurveyRecord[] }> = ({ records }) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current || typeof L === 'undefined') return;
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([-15.7801, -47.9292], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; contributors' }).addTo(mapRef.current);
    }
    const fg = L.featureGroup();
    records.forEach(r => {
      if (r.locationStart) L.circleMarker([r.locationStart.lat, r.locationStart.lng], { radius: 6, fillColor: "#005F6B", color: "#fff", weight: 2, fillOpacity: 0.8 }).addTo(fg);
      if (r.locationEnd) L.circleMarker([r.locationEnd.lat, r.locationEnd.lng], { radius: 6, fillColor: "#7CA8B5", color: "#fff", weight: 2, fillOpacity: 0.8 }).addTo(fg);
    });
    fg.addTo(mapRef.current);
    if (records.length > 0) try { mapRef.current.fitBounds(fg.getBounds()); } catch(e) {}
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [records]);
  return <div ref={containerRef} className="w-full h-[400px] rounded-3xl bg-slate-100 border border-slate-200 shadow-inner" />;
};

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Estados de Dados Persistentes
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [records, setRecords] = useState<SurveyRecord[]>(() => {
    const saved = localStorage.getItem('surveyRecords');
    return saved ? JSON.parse(saved) : [];
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('clientes');
    return saved ? JSON.parse(saved) : [];
  });

  const [vendas, setVendas] = useState<Venda[]>(() => {
    const saved = localStorage.getItem('vendas');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeSession, setActiveSession] = useState<ActivitySession | null>(() => {
    const saved = localStorage.getItem('activeSession');
    return saved ? JSON.parse(saved) : null;
  });

  // Estados de UI
  const [view, setView] = useState<'AUTH' | 'DASHBOARD' | 'SURVEY' | 'HISTORY' | 'ADMIN' | 'CLIENTS' | 'SALES' | 'NEW_SALE'>('AUTH');
  const [step, setStep] = useState(1);
  const [surveyData, setSurveyData] = useState<FormData>(INITIAL_DATA);
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [saleClient, setSaleClient] = useState<Cliente | null>(null);
  const [contractNumber, setContractNumber] = useState('');
  const [showError, setShowError] = useState(false);

  // Efeitos de Persistência
  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('surveyRecords', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('clientes', JSON.stringify(clientes)); }, [clientes]);
  useEffect(() => { localStorage.setItem('vendas', JSON.stringify(vendas)); }, [vendas]);
  useEffect(() => { localStorage.setItem('activeSession', JSON.stringify(activeSession)); }, [activeSession]);

  useEffect(() => {
    if (!currentUser) setView('AUTH');
    else if (currentUser.role === 'Admin') setView('ADMIN');
    else setView('DASHBOARD');
  }, [currentUser]);

  // Funções de Sessão
  const handleAuth = (mode: 'LOGIN' | 'SIGNUP', roleInput?: UserRole) => {
    const role: UserRole = roleInput || 'Vendedor';
    const mockUser: User = {
      id: role === 'Admin' ? 'gestor-01' : 'vendedor-01',
      nome: role === 'Admin' ? 'Administrador Ethernos' : 'Consultor de Campo',
      role: role, status: 'Ativo'
    };
    setCurrentUser(mockUser);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setView('AUTH');
  };

  const startActivity = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setActiveSession({ 
          startTime: new Date().toISOString(), 
          startLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude } 
        });
      });
    }
  };

  // Lógica de Validação de Etapa
  const isStepValid = useMemo(() => {
    switch (step) {
      case 2: return surveyData.nome.trim() !== '' && surveyData.telefone.trim() !== '' && surveyData.bairro.trim() !== '' && surveyData.cidade.trim() !== '';
      case 3: return surveyData.perfilPreferencia !== '';
      case 4: {
        const homeValid = surveyData.casaTipo === 'Própria' ? surveyData.seguroResidencial !== '' : surveyData.casaTipo === 'Alugada' ? surveyData.oportunidadeResidencial !== '' : false;
        const carValid = surveyData.temVeiculo === 'Sim' ? surveyData.seguroVeicular !== '' : surveyData.temVeiculo === 'Não' ? surveyData.oportunidadeVeicular !== '' : false;
        return homeValid && carValid;
      }
      case 5: {
        const healthValid = surveyData.planoSaude === 'Sim' ? true : surveyData.planoSaude === 'Não' ? surveyData.oportunidadeSaude !== '' : false;
        const lifeValid = surveyData.seguroVida === 'Sim' ? true : surveyData.seguroVida === 'Não' ? surveyData.oportunidadeVida !== '' : false;
        const funeralValid = surveyData.planoFunerario === 'Sim' ? true : surveyData.planoFunerario === 'Não' ? surveyData.oportunidadeFunerario !== '' : false;
        return healthValid && lifeValid && funeralValid;
      }
      case 6: return surveyData.dependentes.length > 0 && surveyData.preparacaoFamilia !== '';
      case 7: return surveyData.custoImprevisto !== '' && surveyData.interesseConhecer !== '';
      case 8: return surveyData.possoExplicar !== '';
      default: return true;
    }
  }, [step, surveyData]);

  const handleNextStep = () => {
    if (isStepValid) { setStep(step + 1); setShowError(false); }
    else setShowError(true);
  };

  const finalizeSurvey = () => {
    const ts = new Date().toISOString();
    const synced = navigator.onLine;
    const newRecord: SurveyRecord = {
      id_pesquisa: `SURV-${Date.now()}`,
      userId: currentUser!.id,
      userName: currentUser!.nome,
      timestampStart: ts,
      timestampEnd: ts,
      locationStart: { lat: 0, lng: 0 },
      data: surveyData,
      status: 'concluida',
      lastStep: step,
      isSynced: synced
    };
    setRecords(prev => [newRecord, ...prev]);

    // Atualização Automática do CRM
    setClientes(prev => {
      const exists = prev.find(c => c.telefone === surveyData.telefone);
      if (exists) return prev;
      return [{
        id: `CLI-${Date.now()}`,
        nome: surveyData.nome,
        telefone: surveyData.telefone,
        bairro: surveyData.bairro,
        cidade: surveyData.cidade,
        endereco: `${surveyData.bairro}, ${surveyData.cidade}`,
        userId: currentUser!.id,
        userName: currentUser!.nome,
        data_primeiro_contato: ts,
        status: 'Ativo',
        pesquisaIds: [newRecord.id_pesquisa],
        isSynced: synced
      }, ...prev];
    });

    setSurveyData(INITIAL_DATA); setStep(1); setView('DASHBOARD');
  };

  // Módulo de Registro de Venda
  const handleRegisterSale = () => {
    if (!saleClient || !contractNumber) return;
    const newVenda: Venda = {
      id: `VDA-${Date.now()}`,
      clienteId: saleClient.id,
      nome_cliente: saleClient.nome,
      telefone: saleClient.telefone,
      endereco: saleClient.endereco || '',
      numero_contrato: contractNumber,
      vendedorId: currentUser!.id,
      vendedorNome: currentUser!.nome,
      data_fechamento: new Date().toISOString(),
      status_venda: 'Ativo',
      criado_em: new Date().toISOString(),
      isSynced: navigator.onLine
    };
    setVendas(prev => [newVenda, ...prev]);
    setSaleClient(null); setContractNumber(''); setView('DASHBOARD');
  };

  const filteredClientes = clientes.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredVendas = vendas.filter(v => v.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) || v.numero_contrato.includes(searchTerm));

  const exportToPDF = (record: SurveyRecord) => {
    const doc = new jsPDF();
    const data = record.data;
    const profile = calculateProfile(data);
    
    doc.setFillColor(0, 95, 107);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('MAPEAMENTO PREVENTIVO ETHERNOS', 15, 25);
    
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.text(`Cliente: ${data.nome}`, 15, 55);
    doc.text(`Perfil: ${profile}`, 15, 65);
    doc.text(`Consultor: ${record.userName}`, 15, 75);
    
    doc.save(`Pesquisa_${data.nome.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-inter">
      {/* View de Autenticação */}
      {view === 'AUTH' && (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#005F6B] to-[#7CA8B5]">
          <Card className="max-w-md w-full p-12 text-center space-y-10 rounded-[3rem] shadow-2xl">
            <LogoFull />
            <div className="space-y-4">
              <button onClick={() => handleAuth('LOGIN')} className="w-full bg-[#005F6B] text-white py-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"><UserIcon className="w-5 h-5" /> Portal Consultor</button>
              <button onClick={() => handleAuth('LOGIN', 'Admin')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3"><Lock className="w-5 h-5" /> Gestão Master</button>
            </div>
          </Card>
        </div>
      )}

      {/* View Dashboard */}
      {view === 'DASHBOARD' && (
        <div className="max-w-xl mx-auto min-h-screen flex flex-col pb-20">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#005F6B] rounded-xl flex items-center justify-center text-white"><Infinity className="w-6 h-6" /></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seja bem-vindo</p><h2 className="text-base font-black text-slate-800">{currentUser?.nome}</h2></div>
            </div>
            <button onClick={logout} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
          </header>

          <main className="p-6 space-y-6">
            <Card className={activeSession ? 'bg-[#005F6B]/5 border-[#005F6B]/10' : ''}>
              {!activeSession ? (
                <button onClick={startActivity} className="w-full bg-[#005F6B] text-white py-6 rounded-[1.8rem] font-black flex items-center justify-center gap-3 shadow-xl transition-all"><Play className="w-5 h-5 fill-current" /> Iniciar Atividades</button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest"><span>Sessão Ativa</span><div className="w-2 h-2 bg-[#005F6B] rounded-full animate-ping"></div></div>
                  <button onClick={() => setActiveSession(null)} className="w-full bg-white text-slate-600 border border-slate-200 py-4 rounded-xl font-bold">Encerrar Turno</button>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => { if (!activeSession) return; setView('SURVEY'); setStep(1); setSurveyData(INITIAL_DATA); }}
                className={`w-full p-8 rounded-[2.5rem] flex items-center justify-between transition-all group ${activeSession ? 'bg-gradient-to-r from-[#005F6B] to-[#1a7a87] text-white shadow-2xl' : 'bg-slate-100 grayscale cursor-not-allowed opacity-60'}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl ${activeSession ? 'bg-white/20' : 'bg-slate-200'}`}><Plus className="w-8 h-8" /></div>
                  <div className="text-left"><span className="block text-xl font-black uppercase tracking-tight">Nova Pesquisa</span><span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Mapeamento de Campo</span></div>
                </div>
                <ChevronRight className="w-8 h-8 opacity-40 group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => setView('NEW_SALE')}
                className="w-full bg-slate-900 p-8 rounded-[2.5rem] flex items-center justify-between transition-all group text-white shadow-2xl"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 rounded-2xl bg-white/10"><Receipt className="w-8 h-8" /></div>
                  <div className="text-left"><span className="block text-xl font-black uppercase tracking-tight">Registrar Venda</span><span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Fechar Contrato</span></div>
                </div>
                <ChevronRight className="w-8 h-8 opacity-40 group-hover:translate-x-1" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView('CLIENTS')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 transition-all hover:border-[#005F6B]">
                <div className="p-4 bg-[#f0f7f8] text-[#005F6B] rounded-2xl"><BookUser className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Meus Clientes</span>
              </button>
              <button onClick={() => setView('SALES')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 transition-all hover:border-[#005F6B]">
                <div className="p-4 bg-[#f0f7f8] text-[#005F6B] rounded-2xl"><Briefcase className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Vendas / Contratos</span>
              </button>
            </div>
          </main>
        </div>
      )}

      {/* View Pesquisa (Survey) */}
      {view === 'SURVEY' && (
        <div className="max-w-xl mx-auto min-h-screen bg-white flex flex-col">
          <header className="p-6 border-b border-slate-100 flex items-center gap-4 sticky top-0 bg-white z-40">
            <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
            <div className="flex-1"><h2 className="text-[10px] font-black text-[#005F6B] uppercase tracking-[0.3em] mb-2">Mapeamento Ethernos</h2><ProgressBar currentStep={step} totalSteps={STEPS_COUNT} /></div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 pb-40">
            {step === 1 && (
              <div className="text-center space-y-10 py-10 animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-[#005F6B] text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl"><Smartphone className="w-12 h-12" /></div>
                <div className="space-y-4 px-6">
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Abordagem</h3>
                  <div className="bg-[#f0f7f8] p-8 rounded-[2rem] text-[#005F6B]/80 italic font-medium leading-relaxed border border-[#005F6B]/5">
                    "Olá! Estamos realizando uma pesquisa rápida sobre hábito de prevenção familiar pelo Grupo Ethernos. Leva menos de 5 minutos. Posso fazer com você?"
                  </div>
                </div>
                <button onClick={handleNextStep} className="w-full bg-[#005F6B] text-white py-6 rounded-2xl font-black shadow-xl">Sim, Aceitou</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-2 h-8 bg-[#005F6B] rounded-full"></div>Identificação</h3>
                <div className="space-y-6">
                  <input autoFocus placeholder="Nome do Entrevistado" className="w-full p-5 bg-[#f8fafc] rounded-2xl border-2 border-transparent font-bold focus:border-[#005F6B] outline-none transition-all" value={surveyData.nome} onChange={e => setSurveyData({...surveyData, nome: e.target.value})} />
                  <PhoneInput label="WhatsApp / Telefone" value={surveyData.telefone} onChange={v => setSurveyData({...surveyData, telefone: v})} required />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Bairro" className="w-full p-5 bg-[#f8fafc] rounded-2xl border-2 border-transparent font-bold focus:border-[#005F6B] outline-none" value={surveyData.bairro} onChange={e => setSurveyData({...surveyData, bairro: e.target.value})} />
                    <input placeholder="Cidade" className="w-full p-5 bg-[#f8fafc] rounded-2xl border-2 border-transparent font-bold focus:border-[#005F6B] outline-none" value={surveyData.cidade} onChange={e => setSurveyData({...surveyData, cidade: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-2 h-8 bg-[#005F6B] rounded-full"></div>Patrimônio Familiar</h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">A casa que você mora é:</p>
                    <div className="grid grid-cols-2 gap-4">
                      {['Própria', 'Alugada'].map(opt => (
                        <button key={opt} onClick={() => setSurveyData({...surveyData, casaTipo: opt as any, seguroResidencial: '', oportunidadeResidencial: ''})} className={`py-4 rounded-xl font-bold border-2 transition-all ${surveyData.casaTipo === opt ? 'bg-[#005F6B] text-white border-[#005F6B] shadow-md' : 'bg-[#f8fafc] text-slate-400 border-transparent'}`}>{opt}</button>
                      ))}
                    </div>
                    {surveyData.casaTipo === 'Própria' && (
                      <SubQuestion question="Tem seguro residencial?" value={surveyData.seguroResidencial} onChange={v => setSurveyData({...surveyData, seguroResidencial: v})} />
                    )}
                    {surveyData.casaTipo === 'Alugada' && (
                      <SubQuestion question="Se fosse própria e tivesse a oportunidade colocaria seguro?" value={surveyData.oportunidadeResidencial} onChange={v => setSurveyData({...surveyData, oportunidadeResidencial: v})} />
                    )}
                  </div>
                  <div className="space-y-3 border-t border-slate-100 pt-6">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem veículo próprio?</p>
                    <div className="grid grid-cols-2 gap-4">
                      {['Sim', 'Não'].map(opt => (
                        <button key={opt} onClick={() => setSurveyData({...surveyData, temVeiculo: opt as any, seguroVeicular: '', oportunidadeVeicular: ''})} className={`py-4 rounded-xl font-bold border-2 transition-all ${surveyData.temVeiculo === opt ? 'bg-[#005F6B] text-white border-[#005F6B] shadow-md' : 'bg-[#f8fafc] text-slate-400 border-transparent'}`}>{opt}</button>
                      ))}
                    </div>
                    {surveyData.temVeiculo === 'Sim' && (
                      <SubQuestion question="Tem seguro ou teria caso não tenha?" value={surveyData.seguroVeicular} onChange={v => setSurveyData({...surveyData, seguroVeicular: v})} />
                    )}
                    {surveyData.temVeiculo === 'Não' && (
                      <SubQuestion question="Se tivesse veículo colocaria no seguro se tivesse oportunidade?" value={surveyData.oportunidadeVeicular} onChange={v => setSurveyData({...surveyData, oportunidadeVeicular: v})} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-2 h-8 bg-[#005F6B] rounded-full"></div>Saúde e Proteção</h3>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem plano de saúde?</p>
                      <div className="grid grid-cols-2 gap-4">
                        {['Sim', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, planoSaude: opt as any, oportunidadeSaude: ''})} className={`py-4 rounded-xl font-bold border-2 transition-all ${surveyData.planoSaude === opt ? 'bg-[#005F6B] text-white border-[#005F6B] shadow-md' : 'bg-[#f8fafc] text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.planoSaude === 'Não' && (
                        <SubQuestion question="Teria um plano de saúde se tivesse oportunidade?" value={surveyData.oportunidadeSaude} onChange={v => setSurveyData({...surveyData, oportunidadeSaude: v})} />
                      )}
                    </div>
                    {/* Repete para Vida e Funerário com a mesma lógica... */}
                    <div className="space-y-2 border-t border-slate-100 pt-6">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem seguro de vida?</p>
                      <div className="grid grid-cols-2 gap-4">
                        {['Sim', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, seguroVida: opt as any, oportunidadeVida: ''})} className={`py-4 rounded-xl font-bold border-2 transition-all ${surveyData.seguroVida === opt ? 'bg-[#005F6B] text-white border-[#005F6B] shadow-md' : 'bg-[#f8fafc] text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.seguroVida === 'Não' && (
                        <SubQuestion question="Teria um seguro de vida se tivesse oportunidade?" value={surveyData.oportunidadeVida} onChange={v => setSurveyData({...surveyData, oportunidadeVida: v})} />
                      )}
                    </div>
                    <div className="space-y-2 border-t border-slate-100 pt-6">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem plano funerário?</p>
                      <div className="grid grid-cols-2 gap-4">
                        {['Sim', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, planoFunerario: opt as any, oportunidadeFunerario: ''})} className={`py-4 rounded-xl font-bold border-2 transition-all ${surveyData.planoFunerario === opt ? 'bg-[#005F6B] text-white border-[#005F6B] shadow-md' : 'bg-[#f8fafc] text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.planoFunerario === 'Não' && (
                        <SubQuestion question="Teria um plano se tivesse oportunidade?" value={surveyData.oportunidadeFunerario} onChange={v => setSurveyData({...surveyData, oportunidadeFunerario: v})} />
                      )}
                    </div>
                </div>
              </div>
            )}

            {step === 9 && (
              <div className="text-center space-y-10 py-10 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-[#005F6B] text-white rounded-full flex items-center justify-center mx-auto shadow-2xl"><CheckCircle2 className="w-12 h-12" /></div>
                <h3 className="text-3xl font-black text-slate-800">Mapeamento Concluído!</h3>
                <Card className="bg-[#f0f7f8] border-[#005F6B]/10 p-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Classificação Estratégica</p>
                  <p className="text-2xl font-black text-[#005F6B]">{calculateProfile(surveyData).toUpperCase()}</p>
                </Card>
                <button onClick={finalizeSurvey} className="w-full bg-[#005F6B] text-white py-6 rounded-2xl font-black shadow-2xl">Salvar e Voltar ao Início</button>
              </div>
            )}
          </div>

          <footer className="p-6 bg-white border-t border-slate-100 sticky bottom-0 z-50 shadow-lg">
            {step < 9 && (
                <div className="flex items-center gap-4">
                    {step > 1 && (<button onClick={() => setStep(step - 1)} className="w-16 h-16 bg-[#f8fafc] text-slate-400 flex items-center justify-center rounded-2xl"><ChevronLeft className="w-7 h-7" /></button>)}
                    <button onClick={handleNextStep} className={`flex-1 py-6 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-3 ${isStepValid ? 'bg-[#005F6B] text-white' : 'bg-slate-100 text-slate-300'}`}>
                        {step === 8 ? 'Ver Resultado' : 'Continuar Mapeamento'} <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            )}
            {showError && !isStepValid && (<p className="text-red-500 text-[10px] font-black uppercase text-center mt-4">Preencha todos os campos obrigatórios para avançar</p>)}
          </footer>
        </div>
      )}

      {/* View Registrar Nova Venda (Fechamento) */}
      {view === 'NEW_SALE' && (
        <div className="max-w-xl mx-auto min-h-screen bg-[#f8fafc] flex flex-col">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-40">
            <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Registrar Venda</h2>
          </header>
          <main className="p-6 space-y-6 flex-1">
            <Card className="space-y-6">
              {!saleClient ? (
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Selecione o Cliente</p>
                  <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input type="text" placeholder="Buscar cliente..." className="w-full pl-16 pr-6 py-5 rounded-2xl bg-[#f8fafc] border-none font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {filteredClientes.map(c => (
                      <button key={c.id} onClick={() => setSaleClient(c)} className="w-full text-left p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#005F6B] transition-all flex items-center justify-between">
                        <div><p className="font-black text-slate-800">{c.nome}</p><p className="text-xs text-slate-400">{c.telefone}</p></div>
                        <ChevronRight className="w-5 h-5 text-slate-200" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in zoom-in-95">
                  <div className="bg-[#f0f7f8] p-6 rounded-2xl border border-[#005F6B]/10 flex justify-between items-center">
                    <div><p className="text-[10px] font-black text-[#005F6B]/60 uppercase tracking-widest">Cliente Selecionado</p><p className="text-xl font-black text-slate-800">{saleClient.nome}</p></div>
                    <button onClick={() => setSaleClient(null)} className="text-xs font-black text-[#005F6B] underline uppercase">Alterar</button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número do Contrato / Proposta</label>
                    <input autoFocus placeholder="Ex: ETH-123456" className="w-full p-6 bg-[#f8fafc] rounded-2xl border-2 border-transparent font-black text-2xl focus:border-[#005F6B] transition-all outline-none" value={contractNumber} onChange={e => setContractNumber(e.target.value.toUpperCase())} />
                  </div>
                  <button onClick={handleRegisterSale} disabled={!contractNumber} className={`w-full py-6 rounded-2xl font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-3 ${contractNumber ? 'bg-slate-900 text-white shadow-[#000]/20' : 'bg-slate-100 text-slate-300'}`}>
                    <CheckCircle2 className="w-6 h-6" /> Confirmar Venda
                  </button>
                </div>
              )}
            </Card>
          </main>
        </div>
      )}

      {/* View Vendas (Contratos) */}
      {view === 'SALES' && (
        <div className="max-w-xl mx-auto min-h-screen bg-[#f8fafc] flex flex-col">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-40">
            <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Gestão de Contratos</h2>
          </header>
          <main className="p-6 space-y-4">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input type="text" placeholder="Filtrar contratos..." className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-white border-none font-bold shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {filteredVendas.length === 0 ? (
              <div className="text-center py-20 text-slate-300 font-bold uppercase text-xs tracking-widest">Nenhuma venda encontrada</div>
            ) : (
              filteredVendas.map(v => (
                <Card key={v.id} className="border-l-[12px] border-[#005F6B] shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black text-[#005F6B] uppercase tracking-widest">Contrato: {v.numero_contrato}</span>
                      <h4 className="text-xl font-black text-slate-800 leading-tight mt-1">{v.nome_cliente}</h4>
                    </div>
                    <div className="bg-[#f0f7f8] text-[#005F6B] px-3 py-1 rounded-full text-[10px] font-black uppercase">{v.status_venda}</div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-xs font-bold pt-4 border-t border-slate-50">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(v.data_fechamento).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Venda Direta</span>
                  </div>
                </Card>
              ))
            )}
          </main>
        </div>
      )}

      {/* View CRM Clientes */}
      {view === 'CLIENTS' && (
        <div className="max-w-xl mx-auto min-h-screen bg-[#f8fafc] flex flex-col">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-40">
            <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Carteira CRM</h2>
          </header>
          <main className="p-6 space-y-4">
             <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input type="text" placeholder="Buscar na carteira..." className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-white border-none font-bold shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {filteredClientes.map(cliente => (
              <button key={cliente.id} onClick={() => setSelectedCliente(cliente)} className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:border-[#005F6B] transition-all">
                <div className="text-left"><h4 className="font-black text-slate-800 text-lg leading-tight">{cliente.nome}</h4><span className="text-[10px] font-black text-[#7CA8B5] uppercase">{cliente.telefone}</span></div>
                <ChevronRight className="w-6 h-6 text-slate-200" />
              </button>
            ))}
          </main>
        </div>
      )}

      {/* View Admin */}
      {view === 'ADMIN' && (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            <LogoFull className="scale-75" />
            <button onClick={logout} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"><LogOut className="w-5 h-5" /></button>
          </header>
          <main className="max-w-7xl mx-auto w-full p-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[ 
                { l: 'Mapeamentos', v: records.length, i: History }, 
                { l: 'Carteira CRM', v: clientes.length, i: BookUser }, 
                { l: 'Vendas Totais', v: vendas.length, i: Receipt }, 
                { l: 'Conversão', v: `${records.length > 0 ? Math.round((vendas.length / records.length) * 100) : 0}%`, i: Infinity }
              ].map((s, idx) => (
                <Card key={idx} className="flex items-center gap-6 border-none shadow-xl hover:-translate-y-1 transition-all">
                  <div className="p-5 rounded-3xl bg-[#005F6B] text-white shadow-lg"><s.i className="w-8 h-8" /></div>
                  <div><p className="text-3xl font-black text-slate-800 tracking-tighter">{s.v}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{s.l}</p></div>
                </Card>
              ))}
            </div>
            <Card className="border-none shadow-2xl relative overflow-hidden p-0 h-[500px]">
              <div className="p-8 absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md flex items-center justify-between">
                <h4 className="text-lg font-black text-[#005F6B] uppercase tracking-tight flex items-center gap-3"><MapIconLucide className="w-7 h-7" /> Atuação Geográfica</h4>
              </div>
              <div className="w-full h-full">
                <AdminMap records={records} />
              </div>
            </Card>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
