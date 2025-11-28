import { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, Clock, Plus, X, Save, Trash2, 
  ChevronDown, BookOpen, Timer, 
  PlayCircle, History, LayoutDashboard, CalendarDays, 
  Calculator, Flame, CheckCircle2
} from 'lucide-react';

// --- 1. CONFIGURAÇÕES E SONS ---
const SOM_BIP_URL = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

// --- 2. TIPOS ---
type Nivel = 'Iniciante' | 'Intermediário' | 'Avançado' | 'Cardio' | 'Aquecimento';
type Aba = 'home' | 'treinos' | 'ferramentas' | 'historico';

interface Exercicio {
  id: number;
  nome: string;
  grupo: string; 
  series: number;
  repeticoes: string;
  cargaAlvo: string;
  descanso: string; // segundos
  instrucoes: string; 
  dica: string; 
}

interface FichaTreino {
  id: number;
  titulo: string;
  descricao: string;
  nivel: Nivel;
  duracaoMin: number;
  exercicios: Exercicio[];
  imagemCapa: string;
}

interface RegistroHistorico {
  id: number;
  treinoNome: string;
  data: string;
  duracaoReal: number;
}

// --- 3. BANCO DE DADOS MASSIVO (TREINOS REAIS) ---
const dadosIniciais: FichaTreino[] = [
  // === AQUECIMENTO ===
  {
    id: 1, titulo: "Mobilidade Superior (Pré-Treino)", descricao: "Essencial antes de treinos de Peito/Costas/Ombro para soltar as articulações.", nivel: 'Aquecimento', duracaoMin: 10,
    imagemCapa: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Rotação de Ombros (Bastão)", grupo: "Ombros", series: 2, repeticoes: "15", cargaAlvo: "Bastão PVC", descanso: "0", instrucoes: "Segure o bastão com pegada larga e passe por trás da cabeça até o glúteo e volte.", dica: "Mantenha os cotovelos estendidos." },
      { id: 2, nome: "YTWL no Banco", grupo: "Escápulas", series: 2, repeticoes: "10", cargaAlvo: "Sem peso", descanso: "30", instrucoes: "Deitado de bruços, faça movimentos formando as letras Y, T, W e L com os braços.", dica: "Foque em esmagar o meio das costas." }
    ]
  },
  {
    id: 2, titulo: "Mobilidade Inferior (Liberar Quadril)", descricao: "Destrave seu agachamento com essa rotina rápida.", nivel: 'Aquecimento', duracaoMin: 12,
    imagemCapa: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Agachamento Profundo Isométrico", grupo: "Quadril", series: 2, repeticoes: "30 seg", cargaAlvo: "Corporal", descanso: "30", instrucoes: "Agache tudo que puder e segure lá embaixo, empurrando os joelhos para fora com os cotovelos.", dica: "Mantenha o calcanhar no chão." },
      { id: 2, nome: "World's Greatest Stretch", grupo: "Global", series: 2, repeticoes: "8/lado", cargaAlvo: "Corporal", descanso: "30", instrucoes: "Posição de avanço, coloque a mão oposta no chão e gire o tronco olhando para o teto.", dica: "Sinta alongar o flexor do quadril." }
    ]
  },

  // === CARDIO ===
  {
    id: 10, titulo: "HIIT Esteira (Queima Gordura)", descricao: "Alta intensidade intervalada. Acelera o metabolismo por 48h.", nivel: 'Cardio', duracaoMin: 20,
    imagemCapa: "https://images.unsplash.com/photo-1534258936925-c48947387603?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Tiro de Velocidade", grupo: "Cardio", series: 10, repeticoes: "30 seg", cargaAlvo: "Velocidade Max", descanso: "30", instrucoes: "Corra na máxima velocidade possível por 30 segundos.", dica: "Cuidado ao subir na esteira em movimento." },
      { id: 2, nome: "Descanso Ativo (Caminhada)", grupo: "Cardio", series: 10, repeticoes: "30 seg", cargaAlvo: "Leve", descanso: "0", instrucoes: "Ande devagar para recuperar o fôlego.", dica: "Respire fundo." }
    ]
  },
  {
    id: 11, titulo: "Cardio LISS (Pós-Treino)", descricao: "Baixa intensidade para queima de gordura sem catabolizar.", nivel: 'Cardio', duracaoMin: 30,
    imagemCapa: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Caminhada Inclinada", grupo: "Cardio", series: 1, repeticoes: "30 min", cargaAlvo: "Inclinação 12", descanso: "0", instrucoes: "Velocidade 4-5km/h com inclinação alta.", dica: "Não segure no apoio da esteira, balance os braços." }
    ]
  },

  // === INICIANTE ===
  {
    id: 100, titulo: "Adaptação A (Superior)", descricao: "Foco em aprender os movimentos de empurrar e puxar.", nivel: 'Iniciante', duracaoMin: 45,
    imagemCapa: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Supino Reto Máquina", grupo: "Peito", series: 3, repeticoes: "15", cargaAlvo: "Moderada", descanso: "60", instrucoes: "Empurre controlando a volta.", dica: "Mantenha ombros baixos." },
      { id: 2, nome: "Puxada Frontal", grupo: "Costas", series: 3, repeticoes: "15", cargaAlvo: "Moderada", descanso: "60", instrucoes: "Puxe a barra até o peito.", dica: "Cotovelos para baixo." },
      { id: 3, nome: "Desenvolvimento Máquina", grupo: "Ombros", series: 3, repeticoes: "12", cargaAlvo: "Leve", descanso: "60", instrucoes: "Empurre para cima da cabeça.", dica: "Não arqueie a coluna." },
      { id: 4, nome: "Rosca Direta Halteres", grupo: "Bíceps", series: 3, repeticoes: "15", cargaAlvo: "Leve", descanso: "45", instrucoes: "Suba girando o punho.", dica: "Cotovelo colado no corpo." }
    ]
  },
  {
    id: 101, titulo: "Adaptação B (Inferior)", descricao: "Fortalecimento de pernas e core.", nivel: 'Iniciante', duracaoMin: 45,
    imagemCapa: "https://images.unsplash.com/photo-1574680096141-1cddd32e0343?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Leg Press Horizontal", grupo: "Pernas", series: 3, repeticoes: "15", cargaAlvo: "Moderada", descanso: "60", instrucoes: "Empurre a plataforma.", dica: "Não estique totalmente o joelho." },
      { id: 2, nome: "Cadeira Extensora", grupo: "Quadríceps", series: 3, repeticoes: "15", cargaAlvo: "Moderada", descanso: "60", instrucoes: "Chute para cima e segure 1s.", dica: "Contraia a coxa no topo." },
      { id: 3, nome: "Mesa Flexora", grupo: "Posterior", series: 3, repeticoes: "15", cargaAlvo: "Moderada", descanso: "60", instrucoes: "Puxe o calcanhar no glúteo.", dica: "Não levante o quadril do banco." },
      { id: 4, nome: "Prancha Abdominal", grupo: "Core", series: 3, repeticoes: "30s", cargaAlvo: "Isometria", descanso: "45", instrucoes: "Segure o corpo reto.", dica: "Contraia o abdômen." }
    ]
  },

  // === INTERMEDIÁRIO ===
  {
    id: 200, titulo: "Push (Empurrar)", descricao: "Peito, Ombros e Tríceps com foco em hipertrofia.", nivel: 'Intermediário', duracaoMin: 60,
    imagemCapa: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Supino Inclinado Halteres", grupo: "Peito", series: 4, repeticoes: "8-10", cargaAlvo: "Alta", descanso: "90", instrucoes: "Banco 30 graus.", dica: "Alongue bem na descida." },
      { id: 2, nome: "Crucifixo Máquina", grupo: "Peito", series: 3, repeticoes: "12", cargaAlvo: "Mod", descanso: "60", instrucoes: "Feche os braços na frente.", dica: "Cotovelos levemente flexionados." },
      { id: 3, nome: "Elevação Lateral", grupo: "Ombros", series: 4, repeticoes: "15", cargaAlvo: "Mod", descanso: "45", instrucoes: "Levante até a linha do ombro.", dica: "Dedinho para cima." },
      { id: 4, nome: "Tríceps Polia", grupo: "Tríceps", series: 4, repeticoes: "12", cargaAlvo: "Alta", descanso: "60", instrucoes: "Estenda o cotovelo.", dica: "Ombros imóveis." }
    ]
  },
  {
    id: 201, titulo: "Pull (Puxar)", descricao: "Costas, Trapézio e Bíceps para largura e densidade.", nivel: 'Intermediário', duracaoMin: 60,
    imagemCapa: "https://images.unsplash.com/photo-1603287681836-e174ce71808e?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Puxada Alta", grupo: "Costas", series: 4, repeticoes: "10", cargaAlvo: "Alta", descanso: "90", instrucoes: "Puxe na frente do rosto.", dica: "Jogue os cotovelos nas costelas." },
      { id: 2, nome: "Remada Curvada", grupo: "Costas", series: 3, repeticoes: "10", cargaAlvo: "Alta", descanso: "90", instrucoes: "Tronco inclinado, puxe a barra no umbigo.", dica: "Coluna reta sempre." },
      { id: 3, nome: "Rosca Scott", grupo: "Bíceps", series: 3, repeticoes: "12", cargaAlvo: "Mod", descanso: "60", instrucoes: "Barra W, apoio axilar.", dica: "Alongue tudo na descida." }
    ]
  },

  // === AVANÇADO ===
  {
    id: 300, titulo: "Leg Day (Quadríceps Focus)", descricao: "Volume alto para pernas gigantes.", nivel: 'Avançado', duracaoMin: 80,
    imagemCapa: "https://images.unsplash.com/photo-1434608519344-49d77a699ded?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Agachamento Livre", grupo: "Pernas", series: 5, repeticoes: "6-8", cargaAlvo: "85% 1RM", descanso: "180", instrucoes: "Quebre a paralela.", dica: "Respiração Bracing." },
      { id: 2, nome: "Leg Press 45 (Pés Baixos)", grupo: "Quad", series: 4, repeticoes: "12", cargaAlvo: "Falha", descanso: "90", instrucoes: "Pés na parte inferior da plataforma.", dica: "Amplitude máxima." },
      { id: 3, nome: "Cadeira Extensora (Drop-set)", grupo: "Quad", series: 3, repeticoes: "15+15", cargaAlvo: "Mod", descanso: "60", instrucoes: "Faça até a falha, reduza peso, repita.", dica: "Segure 1s no topo." },
      { id: 4, nome: "Panturrilha em Pé", grupo: "Pantu", series: 5, repeticoes: "15", cargaAlvo: "Alta", descanso: "45", instrucoes: "Suba tudo, desça tudo.", dica: "Pausa no fundo." }
    ]
  },
  {
    id: 301, titulo: "Old School Arms (Arnold)", descricao: "Super-séries de Bíceps e Tríceps para pump máximo.", nivel: 'Avançado', duracaoMin: 50,
    imagemCapa: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Rosca Direta + Tríceps Testa", grupo: "Braços", series: 4, repeticoes: "10+10", cargaAlvo: "Alta", descanso: "60", instrucoes: "Faça um exercício e imediatamente o outro.", dica: "Sem descanso entre os dois." },
      { id: 2, nome: "Rosca Martelo + Tríceps Corda", grupo: "Braços", series: 4, repeticoes: "12+12", cargaAlvo: "Mod", descanso: "60", instrucoes: "Foco na porção lateral.", dica: "Esmague no final." }
    ]
  }
];

function App() {
  // --- ESTADOS GERAIS ---
  const [abaAtiva, setAbaAtiva] = useState<Aba>('home');
  const [treinos, setTreinos] = useState<FichaTreino[]>(dadosIniciais);
  const [filtroNivel, setFiltroNivel] = useState<Nivel | 'Todos'>('Todos');
  const [fichaSelecionada, setFichaSelecionada] = useState<FichaTreino | null>(null);
  
  // --- PERSISTÊNCIA & GAMIFICATION ---
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [logCargas, setLogCargas] = useState<Record<number, string>>({});
  const [streak, setStreak] = useState(0);

  // --- TIMER ---
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [tempoTotalTimer, setTempoTotalTimer] = useState(60);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- FORMULÁRIO DE EXERCÍCIO (DENTRO DO MODAL) ---
  const [novoExercicio, setNovoExercicio] = useState({ 
    nome: '', grupo: '', series: 3, repeticoes: '', cargaAlvo: '', descanso: '60', instrucoes: '', dica: '' 
  });
  
  // --- FORMULÁRIO DE NOVA FICHA ---
  const [modalNovoTreinoAberto, setModalNovoTreinoAberto] = useState(false);
  const [novoTreino, setNovoTreino] = useState<Partial<FichaTreino>>({
    titulo: '', descricao: '', nivel: 'Iniciante', duracaoMin: 60,
    imagemCapa: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600'
  });

  // --- CALCULADORA ---
  const [calcPeso, setCalcPeso] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const [resultado1RM, setResultado1RM] = useState<number | null>(null);

  // --- INIT ---
  useEffect(() => {
    const logs = localStorage.getItem('gymtech_logs');
    const hist = localStorage.getItem('gymtech_history');
    const strk = localStorage.getItem('gymtech_streak');
    
    if (logs) setLogCargas(JSON.parse(logs));
    if (hist) setHistorico(JSON.parse(hist));
    if (strk) setStreak(Number(strk));

    audioRef.current = new Audio(SOM_BIP_URL); 
  }, []);

  // --- TIMER LOOP ---
  useEffect(() => {
    let intervalo: any;
    if (timerAtivo && tempoRestante > 0) {
      intervalo = setInterval(() => setTempoRestante((p) => p - 1), 1000);
    } else if (tempoRestante === 0 && timerAtivo) {
      setTimerAtivo(false);
      audioRef.current?.play().catch(e => console.log("Audio block", e));
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    return () => clearInterval(intervalo);
  }, [timerAtivo, tempoRestante]);

  // --- AÇÕES ---
  const iniciarDescanso = (segundos: number) => {
    setTempoTotalTimer(segundos);
    setTempoRestante(segundos);
    setTimerAtivo(true);
  };

  const atualizarCarga = (id: number, valor: string) => {
    const novo = { ...logCargas, [id]: valor };
    setLogCargas(novo);
    localStorage.setItem('gymtech_logs', JSON.stringify(novo));
  };

  const finalizarTreino = () => {
    if (!fichaSelecionada) return;
    const novoRegistro: RegistroHistorico = {
      id: Date.now(),
      treinoNome: fichaSelecionada.titulo,
      data: new Date().toISOString(),
      duracaoReal: fichaSelecionada.duracaoMin
    };
    
    const novoHistorico = [novoRegistro, ...historico];
    setHistorico(novoHistorico);
    localStorage.setItem('gymtech_history', JSON.stringify(novoHistorico));
    
    const ultimoTreino = historico[0];
    const hoje = new Date().toDateString();
    if (!ultimoTreino || new Date(ultimoTreino.data).toDateString() !== hoje) {
       const novoStreak = streak + 1;
       setStreak(novoStreak);
       localStorage.setItem('gymtech_streak', String(novoStreak));
    }

    setFichaSelecionada(null);
    setAbaAtiva('historico');
    setTimeout(() => alert(`TREINO CONCLUÍDO! 🔥\nOfensiva: ${streak + 1} dias!`), 100);
  };

  // --- CRUD FICHA/EXERCICIO ---
  const salvarNovoTreino = (e: React.FormEvent) => {
    e.preventDefault();
    const novoId = treinos.length > 0 ? Math.max(...treinos.map(t => t.id)) + 1 : 1;
    setTreinos([{ ...novoTreino, id: novoId, nivel: novoTreino.nivel as Nivel, exercicios: [] } as FichaTreino, ...treinos]);
    setModalNovoTreinoAberto(false);
  };

  const adicionarExercicio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fichaSelecionada) return;
    
    const item: Exercicio = { 
      id: Date.now(), 
      ...novoExercicio, 
      series: Number(novoExercicio.series),
      instrucoes: novoExercicio.instrucoes || 'Execute com controle.', 
      dica: novoExercicio.dica || 'Foco na técnica.' 
    };

    const novosTreinos = treinos.map(t => t.id === fichaSelecionada.id ? { ...t, exercicios: [...t.exercicios, item] } : t);
    setTreinos(novosTreinos);
    setFichaSelecionada(novosTreinos.find(t => t.id === fichaSelecionada.id) || null);
    
    // Limpar form
    setNovoExercicio({ nome: '', grupo: '', series: 3, repeticoes: '', cargaAlvo: '', descanso: '60', instrucoes: '', dica: '' });
  };

  const removerExercicio = (idEx: number) => {
    if (!fichaSelecionada) return;
    const novosTreinos = treinos.map(t => t.id === fichaSelecionada.id ? { ...t, exercicios: t.exercicios.filter(ex => ex.id !== idEx) } : t);
    setTreinos(novosTreinos);
    setFichaSelecionada(novosTreinos.find(t => t.id === fichaSelecionada.id) || null);
  };

  // --- HELPERS ---
  const calcular1RM = () => {
    const peso = parseFloat(calcPeso);
    const reps = parseFloat(calcReps);
    if (peso && reps) setResultado1RM(Math.round(peso * (1 + reps / 30)));
  };

  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const treinosEstaSemana = diasDaSemana.map((dia, index) => {
    const hoje = new Date();
    const diaAtual = hoje.getDay();
    const treinouHoje = historico.some(h => new Date(h.data).getDay() === index && 
      Math.abs(new Date(h.data).getTime() - new Date().getTime()) < 604800000 // Filtro básico de 7 dias
    );
    return { dia, ativo: treinouHoje, isToday: index === diaAtual };
  });

  const treinosFiltrados = treinos.filter(treino => filtroNivel === 'Todos' ? true : treino.nivel === filtroNivel);

  // --- RENDERS ---

  const RenderDashboard = () => (
    <div className="space-y-6 animate-in fade-in">
      {/* Card Streak */}
      <div className="bg-gradient-to-r from-red-600 to-red-900 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
        <div className="relative z-10">
           <h2 className="text-3xl font-black italic mb-1">BEM VINDO, MONSTRO</h2>
           <p className="text-red-200 mb-6 font-medium">Sua consistência é seu superpoder.</p>
           <div className="flex gap-8">
              <div>
                <p className="text-xs uppercase font-bold text-red-300">Ofensiva</p>
                <p className="text-4xl font-black flex items-center gap-2"><Flame className="fill-orange-500 text-orange-500"/> {streak}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-red-300">Batalhas Vencidas</p>
                <p className="text-4xl font-black">{historico.length}</p>
              </div>
           </div>
        </div>
        <Dumbbell className="absolute -right-6 -bottom-6 text-red-950 w-48 h-48 rotate-[-20deg]" />
      </div>

      {/* Frequência */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><CalendarDays size={16}/> Essa Semana</h3>
        <div className="flex justify-between">
          {treinosEstaSemana.map((item, i) => (
             <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    item.ativo ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 
                    item.isToday ? 'border border-slate-500' : 'bg-slate-800'
                }`}>
                  {item.ativo && <CheckCircle2 size={16} className="text-black"/>}
                </div>
                <span className={`text-[10px] font-bold ${item.isToday ? 'text-white' : 'text-slate-600'}`}>{item.dia}</span>
             </div>
          ))}
        </div>
      </div>

      <button onClick={() => setAbaAtiva('treinos')} className="w-full bg-slate-100 hover:bg-white text-black font-black py-4 rounded-xl shadow-lg transform active:scale-95 transition flex items-center justify-center gap-2">
        <PlayCircle size={24} /> COMEÇAR TREINO
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 font-sans pb-24 selection:bg-red-600 selection:text-white">
      
      {/* HEADER */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30 px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="bg-red-600 w-8 h-8 rounded flex items-center justify-center font-black italic text-white">G</div>
           <span className="font-black italic tracking-tighter text-xl">GYM<span className="text-red-600">TECH</span></span>
        </div>
        <button 
          onClick={() => setModalNovoTreinoAberto(true)}
          className="bg-slate-900 border border-white/10 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition"
        >
          <Plus size={14} /> NOVO TREINO
        </button>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-xl mx-auto px-4 py-6">
         
         {abaAtiva === 'home' && <RenderDashboard />}
         
         {abaAtiva === 'treinos' && (
           <div className="space-y-6 animate-in fade-in">
             <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {(['Todos', 'Aquecimento', 'Cardio', 'Iniciante', 'Intermediário', 'Avançado'] as const).map((nivel) => (
                  <button key={nivel} onClick={() => setFiltroNivel(nivel)} className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-all border ${
                    filtroNivel === nivel ? 'bg-red-600 border-red-600 text-white' : 'bg-transparent border-slate-800 text-slate-500'
                  }`}>
                    {nivel}
                  </button>
                ))}
             </div>

             <div className="grid grid-cols-1 gap-4">
               {treinosFiltrados.map((treino) => (
                  <div key={treino.id} onClick={() => setFichaSelecionada(treino)} 
                   className="bg-slate-900 h-40 rounded-xl border border-white/5 relative overflow-hidden cursor-pointer active:scale-95 transition group shadow-lg">
                     <img src={treino.imagemCapa} className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition duration-500"/>
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end">
                        <div className="flex items-center gap-2 mb-1">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                             treino.nivel === 'Cardio' ? 'bg-orange-500 text-black' : 
                             treino.nivel === 'Aquecimento' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'
                           }`}>
                             {treino.nivel}
                           </span>
                           <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1"><Clock size={10}/> {treino.duracaoMin} min</span>
                        </div>
                        <h3 className="text-2xl font-black italic uppercase leading-none text-white">{treino.titulo}</h3>
                     </div>
                  </div>
               ))}
             </div>
           </div>
         )}

         {abaAtiva === 'ferramentas' && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <h2 className="text-2xl font-black italic text-white uppercase mb-4">Ferramentas Pro</h2>
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4 text-blue-500"><Calculator size={24}/><h3 className="text-lg font-bold uppercase">Calculadora 1RM</h3></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                   <input type="number" className="bg-black border border-white/10 p-3 rounded text-white font-bold" value={calcPeso} onChange={e => setCalcPeso(e.target.value)} placeholder="Carga (kg)"/>
                   <input type="number" className="bg-black border border-white/10 p-3 rounded text-white font-bold" value={calcReps} onChange={e => setCalcReps(e.target.value)} placeholder="Reps"/>
                </div>
                {resultado1RM && <div className="bg-blue-900/20 p-4 rounded mb-4 text-center"><p className="text-sm text-blue-400 font-bold">1RM ESTIMADA</p><p className="text-4xl font-black text-white">{resultado1RM} kg</p></div>}
                <button onClick={calcular1RM} className="w-full bg-blue-600 text-white font-bold py-3 rounded">CALCULAR</button>
              </div>
            </div>
         )}

         {abaAtiva === 'historico' && (
            <div className="space-y-4 animate-in slide-in-from-right">
              <h2 className="text-2xl font-black italic text-white uppercase mb-4">Histórico</h2>
              {historico.length === 0 ? <p className="text-slate-500 text-center py-10">Sem treinos ainda.</p> : 
                historico.map((h) => (
                  <div key={h.id} className="bg-slate-900 border-l-4 border-red-600 p-4 rounded-r-xl flex justify-between items-center">
                     <div><h4 className="font-bold text-white">{h.treinoNome}</h4><p className="text-xs text-slate-400">{new Date(h.data).toLocaleDateString()}</p></div>
                     <p className="font-bold text-white">{h.duracaoReal} min</p>
                  </div>
              ))}
            </div>
         )}
      </main>

      {/* MENU INFERIOR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-white/10 py-2 px-6 z-40 flex justify-between items-center md:justify-center md:gap-12">
         {([
           {id: 'home', icon: LayoutDashboard, label: 'Home'},
           {id: 'treinos', icon: Dumbbell, label: 'Treinar'},
           {id: 'ferramentas', icon: Calculator, label: 'Tools'},
           {id: 'historico', icon: History, label: 'Hist'}
         ] as const).map(item => (
            <button key={item.id} onClick={() => setAbaAtiva(item.id)} className={`flex flex-col items-center gap-1 p-2 ${abaAtiva === item.id ? 'text-red-500' : 'text-slate-500'}`}>
               <item.icon size={24} /> <span className="text-[10px] font-bold uppercase">{item.label}</span>
            </button>
         ))}
      </nav>

      {/* MODAL TREINO ATIVO & EDITOR */}
      {fichaSelecionada && (
        <div className="fixed inset-0 z-50 bg-[#09090b] overflow-y-auto animate-in slide-in-from-bottom duration-300 pb-20">
           <div className="sticky top-0 bg-black/90 backdrop-blur border-b border-white/10 p-4 flex justify-between items-center z-10">
              <div><h2 className="text-lg font-black italic uppercase text-white w-48 truncate">{fichaSelecionada.titulo}</h2><p className="text-xs text-slate-400">{fichaSelecionada.duracaoMin} min</p></div>
              <button onClick={() => setFichaSelecionada(null)} className="bg-slate-800 p-2 rounded-full text-slate-400"><ChevronDown/></button>
           </div>

           <div className="p-4 space-y-4">
              {fichaSelecionada.exercicios.map((exercicio, idx) => (
                 <div key={exercicio.id} className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden relative group">
                    <button onClick={() => removerExercicio(exercicio.id)} className="absolute top-2 right-2 text-slate-700 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                       <h4 className="font-bold text-white uppercase text-sm flex items-center gap-2">
                         <span className="bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded text-xs">{idx + 1}</span> {exercicio.nome}
                       </h4>
                       <button onClick={() => window.open(`https://www.youtube.com/results?search_query=execução ${exercicio.nome}`, '_blank')} className="text-red-500 mr-8"><PlayCircle size={20}/></button>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                       <div className="bg-black p-3 rounded border border-white/10"><p className="text-[10px] uppercase font-bold text-slate-500">Alvo</p><p className="text-white font-bold">{exercicio.cargaAlvo}</p></div>
                       <div className="bg-black p-3 rounded border border-white/10"><p className="text-[10px] uppercase font-bold text-slate-500">Carga</p><input type="text" className="bg-transparent text-white font-bold w-full outline-none" placeholder="Add peso" value={logCargas[exercicio.id] || ''} onChange={(e) => atualizarCarga(exercicio.id, e.target.value)}/></div>
                    </div>
                    <div className="px-4 pb-4"><button onClick={() => iniciarDescanso(Number(exercicio.descanso))} className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition border border-white/5"><Timer size={16} className="text-emerald-500"/> DESCANSAR {exercicio.descanso}s</button></div>
                    <details className="px-4 pb-4 text-xs text-slate-400"><summary className="cursor-pointer font-bold uppercase text-slate-600 list-none flex gap-2 items-center"><BookOpen size={12}/> Instruções</summary><div className="mt-2 pl-2 border-l-2 border-red-600/30"><p>{exercicio.instrucoes}</p><p className="mt-1 text-yellow-500">{exercicio.dica}</p></div></details>
                 </div>
              ))}
           </div>

           {/* ADD EXERCICIO (Personalização) */}
           <div className="px-4 pt-4 pb-8 border-t border-white/5">
             <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Plus size={16}/> Adicionar Exercício</h3>
             <form onSubmit={adicionarExercicio} className="space-y-3 bg-slate-900 p-4 rounded-xl">
                <input className="w-full bg-black border border-white/10 rounded p-3 text-white text-sm" placeholder="Nome do Exercício" value={novoExercicio.nome} onChange={e => setNovoExercicio({...novoExercicio, nome: e.target.value})} required/>
                <div className="grid grid-cols-2 gap-3">
                   <input className="bg-black border border-white/10 rounded p-3 text-white text-sm" placeholder="Séries" value={novoExercicio.series} onChange={e => setNovoExercicio({...novoExercicio, series: Number(e.target.value)})}/>
                   <input className="bg-black border border-white/10 rounded p-3 text-white text-sm" placeholder="Reps" value={novoExercicio.repeticoes} onChange={e => setNovoExercicio({...novoExercicio, repeticoes: e.target.value})}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <input className="bg-black border border-white/10 rounded p-3 text-white text-sm" placeholder="Carga Alvo" value={novoExercicio.cargaAlvo} onChange={e => setNovoExercicio({...novoExercicio, cargaAlvo: e.target.value})}/>
                   <input className="bg-black border border-white/10 rounded p-3 text-white text-sm" placeholder="Descanso (s)" value={novoExercicio.descanso} onChange={e => setNovoExercicio({...novoExercicio, descanso: e.target.value})}/>
                </div>
                <textarea className="w-full bg-black border border-white/10 rounded p-3 text-white text-sm h-20" placeholder="Instruções..." value={novoExercicio.instrucoes} onChange={e => setNovoExercicio({...novoExercicio, instrucoes: e.target.value})}/>
                <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded">+ Adicionar</button>
             </form>
           </div>

           <div className="p-4 pb-32"><button onClick={finalizarTreino} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl uppercase flex items-center justify-center gap-2"><CheckCircle2 size={24}/> Finalizar Treino</button></div>
        </div>
      )}

      {/* TIMER FLUTUANTE */}
      {timerAtivo && (
        <div className="fixed bottom-24 left-4 right-4 bg-black/95 backdrop-blur border border-red-500/50 rounded-2xl p-4 flex items-center justify-between z-50 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex items-center justify-center"><span className="font-mono font-bold text-white text-sm">{Math.floor(tempoRestante/60)}:{tempoRestante%60 < 10 ? '0' : ''}{tempoRestante%60}</span></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Descanso</p><p className="text-red-500 font-bold text-sm animate-pulse">RECUPERANDO...</p></div>
          </div>
          <button onClick={() => setTimerAtivo(false)} className="px-3 py-2 bg-red-900/20 text-red-500 rounded text-xs font-bold">PARAR</button>
        </div>
      )}

      {/* MODAL NOVA FICHA */}
      {modalNovoTreinoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-black text-white uppercase italic mb-4">Nova Ficha</h2>
            <form onSubmit={salvarNovoTreino} className="space-y-3">
              <input className="w-full bg-black border border-white/10 rounded p-3 text-white" placeholder="Nome" required value={novoTreino.titulo} onChange={e => setNovoTreino({...novoTreino, titulo: e.target.value})} />
              <textarea className="w-full bg-black border border-white/10 rounded p-3 text-white h-20" placeholder="Descrição" required value={novoTreino.descricao} onChange={e => setNovoTreino({...novoTreino, descricao: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                  <select className="bg-black border border-white/10 rounded p-3 text-white" value={novoTreino.nivel} onChange={e => setNovoTreino({...novoTreino, nivel: e.target.value as Nivel})}>
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Aquecimento">Aquecimento</option>
                  </select>
                  <input type="number" className="bg-black border border-white/10 rounded p-3 text-white" placeholder="Minutos" value={novoTreino.duracaoMin} onChange={e => setNovoTreino({...novoTreino, duracaoMin: Number(e.target.value)})}/>
              </div>
              <button type="submit" className="w-full bg-white text-black font-black py-3 rounded hover:bg-slate-200 transition">CRIAR</button>
              <button type="button" onClick={() => setModalNovoTreinoAberto(false)} className="w-full text-slate-500 text-sm py-2">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
