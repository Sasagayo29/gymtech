import { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, Clock, Plus, Trash2, 
  ChevronDown, BookOpen, Timer, 
  History, LayoutDashboard, 
  Calculator, Flame, CheckCircle2, X, Save
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
  descanso: string;
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

// --- 3. BANCO DE DADOS MASSIVO ---
const dadosIniciais: FichaTreino[] = [
  {
    id: 1,
    titulo: "Mobilidade Superior (Pré-Treino)",
    descricao: "Essencial antes de treinos de Peito/Costas/Ombro para soltar as articulações.",
    nivel: 'Aquecimento',
    duracaoMin: 10,
    imagemCapa: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Rotação de Ombros (Bastão)", grupo: "Ombros", series: 2, repeticoes: "15", cargaAlvo: "Bastão PVC", descanso: "0", instrucoes: "Segure o bastão com pegada larga e passe por trás da cabeça até o glúteo e volte.", dica: "Mantenha os cotovelos estendidos." },
      { id: 2, nome: "YTWL no Banco", grupo: "Escápulas", series: 2, repeticoes: "10", cargaAlvo: "Sem peso", descanso: "30", instrucoes: "Deitado de bruços, faça movimentos formando as letras Y, T, W e L com os braços.", dica: "Foque em esmagar o meio das costas." }
    ]
  },
  {
    id: 2,
    titulo: "Treino de Peito - Iniciante",
    descricao: "Desenvolvimento básico do peitoral para quem está começando.",
    nivel: 'Iniciante',
    duracaoMin: 45,
    imagemCapa: "https://images.unsplash.com/photo-1534367507877-0edd93bd013b?auto=format&fit=crop&q=80&w=600",
    exercicios: [
      { id: 1, nome: "Supino Reto", grupo: "Peito", series: 3, repeticoes: "10-12", cargaAlvo: "20kg", descanso: "60", instrucoes: "Deitado no banco, empurre a barra para cima até estender os cotovelos.", dica: "Mantenha as escápulas retraídas." },
      { id: 2, nome: "Crucifixo", grupo: "Peito", series: 3, repeticoes: "12-15", cargaAlvo: "8kg", descanso: "45", instrucoes: "Deitado no banco, abra os braços com halteres até sentir alongamento no peito.", dica: "Mantenha cotovelos levemente flexionados." }
    ]
  }
];

// =======================================================
// ===================== COMPONENTE APP ==================
// =======================================================

function App() {
  // --- ESTADOS GERAIS ---
  const [abaAtiva, setAbaAtiva] = useState<Aba>('home');
  const [treinos, setTreinos] = useState<FichaTreino[]>(dadosIniciais);
  const [filtroNivel, setFiltroNivel] = useState<Nivel | 'Todos'>('Todos');
  const [fichaSelecionada, setFichaSelecionada] = useState<FichaTreino | null>(null);

  // --- PERSISTÊNCIA & GAMIFICATION ---
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [streak, setStreak] = useState(0);

  // --- TIMER ---
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- FORMULÁRIO DE EXERCÍCIO ---
  const [novoExercicio, setNovoExercicio] = useState({
    nome: '', grupo: '', series: 3, repeticoes: '',
    cargaAlvo: '', descanso: '60', instrucoes: '', dica: ''
  });

  // --- FORMULÁRIO NOVA FICHA ---
  const [modalNovoTreinoAberto, setModalNovoTreinoAberto] = useState(false);
  const [novoTreino, setNovoTreino] = useState<Partial<FichaTreino>>({
    titulo: '',
    descricao: '',
    nivel: 'Iniciante',
    duracaoMin: 60,
    imagemCapa: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600'
  });

  // --- CALCULADORA 1RM ---
  const [calcPeso, setCalcPeso] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const [resultado1RM, setResultado1RM] = useState<number | null>(null);

  // --- INIT ---
  useEffect(() => {
    const hist = localStorage.getItem('gymtech_history');
    const strk = localStorage.getItem('gymtech_streak');

    if (hist) setHistorico(JSON.parse(hist));
    if (strk) setStreak(Number(strk));

    audioRef.current = new Audio(SOM_BIP_URL);
  }, []);

  // ================================
  // ===== TIMER — CONTAGEM ========
  // ================================
  useEffect(() => {
    if (!timerAtivo) return;

    const interval = setInterval(() => {
      setTempoRestante((t) => {
        if (t <= 1) {
          audioRef.current?.play();
          setTimerAtivo(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerAtivo]);

  // Inicia o descanso usando o valor do exercício
  const iniciarDescanso = (segundos: number) => {
    setTempoRestante(segundos);
    setTimerAtivo(true);
  };

  // ================================
  // ========== 1RM CALC ============ 
  // ================================
  const calcular1RM = () => {
    const peso = Number(calcPeso);
    const reps = Number(calcReps);

    if (!peso || !reps || reps < 1) {
      setResultado1RM(null);
      return;
    }

    const estimativa = peso * (1 + reps / 30);
    setResultado1RM(Number(estimativa.toFixed(1)));
  };

  // ================================
  // ======= ADICIONAR TREINO ====== 
  // ================================
  const adicionarNovoTreino = () => {
    if (!novoTreino.titulo || !novoTreino.descricao) return;

    const novo: FichaTreino = {
      id: Date.now(),
      titulo: novoTreino.titulo!,
      descricao: novoTreino.descricao!,
      nivel: novoTreino.nivel as Nivel,
      duracaoMin: novoTreino.duracaoMin!,
      imagemCapa: novoTreino.imagemCapa!,
      exercicios: []
    };

    setTreinos((prev) => [...prev, novo]);
    setModalNovoTreinoAberto(false);

    setNovoTreino({
      titulo: '',
      descricao: '',
      nivel: 'Iniciante',
      duracaoMin: 60,
      imagemCapa: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600'
    });
  };

  // ================================
  // ===== ADICIONAR EXERCÍCIO ===== 
  // ================================
  const adicionarExercicio = () => {
    if (!fichaSelecionada) return;
    if (!novoExercicio.nome) return;

    const novo: Exercicio = {
      id: Date.now(),
      ...novoExercicio
    };

    const atualizado = treinos.map((t) => 
      t.id === fichaSelecionada.id 
        ? { ...t, exercicios: [...t.exercicios, novo] }
        : t
    );

    setTreinos(atualizado);
    setFichaSelecionada(atualizado.find(t => t.id === fichaSelecionada.id) || null);

    setNovoExercicio({
      nome: '', grupo: '', series: 3, repeticoes: '',
      cargaAlvo: '', descanso: '60', instrucoes: '', dica: ''
    });
  };

  // Registrar treino concluído
  const registrarHistorico = (treino: FichaTreino) => {
    const item: RegistroHistorico = {
      id: Date.now(),
      treinoNome: treino.titulo,
      data: new Date().toISOString(),
      duracaoReal: treino.duracaoMin
    };

    const novo = [...historico, item];
    setHistorico(novo);
    localStorage.setItem('gymtech_history', JSON.stringify(novo));

    // Streak
    const novoStreak = streak + 1;
    setStreak(novoStreak);
    localStorage.setItem('gymtech_streak', String(novoStreak));
  };

  // ================================
  // ========= RENDER ABAS ==========
  // ================================
  const renderAbaConteudo = () => {
    switch (abaAtiva) {
      case 'home':
        return (
          <div className="px-4 mt-4 space-y-4">
            <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Flame className="text-orange-500" size={24} />
                <div>
                  <h3 className="font-bold">Sequência Atual</h3>
                  <p className="text-2xl font-bold">{streak} dias</p>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold">Seus Treinos Recentes</h2>
            {treinos.slice(0, 3).map((treino) => (
              <div
                key={treino.id}
                onClick={() => setFichaSelecionada(treino)}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:border-emerald-500/40 transition cursor-pointer"
              >
                <img 
                  src={treino.imagemCapa}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <h3 className="font-semibold">{treino.titulo}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                    <Clock size={12}/> {treino.duracaoMin} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'treinos':
        return fichaSelecionada === null ? (
          <div className="px-4 mt-4 space-y-4">
            {treinos
              .filter(t => filtroNivel === 'Todos' || t.nivel === filtroNivel)
              .map((treino) => (
                <div
                  key={treino.id}
                  onClick={() => setFichaSelecionada(treino)}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:border-emerald-500/40 transition cursor-pointer"
                >
                  <img 
                    src={treino.imagemCapa}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4 space-y-2">
                    <h2 className="text-lg font-bold">{treino.titulo}</h2>
                    <p className="text-sm text-white/60">{treino.descricao}</p>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Clock size={14}/> {treino.duracaoMin} min
                      <span className="px-2 py-1 bg-emerald-900/20 text-emerald-400 rounded-full ml-auto">
                        {treino.nivel}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <>
            <div className="px-4 flex items-center gap-3 mt-4">
              <button
                onClick={() => setFichaSelecionada(null)}
                className="p-2 bg-white/10 rounded-full"
              >
                <ChevronDown size={16}/>
              </button>
              <h2 className="text-xl font-bold">{fichaSelecionada.titulo}</h2>
            </div>

            <img 
              src={fichaSelecionada.imagemCapa}
              className="w-full h-48 object-cover mt-3"
            />

            <div className="px-4 mt-4 space-y-2">
              <p className="text-white/70">{fichaSelecionada.descricao}</p>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <Clock size={15}/> {fichaSelecionada.duracaoMin} min
                <span className="px-3 py-1 bg-emerald-900/20 text-emerald-400 rounded-full">
                  {fichaSelecionada.nivel}
                </span>
              </div>
            </div>

            <div className="mt-4 px-4">
              <button
                onClick={() => registrarHistorico(fichaSelecionada)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                MARCAR COMO CONCLUÍDO
              </button>
            </div>

            <div className="mt-4 px-4 space-y-4">
              {fichaSelecionada.exercicios.map((exercicio) => (
                <div
                  key={exercicio.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{exercicio.nome}</h3>
                      <p className="text-white/40 text-sm">{exercicio.grupo}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const atualizado = fichaSelecionada.exercicios.filter(x => x.id !== exercicio.id);
                        const novoTreino = { ...fichaSelecionada, exercicios: atualizado };
                        setFichaSelecionada(novoTreino);
                        setTreinos(prev =>
                          prev.map(t =>
                            t.id === novoTreino.id ? novoTreino : t
                          )
                        );
                      }}
                      className="p-2 bg-red-900/20 rounded-full border border-red-600/40 hover:bg-red-900/40"
                    >
                      <Trash2 size={16} className="text-red-400"/>
                    </button>
                  </div>

                  <div className="mt-3 text-sm text-white/60 space-y-1">
                    <p><strong>Séries:</strong> {exercicio.series}</p>
                    <p><strong>Reps:</strong> {exercicio.repeticoes}</p>
                    <p><strong>Carga alvo:</strong> {exercicio.cargaAlvo}</p>
                  </div>

                  <details className="mt-3 bg-white/5 px-3 py-2 rounded">
                    <summary className="cursor-pointer text-sm text-white/60 flex items-center gap-1">
                      <BookOpen size={14}/> Instruções
                    </summary>
                    <p className="mt-2 text-white/50 text-sm">{exercicio.instrucoes}</p>
                    <p className="mt-1 text-emerald-400 text-xs">{exercicio.dica}</p>
                  </details>

                  <div className="px-1 pt-4">
                    <button
                      onClick={() => iniciarDescanso(Number(exercicio.descanso))}
                      className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold border border-white/5 transition"
                    >
                      <Timer size={16} className="text-emerald-500" />
                      DESCANSAR {exercicio.descanso}s
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {fichaSelecionada && (
              <div className="px-4 mt-6 mb-20">
                <h3 className="text-lg font-bold mb-2">Adicionar exercício</h3>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                  <input
                    className="w-full bg-black/30 border border-white/10 p-2 rounded"
                    placeholder="Nome do exercício"
                    value={novoExercicio.nome}
                    onChange={(e) => setNovoExercicio({ ...novoExercicio, nome: e.target.value })}
                  />
                  <input
                    className="w-full bg-black/30 border border-white/10 p-2 rounded"
                    placeholder="Grupo muscular"
                    value={novoExercicio.grupo}
                    onChange={(e) => setNovoExercicio({ ...novoExercicio, grupo: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <input
                      className="w-1/3 bg-black/30 border border-white/10 p-2 rounded"
                      type="number"
                      placeholder="Séries"
                      value={novoExercicio.series}
                      onChange={(e) => setNovoExercicio({ ...novoExercicio, series: Number(e.target.value) })}
                    />
                    <input
                      className="w-2/3 bg-black/30 border border-white/10 p-2 rounded"
                      placeholder="Repetições"
                      value={novoExercicio.repeticoes}
                      onChange={(e) => setNovoExercicio({ ...novoExercicio, repeticoes: e.target.value })}
                    />
                  </div>
                  <input
                    className="w-full bg-black/30 border border-white/10 p-2 rounded"
                    placeholder="Carga alvo"
                    value={novoExercicio.cargaAlvo}
                    onChange={(e) => setNovoExercicio({ ...novoExercicio, cargaAlvo: e.target.value })}
                  />
                  <input
                    className="w-full bg-black/30 border border-white/10 p-2 rounded"
                    placeholder="Descanso (segundos)"
                    type="number"
                    value={novoExercicio.descanso}
                    onChange={(e) => setNovoExercicio({ ...novoExercicio, descanso: e.target.value })}
                  />
                  <textarea
                    className="w-full bg-black/30 border border-white/10 p-2 rounded"
                    placeholder="Instruções"
                    value={novoExercicio.instrucoes}
                    onChange={(e) => setNovoExercicio({ ...novoExercicio, instrucoes: e.target.value })}
                  />
                  <textarea
                    className="w-full bg-black/30 border border-white/10 p-2 rounded"
                    placeholder="Dicas"
                    value={novoExercicio.dica}
                    onChange={(e) => setNovoExercicio({ ...novoExercicio, dica: e.target.value })}
                  />
                  <button
                    onClick={adicionarExercicio}
                    className="w-full py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition font-bold flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Adicionar exercício
                  </button>
                </div>
              </div>
            )}
          </>
        );

      case 'ferramentas':
        return (
          <div className="px-4 mt-4 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calculator size={20} />
                Calculadora 1RM
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-white/60">Peso levantado (kg)</label>
                  <input
                    type="number"
                    className="w-full bg-black/30 border border-white/10 p-3 rounded mt-1"
                    value={calcPeso}
                    onChange={(e) => setCalcPeso(e.target.value)}
                    placeholder="Ex: 80"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-white/60">Número de repetições</label>
                  <input
                    type="number"
                    className="w-full bg-black/30 border border-white/10 p-3 rounded mt-1"
                    value={calcReps}
                    onChange={(e) => setCalcReps(e.target.value)}
                    placeholder="Ex: 5"
                  />
                </div>
                
                <button
                  onClick={calcular1RM}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold"
                >
                  CALCULAR 1RM
                </button>
                
                {resultado1RM && (
                  <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                    <p className="text-center text-lg font-bold text-emerald-400">
                      Seu 1RM estimado: {resultado1RM} kg
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'historico':
        return (
          <div className="px-4 mt-4 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <History size={20} />
                Histórico de Treinos
              </h2>
              
              {historico.length === 0 ? (
                <p className="text-white/50 text-center py-8">
                  Nenhum treino registrado ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {historico.slice().reverse().map((registro) => (
                    <div key={registro.id} className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{registro.treinoNome}</h3>
                          <p className="text-sm text-white/60">
                            {new Date(registro.data).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-sm text-white/40 flex items-center gap-1">
                          <Clock size={14} />
                          {registro.duracaoReal}min
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* ===================== CABEÇALHO FIXO ===================== */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-white/10">
        <div className="flex items-center justify-between px-5 h-16">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Dumbbell size={20} className="text-emerald-400" />
            GymTech
          </h1>
        </div>

        {/* ===== MENU SUPERIOR (NIVEL / FILTRO) ===== */}
        {abaAtiva === 'treinos' && !fichaSelecionada && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1">
            {['Todos','Iniciante','Intermediário','Avançado','Cardio','Aquecimento'].map((n) => (
              <button
                key={n}
                onClick={() => setFiltroNivel(n as any)}
                className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap transition ${
                  filtroNivel === n
                    ? "bg-emerald-600 border-emerald-400"
                    : "border-white/20 text-white/70"
                }`}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setModalNovoTreinoAberto(true)}
              className="px-4 py-2 rounded-full border border-emerald-500/40 bg-emerald-900/20 text-emerald-300 flex items-center gap-2"
            >
              <Plus size={16}/> Novo
            </button>
          </div>
        )}
      </header>

      {/* ============================================================
                          CONTEÚDO DAS ABAS
      ============================================================ */}
      {renderAbaConteudo()}

      {/* ============================================================
                           MODAL — NOVO TREINO
      ============================================================ */}
      {modalNovoTreinoAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-6">
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 w-full max-w-lg space-y-4 relative">
            <button
              onClick={() => setModalNovoTreinoAberto(false)}
              className="absolute top-3 right-3 p-2 bg-red-900/30 rounded-full"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-bold">Novo treino</h2>

            <input
              className="w-full bg-black/30 border border-white/20 p-2 rounded"
              placeholder="Título"
              value={novoTreino.titulo}
              onChange={(e) => setNovoTreino({ ...novoTreino, titulo: e.target.value })}
            />

            <textarea
              className="w-full bg-black/30 border border-white/20 p-2 rounded"
              placeholder="Descrição"
              value={novoTreino.descricao}
              onChange={(e) => setNovoTreino({ ...novoTreino, descricao: e.target.value })}
            />

            <input
              className="w-full bg-black/30 border border-white/20 p-2 rounded"
              placeholder="Imagem URL"
              value={novoTreino.imagemCapa}
              onChange={(e) => setNovoTreino({ ...novoTreino, imagemCapa: e.target.value })}
            />

            <select
              className="w-full bg-black/30 border border-white/20 p-2 rounded"
              value={novoTreino.nivel}
              onChange={(e) => setNovoTreino({ ...novoTreino, nivel: e.target.value as any })}
            >
              <option>Iniciante</option>
              <option>Intermediário</option>
              <option>Avançado</option>
              <option>Cardio</option>
              <option>Aquecimento</option>
            </select>

            <button
              onClick={adicionarNovoTreino}
              className="w-full py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition font-bold flex items-center justify-center gap-2"
            >
              <Save size={16} />
              Salvar treino
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
                          TIMER FLUTUANTE
      ============================================================ */}
      {timerAtivo && (
        <div className="fixed bottom-24 left-4 right-4 bg-black/95 backdrop-blur border border-red-500/50 rounded-2xl p-4 flex items-center justify-between z-50 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <span className="font-mono font-bold text-white text-sm">
                {Math.floor(tempoRestante / 60)}:
                {tempoRestante % 60 < 10 ? '0' : ''}
                {tempoRestante % 60}
              </span>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Descanso</p>
              <p className="text-red-500 font-bold text-sm animate-pulse">RECUPERANDO...</p>
            </div>
          </div>

          <button
            onClick={() => setTimerAtivo(false)}
            className="px-3 py-2 bg-red-900/20 text-red-500 rounded text-xs font-bold"
          >
            PARAR
          </button>
        </div>
      )}

      {/* ============================================================
                             NAV BAR INFERIOR
      ============================================================ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 h-16 flex items-center justify-around text-sm backdrop-blur z-40">
        <button onClick={() => setAbaAtiva('home')} className="flex flex-col items-center gap-1">
          <LayoutDashboard size={18} className={abaAtiva === 'home' ? "text-emerald-400" : "text-white/40"} />
          <span className={abaAtiva === 'home' ? "text-emerald-400" : "text-white/40"}>Home</span>
        </button>

        <button onClick={() => setAbaAtiva('treinos')} className="flex flex-col items-center gap-1">
          <Dumbbell size={18} className={abaAtiva === 'treinos' ? "text-emerald-400" : "text-white/40"} />
          <span className={abaAtiva === 'treinos' ? "text-emerald-400" : "text-white/40"}>Treinos</span>
        </button>

        <button onClick={() => setAbaAtiva('ferramentas')} className="flex flex-col items-center gap-1">
          <Calculator size={18} className={abaAtiva === 'ferramentas' ? "text-emerald-400" : "text-white/40"} />
          <span className={abaAtiva === 'ferramentas' ? "text-emerald-400" : "text-white/40"}>1RM</span>
        </button>

        <button onClick={() => setAbaAtiva('historico')} className="flex flex-col items-center gap-1">
          <History size={18} className={abaAtiva === 'historico' ? "text-emerald-400" : "text-white/40"} />
          <span className={abaAtiva === 'historico' ? "text-emerald-400" : "text-white/40"}>Histórico</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
