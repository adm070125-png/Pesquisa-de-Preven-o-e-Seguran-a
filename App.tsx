
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Shield, MapPin, User as UserIcon, LogOut, Play, Square, 
  History, BarChart3, ChevronRight, ChevronLeft, CheckCircle2,
  Info, Smartphone, Lock, Map as MapIcon, RefreshCw, Plus, Mail, AlertCircle, Download, FileText, Map as MapIconLucide, Eye, EyeOff, Users, Search, BookUser, ExternalLink, Filter, X, Briefcase, Calendar, Tag, CreditCard, Check, Wifi, WifiOff, CloudUpload, Cloud, ClipboardList, Save
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { FormData, INITIAL_DATA, User, UserRole, ActivitySession, SurveyRecord, Cliente, Venda } from './types';
import { STEPS_COUNT } from './constants';
import { PhoneInput } from './components/InputMask';
import { ProgressBar } from './components/ProgressBar';
import { calculateProfile } from './utils/profileCalculator';

declare const L: any;

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
        ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500' 
        : 'bg-white border-slate-100 hover:border-blue-200'
    }`}
  >
    <span className={`text-sm font-semibold ${selected ? 'text-blue-700' : 'text-slate-600'}`}>{label}</span>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'}`}>
      {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
    </div>
  </button>
);

const CheckboxOption: React.FC<{ label: string; selected: boolean; onClick: () => void }> = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
      selected 
        ? 'bg-indigo-50 border-indigo-500' 
        : 'bg-white border-slate-100'
    }`}
  >
    <span className={`text-sm font-semibold ${selected ? 'text-indigo-700' : 'text-slate-600'}`}>{label}</span>
    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selected ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-200'}`}>
      {selected && <Check className="w-3.5 h-3.5 text-white" />}
    </div>
  </button>
);

const SubQuestion: React.FC<{ question: string; value: string; onChange: (v: string) => void }> = ({ question, value, onChange }) => (
  <div className="ml-4 pl-4 border-l-2 border-blue-100 my-4 animate-in slide-in-from-left-2">
    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">{question}</p>
    <div className="grid grid-cols-2 gap-2">
      {['Sim', 'Não'].map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${
            value === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const ConfirmModal: React.FC<{ 
  isOpen: boolean; 
  onConfirm: () => void; 
  onCancel: () => void;
  message: string;
}> = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-blue-50 w-16 h-16 rounded-3xl flex items-center justify-center text-blue-500 mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-800 text-center mb-2">Confirmação</h3>
        <p className="text-slate-500 text-center mb-8 font-medium leading-relaxed">{message}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="w-full py-4 rounded-2xl font-black bg-slate-100 text-slate-500">Não</button>
          <button onClick={onConfirm} className="w-full py-4 rounded-2xl font-black bg-blue-600 text-white">Sim</button>
        </div>
      </div>
    </div>
  );
};

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
      if (r.locationStart) L.circleMarker([r.locationStart.lat, r.locationStart.lng], { radius: 6, fillColor: "#2563eb", color: "#fff", weight: 2, fillOpacity: 0.8 }).addTo(fg);
      if (r.locationEnd) L.circleMarker([r.locationEnd.lat, r.locationEnd.lng], { radius: 6, fillColor: "#dc2626", color: "#fff", weight: 2, fillOpacity: 0.8 }).addTo(fg);
    });
    fg.addTo(mapRef.current);
    if (records.length > 0) try { mapRef.current.fitBounds(fg.getBounds()); } catch(e) {}
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [records]);
  return <div ref={containerRef} className="w-full h-[400px] rounded-3xl bg-slate-100 border border-slate-200" />;
};

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

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

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    if (!saved || saved === 'null') return null;
    try { return JSON.parse(saved); } catch (e) { return null; }
  });

  const [activeSession, setActiveSession] = useState<ActivitySession | null>(() => {
    const saved = localStorage.getItem('activeSession');
    if (!saved || saved === 'null') return null;
    try { return JSON.parse(saved); } catch (e) { return null; }
  });

  const [records, setRecords] = useState<SurveyRecord[]>(() => {
    const saved = localStorage.getItem('surveyRecords');
    if (!saved || saved === 'null') return [];
    try { return JSON.parse(saved); } catch (e) { return []; }
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('clientes');
    if (!saved || saved === 'null') return [];
    try { return JSON.parse(saved); } catch (e) { return []; }
  });

  const [vendas, setVendas] = useState<Venda[]>(() => {
    const saved = localStorage.getItem('vendas');
    if (!saved || saved === 'null') return [];
    try { return JSON.parse(saved); } catch (e) { return []; }
  });

  const [view, setView] = useState<'AUTH' | 'DASHBOARD' | 'SURVEY' | 'HISTORY' | 'ADMIN' | 'CLIENTS' | 'SALES' | 'NEW_SALE'>(() => {
    if (!currentUser) return 'AUTH';
    const inProgress = localStorage.getItem('surveyRecords');
    if (inProgress) {
        try {
            const parsed = JSON.parse(inProgress);
            const activeOne = (parsed as SurveyRecord[]).find(r => r.userId === currentUser.id && r.status === 'em_andamento');
            if (activeOne) return 'SURVEY';
        } catch(e) {}
    }
    return currentUser.role === 'Admin' ? 'ADMIN' : 'DASHBOARD';
  });

  const [step, setStep] = useState(() => {
    if (currentUser) {
        const inProgress = localStorage.getItem('surveyRecords');
        if (inProgress) {
            try {
                const parsed = JSON.parse(inProgress);
                const activeOne = (parsed as SurveyRecord[]).find(r => r.userId === currentUser.id && r.status === 'em_andamento');
                if (activeOne) return activeOne.lastStep || 1;
            } catch(e) {}
        }
    }
    return 1;
  });

  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(() => {
    if (currentUser) {
        const inProgress = localStorage.getItem('surveyRecords');
        if (inProgress) {
            try {
                const parsed = JSON.parse(inProgress);
                const activeOne = (parsed as SurveyRecord[]).find(r => r.userId === currentUser.id && r.status === 'em_andamento');
                if (activeOne) return activeOne.id_pesquisa;
            } catch(e) {}
        }
    }
    return null;
  });

  const [surveyData, setSurveyData] = useState<FormData>(() => {
    if (currentUser) {
        const inProgress = localStorage.getItem('surveyRecords');
        if (inProgress) {
            try {
                const parsed = JSON.parse(inProgress);
                const activeOne = (parsed as SurveyRecord[]).find(r => r.userId === currentUser.id && r.status === 'em_andamento');
                if (activeOne) return activeOne.data;
            } catch(e) {}
        }
    }
    return INITIAL_DATA;
  });

  const [showError, setShowError] = useState(false);
  const [saleClient, setSaleClient] = useState<Cliente | null>(null);
  const [contractNumber, setContractNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'LOGOUT' | 'STOP_ACTIVITY' | null }>({ isOpen: false, type: null });

  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('activeSession', JSON.stringify(activeSession)); }, [activeSession]);
  useEffect(() => { localStorage.setItem('surveyRecords', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('clientes', JSON.stringify(clientes)); }, [clientes]);
  useEffect(() => { localStorage.setItem('vendas', JSON.stringify(vendas)); }, [vendas]);

  const handleSyncData = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRecords(prev => prev.map(r => ({ ...r, isSynced: true })));
    setClientes(prev => prev.map(c => ({ ...c, isSynced: true })));
    setVendas(prev => prev.map(v => ({ ...v, isSynced: true })));
    setIsSyncing(false);
  };

  const pendingSyncCount = useMemo(() => {
    return records.filter(r => !r.isSynced && r.status === 'concluida').length +
           clientes.filter(c => !c.isSynced).length +
           vendas.filter(v => !v.isSynced).length;
  }, [records, clientes, vendas]);

  const handleAuth = (mode: 'LOGIN' | 'SIGNUP', roleInput?: UserRole) => {
    const role: UserRole = mode === 'SIGNUP' ? 'Vendedor' : (roleInput || 'Vendedor');
    const mockUser: User = {
      id: mode === 'SIGNUP' ? Math.random().toString(36).substr(2, 9) : (role === 'Admin' ? 'admin-123' : 'vendedor-456'),
      nome: mode === 'SIGNUP' ? 'Novo Vendedor' : (role === 'Vendedor' ? 'Consultor de Campo' : 'Gestor Administrativo'),
      role: role, status: 'Ativo'
    };
    setCurrentUser(mockUser);
    setView(role === 'Admin' ? 'ADMIN' : 'DASHBOARD');
  };

  const executeLogout = () => {
    setCurrentUser(null); setActiveSession(null); setView('AUTH');
    setConfirmModal({ isOpen: false, type: null }); localStorage.clear();
  };

  const handleStopActivity = () => {
    setActiveSession(null);
    setConfirmModal({ isOpen: false, type: null });
  };

  const startActivity = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setActiveSession({ startTime: new Date().toISOString(), startLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
    });
  };

  const finalizeSurvey = () => {
    if (!isStepValid || !currentUser) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const ts = new Date().toISOString();
      const synced = isOnline;

      const updatedRecords = records.map(r => r.id_pesquisa === currentSurveyId ? { 
        ...r, 
        data: surveyData, 
        status: 'concluida' as const, 
        timestampEnd: ts, 
        locationEnd: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        isSynced: synced
      } : r);
      setRecords(updatedRecords);

      setClientes(prev => {
        const existingIdx = prev.findIndex(c => c.telefone === surveyData.telefone);
        const fullAddress = `${surveyData.bairro}, ${surveyData.cidade}`;
        
        if (existingIdx !== -1) {
            const updatedClientes = [...prev];
            updatedClientes[existingIdx] = {
                ...updatedClientes[existingIdx],
                nome: surveyData.nome,
                bairro: surveyData.bairro,
                cidade: surveyData.cidade,
                endereco: fullAddress,
                pesquisaIds: [...new Set([...updatedClientes[existingIdx].pesquisaIds, currentSurveyId!])],
                isSynced: synced
            };
            return updatedClientes;
        }

        return [{ 
          id: `CLI-${Date.now()}`, 
          nome: surveyData.nome, 
          telefone: surveyData.telefone, 
          bairro: surveyData.bairro, 
          cidade: surveyData.cidade, 
          endereco: fullAddress,
          userId: currentUser.id, 
          userName: currentUser.nome, 
          data_primeiro_contato: ts, 
          status: 'Ativo' as const, 
          pesquisaIds: [currentSurveyId!],
          isSynced: synced 
        }, ...prev];
      });

      setCurrentSurveyId(null); 
      setSurveyData(INITIAL_DATA); 
      setStep(1); 
      setView('DASHBOARD');
    });
  };

  const isStepValid = useMemo(() => {
    switch (step) {
      case 2: return surveyData.nome.trim() !== '' && surveyData.telefone.trim() !== '' && surveyData.bairro.trim() !== '' && surveyData.cidade.trim() !== '';
      case 3: return surveyData.perfilPreferencia !== '';
      case 4: return surveyData.casaTipo !== '' && (surveyData.seguroResidencial !== '' || surveyData.oportunidadeResidencial !== '') && surveyData.temVeiculo !== '' && (surveyData.seguroVeicular !== '' || surveyData.oportunidadeVeicular !== '');
      case 5: return surveyData.planoSaude !== '' && surveyData.seguroVida !== '' && surveyData.planoFunerario !== '';
      case 6: return surveyData.dependentes.length > 0 && surveyData.preparacaoFamilia !== '';
      case 7: return surveyData.custoImprevisto !== '' && surveyData.melhorFormaResolver !== '' && surveyData.importanciaFamilia !== '' && surveyData.interesseConhecer !== '';
      case 8: return surveyData.possoExplicar !== '';
      default: return true;
    }
  }, [step, surveyData]);

  const handleNextStep = () => isStepValid ? setStep(step + 1) : setShowError(true);

  const exportClientsToCSV = () => {
    if (clientes.length === 0) return;
    const headers = ['ID', 'Nome', 'Telefone', 'Bairro', 'Cidade', 'Consultor', 'Data Cadastro', 'Status'];
    const rows = clientes.map(c => [
      c.id, `"${c.nome.replace(/"/g, '""')}"`, c.telefone, `"${c.bairro.replace(/"/g, '""')}"`, `"${c.cidade.replace(/"/g, '""')}"`, `"${c.userName.replace(/"/g, '""')}"`, new Date(c.data_primeiro_contato).toLocaleDateString('pt-BR'), c.status
    ]);
    const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CRM_Clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSalesToCSV = () => {
    if (vendas.length === 0) return;
    const headers = ['ID Venda', 'Nome Cliente', 'Telefone', 'Nº Contrato', 'Consultor', 'Data Fechamento', 'Status Venda'];
    const rows = vendas.map(v => [
      v.id, `"${v.nome_cliente.replace(/"/g, '""')}"`, v.telefone, v.numero_contrato, `"${v.vendedorNome.replace(/"/g, '""')}"`, new Date(v.data_fechamento).toLocaleDateString('pt-BR'), v.status_venda
    ]);
    const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Vendas_Contratos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (record: SurveyRecord) => {
    const doc = new jsPDF();
    const data = record.id_pesquisa === currentSurveyId ? surveyData : record.data;
    const profile = calculateProfile(data);
    const marginX = 15;

    doc.setFillColor(30, 58, 138); 
    doc.rect(0, 0, 210, 48, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('GRUPO ETHERNOS', marginX, 15);
    doc.setFontSize(22);
    doc.text('Relatório de Prevenção Familiar', marginX, 28);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: ${record.id_pesquisa} | Data: ${new Date(record.timestampStart).toLocaleString('pt-BR')}`, marginX, 38);
    
    let currentY = 60;
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Identificação do Cliente', marginX, currentY);
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(219, 234, 254);
    doc.roundedRect(135, 60, 60, 38, 3, 3, 'FD');
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PERFIL CALCULADO:', 140, 70);
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.text(profile.toUpperCase(), 140, 83);

    currentY += 12;
    const locationStr = (data.bairro || data.cidade) ? `${data.bairro}, ${data.cidade}` : '-';
    const identData = [
      { label: 'Nome:', value: data.nome || '-' },
      { label: 'WhatsApp:', value: data.telefone || '-' },
      { label: 'Localização:', value: locationStr },
      { label: 'Consultor:', value: record.userName }
    ];

    identData.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(item.label, marginX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      // CORREÇÃO: Aumentado o recuo de 30 para 45 para comportar o rótulo "Localização:" sem sobreposição
      doc.text(item.value, marginX + 45, currentY);
      currentY += 8;
    });

    currentY += 15;
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Resumo da Pesquisa', marginX, currentY);
    currentY += 10;

    const summaryItems = [
      { q: 'Preferência de Atuação:', a: data.perfilPreferencia },
      { q: 'Tipo de Moradia:', a: data.casaTipo },
      { q: 'Seguro Residencial:', a: data.seguroResidencial || data.oportunidadeResidencial },
      { q: 'Tem Veículo Próprio:', a: data.temVeiculo },
      { q: 'Seguro Veicular:', a: data.seguroVeicular || data.oportunidadeVeicular },
      { q: 'Tem Plano de Saúde:', a: data.planoSaude },
      { q: 'Tem Seguro de Vida:', a: data.seguroVida },
      { q: 'Tem Plano Funerário:', a: data.planoFunerario },
      { q: 'Dependentes:', a: data.dependentes.join(', ') || 'Nenhum' },
      { q: 'Preparação Familiar:', a: data.preparacaoFamilia },
      { q: 'Interesse em Soluções:', a: data.interesseConhecer },
      { q: 'Explicar Plano Assistencial:', a: data.possoExplicar }
    ];

    summaryItems.forEach(it => {
      if (currentY > 265) { doc.addPage(); currentY = 25; }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.text(it.q, marginX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(it.a || '-', marginX + 85, currentY);
      currentY += 8;
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text('Este documento é uma síntese da pesquisa de campo e destina-se ao uso consultivo.', marginX, 285);
      doc.text(`© ${new Date().getFullYear()} GRUPO ETHERNOS | Página ${i} de ${pageCount}`, marginX, 290);
    }
    doc.save(`Relatorio_${(data.nome || 'Pesquisa').replace(/\s+/g, '_')}.pdf`);
  };

  const filteredClientes = useMemo(() => {
    if (!currentUser) return [];
    return clientes.filter(c => (currentUser.role === 'Admin' || c.userId === currentUser.id) && (c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefone.includes(searchTerm)));
  }, [clientes, searchTerm, currentUser]);

  const filteredVendas = useMemo(() => {
    if (!currentUser) return [];
    return vendas.filter(v => (currentUser.role === 'Admin' || v.vendedorId === currentUser.id));
  }, [vendas, currentUser]);

  const filteredRecords = useMemo(() => {
    if (!currentUser) return [];
    return records.filter(r => (currentUser.role === 'Admin' || r.userId === currentUser.id) && (r.data.nome.toLowerCase().includes(searchTerm.toLowerCase()) || r.id_pesquisa.includes(searchTerm)));
  }, [records, searchTerm, currentUser]);

  const toggleDependent = (dep: string) => {
    setSurveyData(prev => {
      if (dep === 'Não') return { ...prev, dependentes: ['Não'] };
      const newDeps = prev.dependentes.includes(dep) ? prev.dependentes.filter(d => d !== dep) : [...prev.dependentes.filter(d => d !== 'Não'), dep];
      return { ...prev, dependentes: newDeps };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
      <div className={`fixed top-0 left-0 right-0 z-[60] flex items-center justify-center p-2 transition-all duration-500 ${isOnline ? 'translate-y-[-100%]' : 'translate-y-0 bg-amber-500'}`}>
        <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5" /> Modo Offline Ativo - Os dados serão salvos localmente
        </p>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        message={confirmModal.type === 'LOGOUT' ? "Confirma que deseja sair do sistema?" : "Tem certeza que deseja encerrar sua atividade/sessão?"} 
        onConfirm={confirmModal.type === 'LOGOUT' ? executeLogout : handleStopActivity} 
        onCancel={() => setConfirmModal({ isOpen: false, type: null })} 
      />

      {view === 'AUTH' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-blue-500/10"><Shield className="w-10 h-10" /></div>
            <div><h1 className="text-3xl font-black text-slate-800">Portal de Acesso</h1><p className="text-slate-400">Grupo Ethernos - Prevenção Familiar</p></div>
            <div className="space-y-4">
              <button onClick={() => handleAuth('LOGIN')} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3"><UserIcon className="w-5 h-5" /> Entrar como Consultor</button>
              <button onClick={() => handleAuth('LOGIN', 'Admin')} className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3"><Lock className="w-5 h-5" /> Administração</button>
            </div>
          </div>
        </div>
      )}

      {view === 'DASHBOARD' && (
        <div className="max-xl mx-auto min-h-screen flex flex-col bg-white sm:bg-slate-50">
          <header className="p-6 bg-white sm:rounded-b-[2rem] border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Shield className="w-7 h-7" /></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Consultor</p><h2 className="text-lg font-black text-slate-800 leading-tight">{currentUser?.nome}</h2></div>
            </div>
            <div className="flex items-center gap-2">
               {pendingSyncCount > 0 && isOnline && (
                 <button onClick={handleSyncData} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center animate-pulse">
                   <CloudUpload className="w-5 h-5" />
                 </button>
               )}
               <button onClick={() => setConfirmModal({isOpen: true, type: 'LOGOUT'})} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center"><LogOut className="w-5 h-5" /></button>
            </div>
          </header>

          <main className="flex-1 p-6 space-y-6">
            <Card className={activeSession ? 'border-green-200 bg-green-50/20' : ''}>
              {!activeSession ? (
                <button onClick={startActivity} className="w-full bg-blue-600 text-white py-6 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-2xl transition-all"><Play className="w-6 h-6 fill-current" /> Iniciar Atividade</button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-green-100 flex justify-between items-center"><span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ativo desde: {new Date(activeSession.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span><div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div></div>
                  <button onClick={() => setConfirmModal({isOpen: true, type: 'STOP_ACTIVITY'})} className="w-full bg-white text-red-600 py-4 rounded-2xl font-black border-2 border-red-100 transition-colors hover:bg-red-50">Encerrar Turno</button>
                </div>
              )}
            </Card>

            <button 
              onClick={() => {
                if (!activeSession) return;
                const id = `SURV-${Date.now()}`.toUpperCase();
                setRecords(prev => [{id_pesquisa: id, userId: currentUser!.id, userName: currentUser!.nome, timestampStart: new Date().toISOString(), data: INITIAL_DATA, status: 'em_andamento', lastStep: 1, locationStart: {lat:0, lng:0}, isSynced: false}, ...prev]);
                setCurrentSurveyId(id); setView('SURVEY'); setStep(1); setSurveyData(INITIAL_DATA);
              }}
              disabled={!activeSession}
              className={`w-full p-8 rounded-[2.5rem] flex items-center justify-between transition-all group ${activeSession ? 'bg-slate-900 text-white shadow-2xl' : 'bg-slate-100 opacity-60 grayscale'}`}
            >
              <div className="flex items-center gap-6">
                <div className={`p-5 rounded-2xl ${activeSession ? 'bg-blue-600' : 'bg-slate-200'}`}><Plus className="w-8 h-8" /></div>
                <div className="text-left"><span className="block text-xl font-black uppercase tracking-tight">Iniciar Pesquisa</span><span className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">GRUPO ETHERNOS</span></div>
              </div>
              <ChevronRight className="w-8 h-8 opacity-20 group-hover:translate-x-1 transition-all" />
            </button>

            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setView('CLIENTS')} className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center justify-between"><div className="flex items-center gap-5"><div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><BookUser className="w-6 h-6" /></div><span className="text-base font-black text-slate-700 uppercase">CRM Carteira</span></div><ChevronRight className="w-6 h-6 text-slate-200" /></button>
              <button onClick={() => setView('SALES')} className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center justify-between"><div className="flex items-center gap-5"><div className="p-4 bg-green-50 text-green-600 rounded-2xl"><Briefcase className="w-6 h-6" /></div><span className="text-base font-black text-slate-700 uppercase">Vendas / Contratos</span></div><ChevronRight className="w-6 h-6 text-slate-200" /></button>
              <button onClick={() => { setSearchTerm(''); setView('HISTORY'); }} className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center justify-between"><div className="flex items-center gap-5"><div className="p-4 bg-slate-50 text-slate-500 rounded-2xl"><History className="w-6 h-6" /></div><span className="text-base font-black text-slate-700 uppercase">Histórico Geral</span></div><ChevronRight className="w-6 h-6 text-slate-200" /></button>
            </div>
          </main>
        </div>
      )}

      {view === 'SURVEY' && (
        <div className="max-w-xl mx-auto min-h-screen bg-white flex flex-col">
          <header className="p-6 border-b border-slate-100 flex items-center gap-4 sticky top-0 bg-white z-40">
            <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
            <div className="flex-1"><h2 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Mapeamento Familiar</h2><ProgressBar currentStep={step} totalSteps={STEPS_COUNT} /></div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 pb-40">
            <div key={step} className="animate-in fade-in slide-in-from-right-8 duration-500">
              {step === 1 && (
                <div className="text-center space-y-10 py-10">
                  <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto"><Smartphone className="w-12 h-12" /></div>
                  <div className="space-y-4 px-6">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">Abordagem Inicial</h3>
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] text-slate-600 italic font-medium leading-relaxed">
                      "Olá! Estamos realizando uma pesquisa rápida sobre hábito de prevenção e segurança familiar. Leva menos de 5 minutos. Posso fazer com você?"
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleNextStep} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black">Sim, aceitou</button>
                    <button onClick={() => { setRecords(prev => prev.filter(r => r.id_pesquisa !== currentSurveyId)); setCurrentSurveyId(null); setView('DASHBOARD'); }} className="w-full bg-slate-100 text-slate-400 py-6 rounded-2xl font-black">Não aceitou</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>Identificação</h3>
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Entrevistado</label>
                      <input autoFocus placeholder="Ex: João Silva" className="w-full p-5 bg-slate-50 rounded-[1.2rem] border-2 font-bold focus:border-blue-600 outline-none" value={surveyData.nome} onChange={e => setSurveyData({...surveyData, nome: e.target.value})} />
                    </div>
                    <PhoneInput label="WhatsApp / Telefone" value={surveyData.telefone} onChange={v => setSurveyData({...surveyData, telefone: v})} required />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bairro</label>
                        <input className="w-full p-5 bg-slate-50 rounded-[1.2rem] border-2 font-bold focus:border-blue-600 outline-none" value={surveyData.bairro} onChange={e => setSurveyData({...surveyData, bairro: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade</label>
                        <input className="w-full p-5 bg-slate-50 rounded-[1.2rem] border-2 font-bold focus:border-blue-600 outline-none" value={surveyData.cidade} onChange={e => setSurveyData({...surveyData, cidade: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>Perfil de Prevenção</h3>
                  <p className="text-slate-600 font-medium">Você se considera uma pessoa que prefere:</p>
                  <div className="space-y-4">
                    {['Se prevenir antes', 'Resolver de última hora', 'Nunca pensou muito sobre isso'].map(opt => (
                      <OptionButton key={opt} label={opt} selected={surveyData.perfilPreferencia === opt} onClick={() => setSurveyData({...surveyData, perfilPreferencia: opt})} />
                    ))}
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 font-medium"><b>Objetivo:</b> Identificar o nível de consciência e abertura do cliente.</p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>Responsabilidade Familiar</h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">A casa que você mora é:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['Própria', 'Alugada'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, casaTipo: opt as any, seguroResidencial: '', oportunidadeResidencial: ''})} className={`py-4 rounded-xl font-bold border-2 ${surveyData.casaTipo === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.casaTipo === 'Própria' && (
                        <SubQuestion question="Tem seguro residencial?" value={surveyData.seguroResidencial} onChange={v => setSurveyData({...surveyData, seguroResidencial: v})} />
                      )}
                      {surveyData.casaTipo === 'Alugada' && (
                        <SubQuestion question="Se fosse própria e tivesse oportunidade, colocaria seguro?" value={surveyData.oportunidadeResidencial} onChange={v => setSurveyData({...surveyData, oportunidadeResidencial: v})} />
                      )}
                    </div>
                    <div className="space-y-3 border-t border-slate-100 pt-6">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem veículo próprio?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['Sim', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, temVeiculo: opt as any, seguroVeicular: '', oportunidadeVeicular: ''})} className={`py-4 rounded-xl font-bold border-2 ${surveyData.temVeiculo === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.temVeiculo === 'Sim' && (
                        <SubQuestion question="Tem seguro (ou teria caso não tenha)?" value={surveyData.seguroVeicular} onChange={v => setSurveyData({...surveyData, seguroVeicular: v})} />
                      )}
                      {surveyData.temVeiculo === 'Não' && (
                        <SubQuestion question="Se tivesse, colocaria no seguro se tivesse oportunidade?" value={surveyData.oportunidadeVeicular} onChange={v => setSurveyData({...surveyData, oportunidadeVeicular: v})} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>Responsabilidade Familiar</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem plano de saúde?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['Sim', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, planoSaude: opt as any, oportunidadeSaude: ''})} className={`py-4 rounded-xl font-bold border-2 ${surveyData.planoSaude === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.planoSaude === 'Não' && (
                        <SubQuestion question="Teria um se tivesse a oportunidade?" value={surveyData.oportunidadeSaude} onChange={v => setSurveyData({...surveyData, oportunidadeSaude: v})} />
                      )}
                    </div>
                    <div className="space-y-2 border-t border-slate-100 pt-6">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem seguro de vida?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['Sim', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, seguroVida: opt as any, oportunidadeVida: ''})} className={`py-4 rounded-xl font-bold border-2 ${surveyData.seguroVida === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.seguroVida === 'Não' && (
                        <SubQuestion question="Teria um se tivesse a oportunidade?" value={surveyData.oportunidadeVida} onChange={v => setSurveyData({...surveyData, oportunidadeVida: v})} />
                      )}
                    </div>
                    <div className="space-y-2 border-t border-slate-100 pt-6">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tem plano funerário?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['Sim', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, planoFunerario: opt as any, oportunidadeFunerario: ''})} className={`py-4 rounded-xl font-bold border-2 ${surveyData.planoFunerario === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                      {surveyData.planoFunerario === 'Não' && (
                        <SubQuestion question="Teria um se tivesse a oportunidade?" value={surveyData.oportunidadeFunerario} onChange={v => setSurveyData({...surveyData, oportunidadeFunerario: v})} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>Responsabilidade Familiar</h3>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Hoje, alguém depende de você financeiramente?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['Não', 'Cônjuge', 'Filhos', 'Pais', 'Sogros', 'Outros'].map(dep => (
                          <CheckboxOption key={dep} label={dep} selected={surveyData.dependentes.includes(dep)} onClick={() => toggleDependent(dep)} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4 border-t border-slate-100 pt-6">
                      <p className="text-slate-600 font-medium">Se hoje acontecesse uma situação inesperada, você acredita que sua família estaria:</p>
                      <div className="space-y-3">
                        {['Preparada', 'Parcialmente preparada', 'Nada preparada'].map(opt => (
                          <OptionButton key={opt} label={opt} selected={surveyData.preparacaoFamilia === opt} onClick={() => setSurveyData({...surveyData, preparacaoFamilia: opt})} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>Imprevistos e Organização</h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-slate-600 font-medium">Resolver um imprevisto urgente sem planejamento pode custar muito caro. Qual sua percepção?</p>
                      <div className="space-y-3">
                        {['Já sei', 'Tenho uma ideia', 'Nunca pensou nisso'].map(opt => (
                          <OptionButton key={opt} label={opt} selected={surveyData.custoImprevisto === opt} onClick={() => setSurveyData({...surveyData, custoImprevisto: opt})} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3 border-t border-slate-100 pt-6">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Em momentos difíceis, o que é melhor?</p>
                      <div className="space-y-3">
                        {['Pagar tudo de uma vez', 'Ter tudo organizado antes', 'Contar com ajuda de terceiros'].map(opt => (
                          <OptionButton key={opt} label={opt} selected={surveyData.melhorFormaResolver === opt} onClick={() => setSurveyData({...surveyData, melhorFormaResolver: opt})} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4 border-t border-slate-100 pt-6">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">O que você considera mais importante para a família?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['Tranquilidade', 'Organização', 'Apoio', 'Todas as opções'].map(opt => (
                          <OptionButton key={opt} label={opt} selected={surveyData.importanciaFamilia === opt} onClick={() => setSurveyData({...surveyData, importanciaFamilia: opt})} />
                        ))}
                      </div>
                    </div>
                    <div className="pt-6">
                      <p className="bg-blue-600 text-white p-6 rounded-[2rem] text-sm font-black italic shadow-xl">
                        "Se existisse uma forma simples e acessível de evitar preocupação financeira e burocracia, você teria interesse em conhecer?"
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {['Sim', 'Talvez', 'Não'].map(opt => (
                          <button key={opt} onClick={() => setSurveyData({...surveyData, interesseConhecer: opt})} className={`py-4 rounded-xl font-bold border-2 transition-all ${surveyData.interesseConhecer === opt ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-50 text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 8 && (
                <div className="space-y-8">
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <Shield className="w-8 h-8 text-blue-400" />
                      <h4 className="text-sm font-black uppercase tracking-widest">Estratégia de Transição</h4>
                    </div>
                    <div className="space-y-4 text-xs font-medium text-white/70 leading-relaxed italic">
                      <p>• Seguro residencial não é convite para incêndio, é prevenção!</p>
                      <p>• Seguro veicular não é convite para acidente, é prevenção!</p>
                      <p>• Seguro de vida não é convite para usar, é prever a família!</p>
                      <p>• Plano de saúde não é convite para doença, é prevenção!</p>
                      <p>• Plano funerário não é convite para morte, é segurança!</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 border-2 border-indigo-200 p-6 rounded-3xl space-y-4">
                    <p className="text-sm font-black text-indigo-900 uppercase tracking-tight">O nosso plano preventivo contempla:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-xs font-bold text-indigo-700"><CheckCircle2 className="w-4 h-4" /> Descontos em consultas particulares</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-indigo-700"><CheckCircle2 className="w-4 h-4" /> Descontos em lojas parceiras</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-indigo-700"><CheckCircle2 className="w-4 h-4" /> Empréstimos de equipamentos hospitalares</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-indigo-700"><CheckCircle2 className="w-4 h-4" /> Plano preventivo funerário</li>
                    </ul>
                  </div>
                  <div className="bg-white border-4 border-blue-600 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                    <p className="text-xl font-black text-slate-800 text-center leading-tight">Posso te explicar rapidamente como funciona?</p>
                    <div className="grid grid-cols-2 gap-4">
                      {['Sim', 'Não'].map(opt => (
                        <button key={opt} onClick={() => setSurveyData({...surveyData, possoExplicar: opt})} className={`py-6 rounded-2xl font-black transition-all ${surveyData.possoExplicar === opt ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 9 && (
                <div className="space-y-8 py-10 text-center animate-in zoom-in-95">
                  <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-green-600"><CheckCircle2 className="w-14 h-14" /></div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800">Mapeamento Finalizado!</h3>
                    <p className="text-slate-500 font-medium mt-2">Perfil estratégico gerado com sucesso.</p>
                  </div>
                  <Card className="bg-slate-50 text-left border-none shadow-inner">
                    <div className="bg-blue-600 px-6 py-2 rounded-t-3xl"><span className="text-[10px] font-black text-white uppercase tracking-widest">Resultado do Perfil</span></div>
                    <div className="p-6 space-y-3">
                      <p className="text-xs font-black text-slate-400 uppercase">Classificação:</p>
                      <p className="text-2xl font-black text-blue-600">{calculateProfile(surveyData).toUpperCase()}</p>
                    </div>
                  </Card>
                  <div className="space-y-4 pt-4">
                    <button 
                      onClick={() => { 
                        const rec = records.find(r => r.id_pesquisa === currentSurveyId); 
                        if (rec) exportToPDF(rec); 
                      }} 
                      className="w-full bg-white text-blue-600 border-2 border-blue-600 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3"
                    >
                      <FileText className="w-5 h-5" /> Baixar PDF Consultivo
                    </button>
                    <button onClick={finalizeSurvey} className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black shadow-2xl">Finalizar e Sincronizar</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <footer className="p-6 bg-white border-t border-slate-100 flex flex-col gap-4 sticky bottom-0 z-50">
            {showError && !isStepValid && (<div className="bg-red-50 p-4 rounded-xl text-red-600 text-[10px] font-black uppercase flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4" /> Responda todas as perguntas obrigatórias do bloco.</div>)}
            
            {step < 9 && (
                <div className="flex items-center gap-4">
                    {step > 1 && (<button onClick={() => setStep(step - 1)} className="w-14 h-14 bg-slate-50 text-slate-400 flex items-center justify-center rounded-2xl"><ChevronLeft className="w-6 h-6" /></button>)}
                    <button onClick={handleNextStep} className={`flex-1 py-5 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-3 ${isStepValid ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                        {step === 8 ? 'Ver Resultado' : 'Continuar'} <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
          </footer>
        </div>
      )}

      {view === 'HISTORY' && (
        <div className="max-w-xl mx-auto min-h-screen bg-slate-50 flex flex-col">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-40">
            <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2"><History className="w-5 h-5 text-slate-500" /> Histórico Geral</h2>
          </header>
          <main className="flex-1 p-6 space-y-6">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou ID..." 
                className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white border border-slate-100 font-bold focus:border-blue-500 outline-none shadow-sm" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold">Nenhum registro encontrado.</div>
              ) : (
                filteredRecords.map(rec => (
                  <div key={rec.id_pesquisa} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-black text-slate-800 text-lg leading-tight">{rec.data.nome || 'Pesquisa s/ Nome'}</h4>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-400 font-bold">{new Date(rec.timestampStart).toLocaleDateString('pt-BR')} às {new Date(rec.timestampStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="text-[10px] text-blue-600 font-black uppercase">ID: {rec.id_pesquisa}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${rec.status === 'concluida' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {rec.status === 'concluida' ? 'Concluída' : 'Incompleta'}
                      </span>
                      {rec.status === 'concluida' && (
                        <button onClick={() => exportToPDF(rec)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      )}

      {view === 'SALES' && (
        <div className="max-w-xl mx-auto min-h-screen bg-slate-50 flex flex-col">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
              <h2 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2"><Briefcase className="w-5 h-5 text-green-600" /> Contratos</h2>
            </div>
            <button onClick={() => setView('NEW_SALE')} className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-lg"><Plus className="w-6 h-6" /></button>
          </header>
          <main className="flex-1 p-6 space-y-4">
            {filteredVendas.length === 0 ? (<div className="text-center py-20 text-slate-400 font-bold">Nenhuma venda registrada.</div>) : (
              filteredVendas.map(v => (
                <Card key={v.id} className="border-l-8 border-l-green-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-800 text-lg">{v.nome_cliente}</h4>
                      <p className="text-xs font-black text-blue-600 uppercase mt-1">Contrato: #{v.numero_contrato}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-lg uppercase">Ativo</span>
                      {!v.isSynced && <div className="text-[8px] font-black text-amber-600 uppercase flex items-center gap-1"><CloudUpload className="w-2.5 h-2.5" /> Aguardando Sinc.</div>}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </main>
        </div>
      )}

      {view === 'CLIENTS' && (
        <div className="max-w-xl mx-auto min-h-screen bg-slate-50 flex flex-col">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <button onClick={() => { setView('DASHBOARD'); setSelectedCliente(null); }} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2"><BookUser className="w-5 h-5 text-blue-600" /> CRM Carteira</h2>
            </div>
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isFilterOpen ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}><Filter className="w-5 h-5" /></button>
          </header>
          <main className="flex-1 p-6 space-y-6">
            {!selectedCliente ? (
              <>
                <div className="relative group"><Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /><input type="text" placeholder="Nome ou telefone..." className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white border border-slate-100 font-bold focus:border-blue-500 outline-none shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <div className="space-y-4">
                  {filteredClientes.map(cliente => (
                    <button key={cliente.id} onClick={() => setSelectedCliente(cliente)} className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all">
                      <div className="text-left space-y-1">
                        <h4 className="font-black text-slate-800 text-lg leading-tight">{cliente.nome}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 font-bold">{cliente.telefone}</span>
                          {!cliente.isSynced && <span className="text-[8px] font-black text-amber-600 uppercase flex items-center gap-1"><CloudUpload className="w-2.5 h-2.5" /> Pendente</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-200" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <Card className="border-t-8 border-t-blue-600">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-black text-slate-800 leading-tight">{selectedCliente.nome}</h3>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedCliente.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{selectedCliente.status}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 pb-6 border-b border-slate-100">
                    <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Completo</p><p className="text-sm font-bold">{selectedCliente.endereco || `${selectedCliente.bairro}, ${selectedCliente.cidade}`}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</p><p className="text-sm font-bold">{selectedCliente.telefone}</p></div>
                      <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizado</p><p className="text-sm font-bold flex items-center gap-2">{selectedCliente.isSynced ? <Cloud className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-amber-500" />}{selectedCliente.isSynced ? 'Sim' : 'Local'}</p></div>
                    </div>
                  </div>
                  <div className="pt-6 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" /> Histórico de Pesquisas
                    </h4>
                    <div className="space-y-3">
                      {records.filter(r => selectedCliente.pesquisaIds.includes(r.id_pesquisa)).length > 0 ? (
                        records.filter(r => selectedCliente.pesquisaIds.includes(r.id_pesquisa)).map(survey => (
                          <div key={survey.id_pesquisa} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-700">{new Date(survey.timestampStart).toLocaleDateString('pt-BR')}</p>
                              <p className="text-[10px] font-black text-blue-600 uppercase">ID: {survey.id_pesquisa}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${survey.status === 'concluida' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {survey.status === 'concluida' ? 'Concluída' : 'Em andamento'}
                              </span>
                              {survey.status === 'concluida' && (
                                <button onClick={() => exportToPDF(survey)} title="Baixar PDF" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">Nenhuma pesquisa associada encontrada.</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => { setSaleClient(selectedCliente); setView('NEW_SALE'); }} className="mt-8 w-full bg-green-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 transition-all"><Plus className="w-5 h-5" /> Registrar Venda</button>
                </Card>
                <button onClick={() => setSelectedCliente(null)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black">Voltar para Lista</button>
              </div>
            )}
          </main>
        </div>
      )}

      {view === 'NEW_SALE' && (
        <div className="max-w-xl mx-auto min-h-screen bg-slate-50 flex flex-col">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-40">
            <button onClick={() => setView('SALES')} className="w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-lg font-black text-slate-800 uppercase">Registrar Venda</h2>
          </header>
          <main className="flex-1 p-6 space-y-8">
            {!saleClient ? (
              <div className="space-y-6">
                <input type="text" placeholder="Buscar cliente..." className="w-full p-5 rounded-3xl bg-white border border-slate-100 font-bold outline-none shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <div className="space-y-3">
                  {filteredClientes.slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => setSaleClient(c)} className="w-full bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="text-left"><p className="font-black text-slate-800">{c.nome}</p><p className="text-xs text-slate-400 font-bold">{c.telefone}</p></div>
                      <ChevronRight className="w-5 h-5 text-slate-200" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Card className="bg-blue-600 text-white border-none">
                  <div className="flex justify-between items-start"><div><p className="text-[10px] font-black opacity-60 uppercase">Cliente Selecionado</p><h3 className="text-xl font-black">{saleClient.nome}</h3></div><button onClick={() => setSaleClient(null)} className="p-2 bg-blue-500 rounded-lg"><X className="w-4 h-4" /></button></div>
                </Card>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Número do Contrato (5 dígitos)</label>
                  <input type="text" maxLength={5} placeholder="00000" className="w-full p-5 rounded-2xl bg-white border-2 font-black text-2xl tracking-[0.5em] outline-none focus:border-blue-600" value={contractNumber} onChange={e => setContractNumber(e.target.value.replace(/\D/g, ''))} />
                </div>
                <button onClick={() => {
                  const synced = isOnline;
                  const newV: Venda = { 
                    id: `S-${Date.now()}`, clienteId: saleClient.id, nome_cliente: saleClient.nome, telefone: saleClient.telefone, endereco: saleClient.endereco || `${saleClient.bairro}, ${saleClient.cidade}`, numero_contrato: contractNumber, vendedorId: currentUser!.id, vendedorNome: currentUser!.nome, data_fechamento: new Date().toISOString(), status_venda: 'Ativo', origem_pesquisaId: saleClient.pesquisaIds[0], criado_em: new Date().toISOString(), isSynced: synced
                  };
                  setVendas([newV, ...vendas]); 
                  setView('SALES'); setSaleClient(null); setContractNumber('');
                }} disabled={contractNumber.length !== 5} className={`w-full py-6 rounded-2xl font-black text-white ${contractNumber.length === 5 ? 'bg-green-600 shadow-xl' : 'bg-slate-300'}`}>Salvar Venda</button>
              </div>
            )}
          </main>
        </div>
      )}

      {view === 'ADMIN' && (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Shield className="w-6 h-6 text-blue-600" /> Painel de Gestão</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={exportClientsToCSV} title="Exportar base CRM para Excel (CSV)" className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-all">
                  <Download className="w-3.5 h-3.5" /> CRM (CSV)
                </button>
                <button onClick={exportSalesToCSV} title="Exportar base de Vendas para Excel (CSV)" className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-green-50 hover:text-green-600 transition-all">
                  <Briefcase className="w-3.5 h-3.5" /> Vendas (CSV)
                </button>
                <button onClick={handleSyncData} disabled={!isOnline || isSyncing} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${isSyncing ? 'bg-blue-100 text-blue-400' : isOnline && pendingSyncCount > 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                  {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                  Sincronizar {pendingSyncCount > 0 ? `(${pendingSyncCount})` : ''}
                </button>
              </div>
            </div>
            <button onClick={() => setConfirmModal({isOpen: true, type: 'LOGOUT'})} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center"><LogOut className="w-5 h-5" /></button>
          </header>
          <main className="max-w-6xl mx-auto w-full p-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[ { l: 'Pesquisas', v: records.length, i: History, c: 'text-blue-600', b: 'bg-blue-50' }, { l: 'Carteira CRM', v: clientes.length, i: BookUser, c: 'text-indigo-600', b: 'bg-indigo-50' }, { l: 'Contratos', v: vendas.length, i: Briefcase, c: 'text-green-600', b: 'bg-green-50' }, { l: 'Interessados', v: records.filter(r => r.data.possoExplicar === 'Sim').length, i: Users, c: 'text-amber-600', b: 'bg-amber-50' }].map((s, idx) => (
                <Card key={idx} className="flex items-center gap-6 border-none shadow-xl">
                  <div className={`p-4 rounded-3xl ${s.b} ${s.c}`}><s.i className="w-8 h-8" /></div>
                  <div><p className="text-3xl font-black text-slate-800 leading-none">{s.v}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{s.l}</p></div>
                </Card>
              ))}
            </div>
            <Card className="border-none shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-black text-slate-800 flex items-center gap-3"><MapIconLucide className="w-6 h-6 text-blue-600" /> Cobertura Geográfica</h4>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${isOnline ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />} {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
              <AdminMap records={records} />
            </Card>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
