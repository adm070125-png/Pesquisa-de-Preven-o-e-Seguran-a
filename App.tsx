
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Shield, User as UserIcon, LogOut, Play, History, 
  ChevronRight, ChevronLeft, CheckCircle2, Smartphone, 
  Lock, Plus, AlertCircle, Download, FileText, 
  Map as MapIconLucide, Search, BookUser, Briefcase, 
  Calendar, Tag, Check, WifiOff, CloudUpload, Save, Infinity, Receipt, X, ChevronDown, Heart, Home, Car, ClipboardList, Cloud, Wifi
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
  return <div ref={containerRef} className="w-full h-[400px] rounded-3xl bg-slate-100 border border-slate-200" />;
};

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Persistence states
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

  // UI States
  const [view, setView] = useState<'AUTH' | 'DASHBOARD' | 'SURVEY' | 'HISTORY' | 'ADMIN' | 'CLIENTS' | 'SALES' | 'NEW_SALE'>(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) return 'AUTH';
    return JSON.parse(user).role === 'Admin' ? 'ADMIN' : 'DASHBOARD';
  });
  
  const [step, setStep] = useState(1);
  const [surveyData, setSurveyData] = useState<FormData>(INITIAL_DATA);
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [saleClient, setSaleClient] = useState<Cliente | null>(null);
  const [contractNumber, setContractNumber] = useState('');
  const [showError, setShowError] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Storage Effects
  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('surveyRecords', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('clientes', JSON.stringify(clientes)); }, [clientes]);
  useEffect(() => { localStorage.setItem('vendas', JSON.stringify(vendas)); }, [vendas]);
  useEffect(() => { localStorage.setItem('activeSession', JSON.stringify(activeSession)); }, [activeSession]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth Functions
  const handleAuth = (roleInput?: UserRole) => {
    const role: UserRole = roleInput || 'Vendedor';
    const mockUser: User = {
      id: role === 'Admin' ? 'admin-01' : 'consultor-01',
      nome: role === 'Admin' ? 'Gestão Administrativa' : 'Consultor Ethernos',
      role: role, status: 'Ativo'
    };
    setCurrentUser(mockUser);
    setView(role === 'Admin' ? 'ADMIN' : 'DASHBOARD');
  };

  const logout = () => {
    setCurrentUser(null);
    setView('AUTH');
  };

  // Activity Session
  const startActivity = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setActiveSession({ 
          startTime: new Date().toISOString(), 
          startLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude } 
        });
      }, () => {
        setActiveSession({ startTime: new Date().toISOString() });
      });
    }
  };

  // Validation Logic
  const isStepValid = useMemo(() => {
    switch (step) {
      case 2: return surveyData.nome.trim() !== '' && surveyData.telefone.trim().length >= 10 && surveyData.bairro.trim() !== '' && surveyData.cidade.trim() !== '';
      case 3: return surveyData.perfilPreferencia !== '';
      case 4: {
        const h = surveyData.casaTipo === 'Própria' ? surveyData.seguroResidencial !== '' : surveyData.casaTipo === 'Alugada' ? surveyData.oportunidadeResidencial !== '' : false;
        const v = surveyData.temVeiculo === 'Sim' ? surveyData.seguroVeicular !== '' : surveyData.temVeiculo === 'Não' ? surveyData.oportunidadeVeicular !== '' : false;
        return h && v;
      }
      case 5: {
        const s = surveyData.planoSaude === 'Sim' ? true : surveyData.planoSaude === 'Não' ? surveyData.oportunidadeSaude !== '' : false;
        const v = surveyData.seguroVida === 'Sim' ? true : surveyData.seguroVida === 'Não' ? surveyData.oportunidadeVida !== '' : false;
        const f = surveyData.planoFunerario === 'Sim' ? true : surveyData.planoFunerario === 'Não' ? surveyData.oportunidadeFunerario !== '' : false;
        return s && v && f;
      }
      case 6: return surveyData.dependentes.length > 0 && surveyData.preparacaoFamilia !== '';
      case 7: return surveyData.custoImprevisto !== '' && surveyData.interesseConhecer !== '';
      case 8: return surveyData.possoExplicar !== '';
      default: return true;
    }
  }, [step, surveyData]);

  const handleNextStep = () => {
    if (isStepValid) { 
      setStep(step + 1); 
      setShowError(false); 
      window.scrollTo(0, 0);
    } else {
      setShowError(true);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setShowError(false);
      window.scrollTo(0, 0);
    }
  };

  const finalizeSurvey = () => {
    const ts = new Date().toISOString();
    const synced = isOnline;
    const newRecord: SurveyRecord = {
      id_pesquisa: `ETH-${Date.now()}`,
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

    // Update CRM
    setClientes(prev => {
      const existing = prev.find(c => c.telefone === surveyData.telefone);
      if (existing) return prev;
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

    setSurveyData(INITIAL_DATA); 
    setStep(1); 
    setView('DASHBOARD');
  };

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
      isSynced: isOnline
    };
    setVendas(prev => [newVenda, ...prev]);
    setSaleClient(null); 
    setContractNumber(''); 
    setView('DASHBOARD');
  };

  const filteredClientes = clientes.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredVendas = vendas.filter(v => v.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) || v.numero_contrato.includes(searchTerm));
  const filteredRecords = records.filter(r => (currentUser?.role === 'Admin' || r.userId === currentUser?.id) && (r.data.nome.toLowerCase().includes(searchTerm.toLowerCase()) || r.id_pesquisa.includes(searchTerm)));

  const exportToPDF = (record: SurveyRecord) => {
    const doc = new jsPDF();
    const data = record.data;
    const profile = calculateProfile(data);
    doc.setFillColor(0, 95, 107);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('GRUPO ETHERNOS - MAPEAMENTO', 15, 25);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.text(`Cliente: ${data.nome}`, 15, 55);
    doc.text(`Telefone: ${data.telefone}`, 15, 65);
    doc.text(`Perfil: ${profile}`, 15, 75);
    doc.text(`Consultor: ${record.userName}`, 15, 85);
    doc.save(`Pesquisa_${data.nome.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 overflow-x-hidden selection:bg-[#005F6B]/10">
      
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-[#005F6B] p-2 text-white text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" /> Modo Offline Ativado - Dados protegidos localmente
        </div>
      )}

      {/* Auth View */}
      {view === 'AUTH' && (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#005F6B] to-[#1a7a87]">
          <Card className="max-w-md w-full p-12 text-center space-y-12 rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 duration-500">
            <LogoFull />
            <div className="space-y-4">
              <button onClick={() => handleAuth('Vendedor')} className="w-full bg-[#005F6B] text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-95"><UserIcon className="w-5 h-5" /> Portal Consultor</button>
              <button onClick={() => handleAuth('Admin')} className="w-full bg-slate-900 text-white py-5 rounded-[1.8rem] font-black flex items-center justify-center gap-3 transition-all hover:bg-black"><Lock className="w-5 h-5" /> Administração</button>
            </div>
          </Card>
        </div>
      )}

      {/* Dashboard View */}
      {view === 'DASHBOARD' && (
        <div className="max-w-xl mx-auto min-h-screen flex flex-col pb-24">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#005F6B] rounded-2xl flex items-center justify-center text-white shadow-lg"><Infinity className="w-7 h-7" /></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Olá,</p><h2 className="text-base font-black text-[#005F6B] leading-tight">{currentUser?.nome}</h2></div>
            </div>
            <button onClick={logout} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
          </header>

          <main className="p-6 space-y-6">
            <Card className={activeSession ? 'bg-[#005F6B]/5 border-[#005F6B]/10' : ''}>
              {!activeSession ? (
                <button onClick={startActivity} className="w-full bg-[#005F6B] text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-xl transition-all hover:shadow-2xl active:scale-95"><Play className="w-6 h-6 fill-current" /> Iniciar Atividades</button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessão Iniciada: {new Date(activeSession.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <div className="w-2.5 h-2.5 bg-[#005F6B] rounded-full animate-ping"></div>
                  </div>
                  <button onClick={() => setActiveSession(null)} className="w-full bg-white text-slate-600 border border-slate-200 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all">Encerrar Turno</button>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => { if (!activeSession) return; setView('SURVEY'); setStep(1); setSurveyData(INITIAL_DATA); }}
                className={`w-full p-10 rounded-[2.5rem] flex items-center justify-between transition-all group relative overflow-hidden ${activeSession ? 'bg-[#005F6B] text-white shadow-2xl' : 'bg-slate-100 grayscale cursor-not-allowed opacity-60'}`}
              >
                <div className="flex items-center gap-6 relative z-10">
                  <div className={`p-4 rounded-2xl ${activeSession ? 'bg-white/20' : 'bg-slate-200'}`}><Plus className="w-8 h-8" /></div>
                  <span className="text-xl font-black uppercase tracking-tight">Iniciar Pesquisa</span>
                </div>
                <ChevronRight className="w-8 h-8 opacity-40 group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => { setSearchTerm(''); setView('CLIENTS'); }}
                className="w-full bg-white p-8 rounded-[2.5rem] flex items-center justify-between transition-all group shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100"
              >
                <div className="flex items-center gap-6 relative z-10">
                  <div className="p-4 rounded-2xl bg-blue-50 text-[#005F6B]"><BookUser className="w-8 h-8" /></div>
                  <span className="text-lg font-black text-slate-700 uppercase tracking-tight">CRM Carteira</span>
                </div>
                <ChevronRight className="w-8 h-8 text-slate-200 group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => { setSearchTerm(''); setView('SALES'); }}
                className="w-full bg-white p-8 rounded-[2.5rem] flex items-center justify-between transition-all group shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100"
              >
                <div className="flex items-center gap-6 relative z-10">
                  <div className="p-4 rounded-2xl bg-green-50 text-green-600"><Briefcase className="w-8 h-8" /></div>
                  <span className="text-lg font-black text-slate-700 uppercase tracking-tight">Vendas / Contratos</span>
                </div>
                <ChevronRight className="w-8 h-8 text-slate-200 group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => { setSearchTerm(''); setExpandedRecordId(null); setView('HISTORY'); }}
                className="w-full bg-white p-8 rounded-[2.5rem] flex items-center justify-between transition-all group shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100"
              >
                <div className="flex items-center gap-6 relative z-10">
                  <div className="p-4 rounded-2xl bg-slate-50 text-slate-400"><History className="w-8 h-8" /></div>
                  <span className="text-lg font-black text-slate-700 uppercase tracking-tight">Histórico Geral</span>
                </div>
                <ChevronRight className="w-8 h-8 text-slate-200 group-hover:translate-x-1" />
              </button>
            </div>

            <button 
              onClick={() => { setSearchTerm(''); setView('NEW_SALE'); }}
              className="w-full bg-slate-900 text-white p-6 rounded-[1.8rem] font-black uppercase text-sm flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
            >
              <Receipt className="w-5 h-5" /> Registrar Nova Venda
            </button>
          </main>
        </div>
      )}

      {/* View Histórico Geral - ACORDEÃO INTELIGENTE */}
      {view === 'HISTORY' && (
        <div className="max-w-xl mx-auto min-h-screen bg-[#f8fafc] flex flex-col pb-24">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-40 shadow-sm">
            <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl hover:bg-slate-100"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Histórico Geral</h2>
          </header>
          
          <main className="p-6 space-y-6">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input type="text" placeholder="Buscar pesquisa..." className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-white border-none font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#005F6B]/20 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-20 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Nenhuma pesquisa encontrada</div>
              ) : (
                filteredRecords.map(rec => {
                  const isExpanded = expandedRecordId === rec.id_pesquisa;
                  const profile = calculateProfile(rec.data);
                  
                  return (
                    <div key={rec.id_pesquisa} className={`bg-white rounded-[2.2rem] border transition-all duration-300 overflow-hidden shadow-sm ${isExpanded ? 'border-[#005F6B] ring-4 ring-[#005F6B]/5' : 'border-slate-100 hover:border-[#7CA8B5]/50'}`}>
                      {/* Accordion Header */}
                      <button 
                        onClick={() => setExpandedRecordId(isExpanded ? null : rec.id_pesquisa)}
                        className="w-full p-6 flex items-center justify-between text-left"
                      >
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-[#7CA8B5] uppercase tracking-[0.2em] mb-1">ID: {rec.id_pesquisa}</p>
                          <h4 className="text-lg font-black text-slate-800 leading-tight">{rec.data.nome || 'Pesquisa s/ Nome'}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest"><Calendar className="w-3.5 h-3.5" /> {new Date(rec.timestampStart).toLocaleDateString()}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${profile === 'Preventivo' ? 'bg-green-100 text-green-700' : profile === 'Reativo' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{profile}</span>
                          </div>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'bg-[#005F6B] text-white rotate-180' : 'bg-slate-50 text-slate-300'}`}>
                          <ChevronDown className="w-6 h-6" />
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="px-7 pb-7 pt-2 space-y-6 animate-in slide-in-from-top-4 duration-300">
                          <div className="h-px bg-slate-100 w-full opacity-60"></div>
                          
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Bens Familiares</p>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                  <span className="flex items-center gap-2"><Home className="w-4 h-4 text-[#005F6B]" /> Casa {rec.data.casaTipo}</span>
                                  {(rec.data.seguroResidencial === 'Sim' || rec.data.oportunidadeResidencial === 'Sim') ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-300" />}
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                  <span className="flex items-center gap-2"><Car className="w-4 h-4 text-[#005F6B]" /> Veículo {rec.data.temVeiculo}</span>
                                  {(rec.data.seguroVeicular === 'Sim' || rec.data.oportunidadeVeicular === 'Sim') ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-300" />}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Proteção & Saúde</p>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                  <span className="flex items-center gap-2"><Heart className="w-4 h-4 text-[#005F6B]" /> Plano Saúde</span>
                                  {(rec.data.planoSaude === 'Sim' || rec.data.oportunidadeSaude === 'Sim') ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-300" />}
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                  <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#005F6B]" /> Seguro Vida/Fun</span>
                                  {(rec.data.seguroVida === 'Sim' || rec.data.planoFunerario === 'Sim') ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-300" />}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#f0f7f8] p-5 rounded-2xl flex items-center justify-between border border-[#005F6B]/5 shadow-inner">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-[#005F6B] uppercase tracking-[0.2em]">Interesse em Prevenção:</p>
                              <p className="text-sm font-black text-slate-800">{rec.data.interesseConhecer || 'Não informado'}</p>
                            </div>
                            <button onClick={() => exportToPDF(rec)} className="bg-white p-4 rounded-xl text-[#005F6B] shadow-sm hover:bg-[#005F6B] hover:text-white transition-all"><Download className="w-5 h-5" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>
      )}

      {/* View SURVEY (Pesquisa) - OTIMIZADA */}
      {view === 'SURVEY' && (
        <div className="max-w-xl mx-auto min-h-screen bg-white flex flex-col shadow-2xl">
          <header className="p-6 border-b border-slate-100 flex items-center gap-4 sticky top-0 bg-white z-40">
            <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl hover:bg-slate-100"><ChevronLeft className="w-6 h-6" /></button>
            <div className="flex-1">
              <h2 className="text-[10px] font-black text-[#005F6B] uppercase tracking-[0.3em] mb-2">Mapeamento Ethernos</h2>
              <ProgressBar currentStep={step} totalSteps={STEPS_COUNT} />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 pb-40 relative">
            <div key={step} className="animate-in fade-in slide-in-from-right-8 duration-500">
              
              {step === 1 && (
                <div className="text-center space-y-12 py-10">
                  <div className="w-24 h-24 bg-[#005F6B] text-white rounded-[2.8rem] flex items-center justify-center mx-auto shadow-2xl"><Smartphone className="w-12 h-12" /></div>
                  <div className="space-y-6 px-6">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">Abordagem</h3>
                    <div className="bg-[#f0f7f8] p-10 rounded-[2.5rem] text-[#005F6B]/80 italic font-medium leading-relaxed border border-[#005F6B]/5 shadow-inner">
                      "Olá! Estamos realizando uma pesquisa rápida sobre hábito de prevenção familiar pelo Grupo Ethernos. Leva menos de 5 minutos. Posso fazer com você?"
                    </div>
                  </div>
                  <button onClick={handleNextStep} className="w-full bg-[#005F6B] text-white py-6 rounded-[1.8rem] font-black shadow-xl">Sim, aceitou participar</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-2 h-8 bg-[#005F6B] rounded-full"></div>Identificação</h3>
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Entrevistado</label>
                      <input autoFocus placeholder="Nome Completo" className="w-full p-6 bg-[#f8fafc] rounded-2xl border-2 border-transparent font-bold focus:border-[#005F6B] outline-none transition-all shadow-sm" value={surveyData.nome} onChange={e => setSurveyData({...surveyData, nome: e.target.value})} />
                    </div>
                    <PhoneInput label="WhatsApp / Telefone" value={surveyData.telefone} onChange={v => setSurveyData({...surveyData, telefone: v})} required />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bairro</label>
                        <input placeholder="Bairro" className="w-full p-6 bg-[#f8fafc] rounded-2xl border-2 border-transparent font-bold focus:border-[#005F6B] outline-none" value={surveyData.bairro} onChange={e => setSurveyData({...surveyData, bairro: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade</label>
                        <input placeholder="Cidade" className="w-full p-6 bg-[#f8fafc] rounded-2xl border-2 border-transparent font-bold focus:border-[#005F6B] outline-none" value={surveyData.cidade} onChange={e => setSurveyData({...surveyData, cidade: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-10">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-2 h-8 bg-[#005F6B] rounded-full"></div>Perfil de Atuação</h3>
                  <p className="text-slate-600 font-medium leading-relaxed">Você se considera uma pessoa que prefere agir antes que um problema aconteça ou resolver na hora da necessidade?</p>
                  <div className="space-y-4">
                    {['Se prevenir antes', 'Resolver na última hora', 'Nunca pensou muito sobre isso'].map(opt => (
                      <OptionButton key={opt} label={opt} selected={surveyData.perfilPreferencia === opt} onClick={() => { setSurveyData({...surveyData, perfilPreferencia: opt}); setTimeout(handleNextStep, 300); }} />
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-10">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-2 h-8 bg-[#005F6B] rounded-full"></div>Patrimônio & Segurança</h3>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">A casa que você mora é:</p>
                      <div className="grid grid-cols-2 gap-4">
                        {['Própria', 'Alugada'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, casaTipo: opt as any, seguroResidencial: '', oportunidadeResidencial: ''})} className={`py-5 rounded-2xl font-bold border-2 transition-all ${surveyData.casaTipo === opt ? 'bg-[#005F6B] text-white border-[#005F6B] shadow-md' : 'bg-[#f8fafc] text-slate-400 border-transparent'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.casaTipo === 'Própria' && (
                        <SubQuestion question="Atualmente tem seguro residencial?" value={surveyData.seguroResidencial} onChange={v => setSurveyData({...surveyData, seguroResidencial: v})} />
                      )}
                      {surveyData.casaTipo === 'Alugada' && (
                        <SubQuestion question="Se fosse própria e tivesse a oportunidade colocaria seguro?" value={surveyData.oportunidadeResidencial} onChange={v => setSurveyData({...surveyData, oportunidadeResidencial: v})} />
                      )}
                    </div>
                    <div className="space-y-4 border-t border-slate-50 pt-8">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem veículo próprio?</p>
                      <div className="grid grid-cols-2 gap-4">
                        {['Sim', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, temVeiculo: opt as any, seguroVeicular: '', oportunidadeVeicular: ''})} className={`py-5 rounded-2xl font-bold border-2 transition-all ${surveyData.temVeiculo === opt ? 'bg-[#005F6B] text-white border-[#005F6B] shadow-md' : 'bg-[#f8fafc] text-slate-400 border-transparent'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.temVeiculo === 'Sim' && (
                        <SubQuestion question="Possui seguro ou assistência veicular?" value={surveyData.seguroVeicular} onChange={v => setSurveyData({...surveyData, seguroVeicular: v})} />
                      )}
                      {surveyData.temVeiculo === 'Não' && (
                        <SubQuestion question="Se tivesse veículo, colocaria no seguro se tivesse oportunidade?" value={surveyData.oportunidadeVeicular} onChange={v => setSurveyData({...surveyData, oportunidadeVeicular: v})} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-10">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-2 h-8 bg-[#005F6B] rounded-full"></div>Saúde e Proteção Vital</h3>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem plano de saúde?</p>
                      <div className="grid grid-cols-2 gap-4">
                        {['Sim', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, planoSaude: opt as any, oportunidadeSaude: ''})} className={`py-5 rounded-2xl font-bold border-2 transition-all ${surveyData.planoSaude === opt ? 'bg-[#005F6B] text-white border-[#005F6B] shadow-md' : 'bg-[#f8fafc] text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.planoSaude === 'Não' && (
                        <SubQuestion question="Teria um plano se tivesse a oportunidade?" value={surveyData.oportunidadeSaude} onChange={v => setSurveyData({...surveyData, oportunidadeSaude: v})} />
                      )}
                    </div>
                    <div className="space-y-3 border-t border-slate-50 pt-8">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem seguro de vida?</p>
                      <div className="grid grid-cols-2 gap-4">
                        {['Sim', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, seguroVida: opt as any, oportunidadeVida: ''})} className={`py-5 rounded-2xl font-bold border-2 transition-all ${surveyData.seguroVida === opt ? 'bg-[#005F6B] text-white border-[#005F6B] shadow-md' : 'bg-[#f8fafc] text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.seguroVida === 'Não' && (
                        <SubQuestion question="Teria um seguro se tivesse a oportunidade?" value={surveyData.oportunidadeVida} onChange={v => setSurveyData({...surveyData, oportunidadeVida: v})} />
                      )}
                    </div>
                    <div className="space-y-3 border-t border-slate-50 pt-8">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem plano preventivo funerário?</p>
                      <div className="grid grid-cols-2 gap-4">
                        {['Sim', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, planoFunerario: opt as any, oportunidadeFunerario: ''})} className={`py-5 rounded-2xl font-bold border-2 transition-all ${surveyData.planoFunerario === opt ? 'bg-[#005F6B] text-white border-[#005F6B] shadow-md' : 'bg-[#f8fafc] text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.planoFunerario === 'Não' && (
                        <SubQuestion question="Teria um plano funerário se tivesse oportunidade?" value={surveyData.oportunidadeFunerario} onChange={v => setSurveyData({...surveyData, oportunidadeFunerario: v})} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 9 && (
                <div className="text-center space-y-12 py-10 animate-in zoom-in-95">
                  <div className="w-24 h-24 bg-[#005F6B] text-white rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce"><CheckCircle2 className="w-14 h-14" /></div>
                  <h3 className="text-3xl font-black text-slate-800">Concluído!</h3>
                  <Card className="bg-[#f0f7f8] border-[#005F6B]/10 p-10 shadow-inner">
                    <p className="text-[10px] font-black text-[#7CA8B5] uppercase tracking-[0.3em] mb-3">Classificação do Cliente</p>
                    <p className="text-3xl font-black text-[#005F6B] tracking-tighter">{calculateProfile(surveyData).toUpperCase()}</p>
                  </Card>
                  <button onClick={finalizeSurvey} className="w-full bg-[#005F6B] text-white py-6 rounded-[2rem] font-black shadow-2xl flex items-center justify-center gap-3"><Save className="w-6 h-6" /> Finalizar Mapeamento</button>
                </div>
              )}
            </div>
          </div>

          <footer className="p-6 bg-white border-t border-slate-100 sticky bottom-0 z-50 shadow-xl">
            {step < 9 && (
              <div className="flex items-center gap-4">
                {step > 1 && (
                  <button onClick={handlePrevStep} className="w-16 h-16 bg-[#f8fafc] text-slate-400 flex items-center justify-center rounded-2xl hover:bg-[#005F6B] hover:text-white transition-all"><ChevronLeft className="w-8 h-8" /></button>
                )}
                <button onClick={handleNextStep} className={`flex-1 py-6 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-3 ${isStepValid ? 'bg-[#005F6B] text-white' : 'bg-slate-100 text-slate-300'}`}>
                  {step === 8 ? 'Ver Resultado' : 'Próxima Etapa'} <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
            {showError && !isStepValid && (
              <p className="text-red-500 text-[10px] font-black uppercase text-center mt-4 tracking-widest animate-pulse">Preencha todos os campos obrigatórios para avançar</p>
            )}
          </footer>
        </div>
      )}

      {/* Outras Views Simplificadas conforme solicitado */}
      {view === 'NEW_SALE' && (
        <div className="max-w-xl mx-auto min-h-screen bg-[#f8fafc] flex flex-col pb-24">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-40">
            <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Nova Venda</h2>
          </header>
          <main className="p-6 space-y-8 flex-1">
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
                  <button onClick={handleRegisterSale} disabled={!contractNumber} className={`w-full py-6 rounded-2xl font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-3 ${contractNumber ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-300'}`}>
                    <CheckCircle2 className="w-6 h-6" /> Confirmar Venda
                  </button>
                </div>
              )}
            </Card>
          </main>
        </div>
      )}

      {view === 'CLIENTS' && (
        <div className="max-w-xl mx-auto min-h-screen bg-[#f8fafc] flex flex-col pb-24">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-40">
            <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Carteira CRM</h2>
          </header>
          <main className="p-6 space-y-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input type="text" placeholder="Buscar na carteira..." className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-white border-none font-bold shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="space-y-4">
              {filteredClientes.map(cliente => (
                <button key={cliente.id} onClick={() => setSelectedCliente(cliente)} className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:border-[#005F6B] transition-all">
                  <div className="text-left space-y-1">
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{cliente.nome}</h4>
                    <span className="text-[10px] font-black text-[#7CA8B5] uppercase">{cliente.telefone}</span>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-200" />
                </button>
              ))}
            </div>
          </main>
        </div>
      )}

      {view === 'SALES' && (
        <div className="max-w-xl mx-auto min-h-screen bg-[#f8fafc] flex flex-col pb-24">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-40">
            <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Contratos</h2>
          </header>
          <main className="p-6 space-y-4">
            {filteredVendas.map(v => (
              <Card key={v.id} className="border-l-[12px] border-[#005F6B] shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-[#005F6B] uppercase tracking-widest">Contrato: {v.numero_contrato}</span>
                    <h4 className="text-xl font-black text-slate-800 leading-tight mt-1">{v.nome_cliente}</h4>
                  </div>
                  <div className="bg-[#f0f7f8] text-[#005F6B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Ativo</div>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-xs font-bold pt-4 border-t border-slate-50">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(v.data_fechamento).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </main>
        </div>
      )}

      {view === 'ADMIN' && (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            <LogoFull className="scale-75" />
            <button onClick={logout} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-[#005F6B] hover:text-white transition-all"><LogOut className="w-5 h-5" /></button>
          </header>
          <main className="max-w-7xl mx-auto w-full p-6 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[ 
                { l: 'Mapeamentos', v: records.length, i: History }, 
                { l: 'Leads CRM', v: clientes.length, i: BookUser }, 
                { l: 'Vendas Totais', v: vendas.length, i: Receipt }, 
                { l: 'Conversão', v: `${records.length > 0 ? Math.round((vendas.length / records.length) * 100) : 0}%`, i: Infinity }
              ].map((s, idx) => (
                <Card key={idx} className="flex items-center gap-6 border-none shadow-xl hover:-translate-y-1 transition-all">
                  <div className="p-5 rounded-3xl bg-[#005F6B] text-white shadow-lg"><s.i className="w-8 h-8" /></div>
                  <div><p className="text-3xl font-black text-slate-800 leading-none">{s.v}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{s.l}</p></div>
                </Card>
              ))}
            </div>
            <Card className="border-none shadow-2xl relative overflow-hidden p-0 h-[500px]">
              <div className="p-8 absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md flex items-center justify-between">
                <h4 className="text-lg font-black text-[#005F6B] uppercase tracking-tight flex items-center gap-3"><MapIconLucide className="w-7 h-7" /> Atuação Estratégica</h4>
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
