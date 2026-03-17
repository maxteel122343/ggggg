import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Plus, 
  Mic, 
  Brain, 
  Eye, 
  EyeOff, 
  Settings, 
  X, 
  Smartphone,
  MousePointer2,
  Save,
  ShieldCheck,
  Power,
  MessageSquare,
  Send,
  Monitor,
  Smartphone as PhoneIcon,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Volume2,
  VolumeX,
  Download,
  Search,
  FileText,
  DownloadCloud,
  History,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { GestureAction, GestureType, AIResponse } from './types';

const GESTURE_COLORS: Record<string, string> = {
  tap: 'bg-blue-500',
  double_tap: 'bg-blue-600',
  long_press: 'bg-yellow-500',
  scroll_up: 'bg-green-400',
  scroll_down: 'bg-green-500',
  scroll_left: 'bg-green-600',
  scroll_right: 'bg-green-700',
  swipe: 'bg-orange-500',
  drag: 'bg-purple-500',
  pinch_in: 'bg-pink-500',
  pinch_out: 'bg-pink-600',
  type_text: 'bg-zinc-500',
  open_app: 'bg-indigo-500',
  go_back: 'bg-red-500',
  go_home: 'bg-red-600',
  wait: 'bg-zinc-400',
};

export default function App() {
  // State
  const [apiKey, setApiKey] = useState(process.env.GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '');
  const [isServiceActive, setIsServiceActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [gestures, setGestures] = useState<GestureAction[]>([]);
  const [showMarkers, setShowMarkers] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [selectedGestureType, setSelectedGestureType] = useState<GestureType>('tap');
  const [showSettings, setShowSettings] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [appMode, setAppMode] = useState<'simulated' | 'real'>('simulated');
  const [currentApp, setCurrentApp] = useState<'home' | 'social' | 'chat' | 'settings' | 'music' | 'maps' | 'health' | 'gallery' | 'browser'>('home');
  const [homePage, setHomePage] = useState(0);
  const [chatMessages, setChatMessages] = useState<{sender: string, text: string}[]>([
    { sender: 'Maria', text: 'Oi! Tudo bem?' },
    { sender: 'João', text: 'Viu o vídeo que te mandei?' }
  ]);
  const [appChatInput, setAppChatInput] = useState('');
  const [browserUrl, setBrowserUrl] = useState('google.com');
  const [isBrowserLoading, setIsBrowserLoading] = useState(false);
  const [socialLikes, setSocialLikes] = useState<Record<number, boolean>>({});
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [healthSteps, setHealthSteps] = useState(8420);
  const [appSettings, setAppSettings] = useState({
    darkMode: true,
    notifications: false,
    sync: true
  });
  const [aiChatHistory, setAiChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isVoiceResponseEnabled, setIsVoiceResponseEnabled] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchObjective, setSearchObjective] = useState('');
  const [userPreferences, setUserPreferences] = useState('Gosta de tecnologia, música eletrônica, e notícias sobre IA. Prefere modo escuro e é focado em produtividade.');
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{id: string, title: string, body: string, icon?: React.ReactNode}[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<{id: string, name: string, type: string, date: string, url: string}[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'gestures' | 'downloads' | 'history'>('config');
  const [permissions, setPermissions] = useState({
    overlay: false,
    accessibility: false,
    audio: false,
    internet: true,
  });
  const [showOverlaySimulation, setShowOverlaySimulation] = useState(false);

  const phoneRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory]);

  // Stop searching if modes are disabled
  useEffect(() => {
    if (!isSearchMode && !isFreeMode) {
      setIsSearching(false);
    }
  }, [isSearchMode, isFreeMode]);

  // Save API Key
  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setShowSettings(false);
    setAiStatus('API Key salva com sucesso!');
    setTimeout(() => setAiStatus(null), 3000);
  };

  // Generate PDF Mock
  const generateMockPDF = (title: string, content: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newFile = {
      id,
      name: `${title.replace(/\s+/g, '_')}.pdf`,
      type: 'PDF Document',
      date: new Date().toLocaleString(),
      url: '#'
    };
    setGeneratedFiles(prev => [newFile, ...prev]);
    setAiStatus(`Relatório "${newFile.name}" gerado com sucesso!`);
    return newFile;
  };

  // Add Notification
  const addNotification = (title: string, body: string, icon?: React.ReactNode) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, body, icon }]);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Add Gesture
  const handleScreenClick = (e: React.MouseEvent) => {
    if (!isEditing || !phoneRef.current) return;

    const rect = phoneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newGesture: GestureAction = {
      id: gestures.length + 1,
      type: selectedGestureType,
      x,
      y,
      duration: 300,
      delay: 0,
      color: GESTURE_COLORS[selectedGestureType] || 'bg-gray-500',
      text: selectedGestureType === 'type_text' ? prompt('Digite o texto para este gesto:') || '' : undefined,
    };

    setGestures([...gestures, newGesture]);
  };

  // Execute Gestures
  const executeGestures = async () => {
    setAiStatus('Executando sequência...');
    for (const gesture of gestures) {
      await new Promise(resolve => setTimeout(resolve, gesture.delay + 500));
      
      if (gesture.type === 'tap' || gesture.type === 'double_tap' || gesture.type === 'long_press') {
        handleSimulatorTap(gesture.x, gesture.y);
      } else if (gesture.type === 'type_text' && gesture.text) {
        if (currentApp === 'chat') setAppChatInput(gesture.text);
        if (currentApp === 'browser') setBrowserUrl(gesture.text);
      } else if (gesture.type === 'go_home') {
        setCurrentApp('home');
      } else if (gesture.type === 'scroll_right' && currentApp === 'home' && homePage < 2) {
        setHomePage(prev => prev + 1);
      } else if (gesture.type === 'scroll_left' && currentApp === 'home' && homePage > 0) {
        setHomePage(prev => prev - 1);
      }
    }
    setAiStatus('Execução concluída');
    setTimeout(() => setAiStatus(null), 2000);
  };

  // Handle Simulator Tap (Coordinate to Action mapping)
  const handleSimulatorTap = (x: number, y: number) => {
    // Settings Toggles
    if (currentApp === 'settings') {
      if (x > 250 && y > 80 && y < 120) setAppSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
      if (x > 250 && y > 140 && y < 180) setAppSettings(prev => ({ ...prev, notifications: !prev.notifications }));
      if (x > 250 && y > 200 && y < 240) setAppSettings(prev => ({ ...prev, sync: !prev.sync }));
    }
    
    // Chat Send Button
    if (currentApp === 'chat') {
      if (x > 250 && y > 580 && y < 620) {
        if (appChatInput.trim()) {
          setChatMessages(prev => [...prev, { sender: 'Você', text: appChatInput }]);
          setAppChatInput('');
        }
      }
    }

    // Browser Go Button
    if (currentApp === 'browser') {
      if (x > 250 && y > 20 && y < 60) {
        setAiStatus(`Navegando para: ${browserUrl}`);
      }
    }

    // Music Controls
    if (currentApp === 'music') {
      if (x > 120 && x < 200 && y > 450 && y < 550) setMusicPlaying(!musicPlaying);
      if (x > 220 && y > 450 && y < 550) setAiStatus('Próxima Música');
      if (x < 100 && y > 450 && y < 550) setAiStatus('Música Anterior');
    }

    // Social Likes
    if (currentApp === 'social') {
      if (x < 100 && y > 180 && y < 220) setSocialLikes(prev => ({ ...prev, 1: !prev[1] }));
      if (x < 100 && y > 380 && y < 420) setSocialLikes(prev => ({ ...prev, 2: !prev[2] }));
    }

    // Gallery Click
    if (currentApp === 'gallery') {
      if (y > 100) setAiStatus('Foto visualizada');
    }

    // Health Start Button
    if (currentApp === 'health') {
      if (y > 500) setAiStatus('Treino iniciado!');
    }

    // Maps Zoom
    if (currentApp === 'maps') {
      if (x > 250 && y > 480 && y < 520) setAiStatus('Zoom In');
      if (x > 250 && y > 540 && y < 580) setAiStatus('Zoom Out');
    }
  };

  // TTS Function
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // AI Action Request
  const requestAIAction = async (command: string) => {
    if (!apiKey) {
      setAiStatus('Erro: Insira a API Key nas configurações');
      return;
    }

    setAiStatus('IA pensando...');
    if (isSearchMode || isFreeMode) setIsSearching(true);
    try {
      const genAI = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Você é um agente de automação Android.
        Comando do usuário: "${command}"
        Resolução da tela: 320x640 (Simulada)
        App atual: ${currentApp}
        Página da Home: ${homePage}
        Modo de Operação: ${appMode === 'real' ? 'MODO REAL (Celular Físico via Overlay)' : 'SIMULADO'}
        Modo Busca Ativo: ${isSearchMode ? 'SIM' : 'NÃO'}
        Objetivo da Busca: ${searchObjective}
        Modo Free Ativo: ${isFreeMode ? 'SIM' : 'NÃO'}
        Preferências do Usuário: ${userPreferences}
        Gestos atuais definidos: ${JSON.stringify(gestures)}
        Configurações do App: ${JSON.stringify(appSettings)}
        Histórico da conversa:
        ${aiChatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}
        
        Contexto da tela e Coordenadas (X, Y):
        ${currentApp === 'home' && homePage === 0 ? '- Ícones: Social (60, 100), Chat (160, 100), Settings (260, 100). (Dica: Deslize para a direita para ver mais apps)' : ''}
        ${currentApp === 'home' && homePage === 1 ? '- Ícones: Music (60, 100), Maps (160, 100), Health (260, 100). (Dica: Deslize para a esquerda ou direita)' : ''}
        ${currentApp === 'home' && homePage === 2 ? '- Ícones: Gallery (60, 100), Browser (160, 100). (Dica: Deslize para a esquerda)' : ''}
        ${currentApp === 'social' ? `- Elementos: Botão Curtir Post 1 (50, 200), Botão Curtir Post 2 (50, 400), Botão Novo Post (280, 50)` : ''}
        ${currentApp === 'chat' ? `- Elementos: Campo de texto (160, 600), Botão Enviar (280, 600). Mensagem atual no campo: "${appChatInput}"` : ''}
        ${currentApp === 'settings' ? `- Elementos: Toggle Modo Escuro (280, 100), Toggle Notificações (280, 160), Toggle Sincronização (280, 220)` : ''}
        ${currentApp === 'music' ? `- Elementos: Botão Play/Pause (160, 500), Botão Próxima (240, 500), Botão Anterior (80, 500)` : ''}
        ${currentApp === 'maps' ? '- Elementos: Campo de busca (160, 40), Botão Zoom In (280, 500), Botão Zoom Out (280, 560)' : ''}
        ${currentApp === 'health' ? `- Elementos: Botão Iniciar Treino (160, 550)` : ''}
        ${currentApp === 'gallery' ? '- Elementos: Grid de fotos (Foto 1: 50, 100; Foto 2: 160, 100; Foto 3: 270, 100...)' : ''}
        ${currentApp === 'browser' ? `- Elementos: Barra de endereço (160, 40), Botão Ir (280, 40). URL atual: "${browserUrl}"` : ''}

        Instruções:
        1. BIBLIOTECA DE GESTOS:
           - "tap": Clique simples em (x, y).
           - "double_tap": Clique duplo em (x, y).
           - "long_press": Clique longo em (x, y).
           - "scroll_up", "scroll_down", "scroll_left", "scroll_right": Rolagem na direção indicada.
           - "swipe": Deslize rápido (use "direction": "left|right|up|down").
           - "drag": Arrastar de um ponto a outro (use x, y como destino).
           - "pinch_in", "pinch_out": Pinça para zoom.
           - "type_text": Digitar texto (use "text": "conteúdo").
           - "open_app": Abrir um app (use "target": "social|chat|settings|music|maps|health|gallery|browser").
           - "go_back": Voltar para a tela anterior (ou home).
           - "go_home": Voltar para a tela inicial imediatamente.
           - "wait": Esperar um tempo (use "duration" em ms).

        2. Se precisar mudar de página na home, use "gesture": "scroll_right" ou "scroll_left" (ou swipe).
        3. Para interagir com elementos específicos (como toggles ou botões), use "gesture": "tap" com as coordenadas X e Y fornecidas acima.
        4. Se o usuário pedir para enviar uma mensagem no chat, você deve usar "type_text" e depois "tap" no botão Enviar (280, 600).
        5. MODO BUSCA: Se "isSearchMode" for true, seu objetivo é persistir até completar a tarefa. Você pode usar "gesture": "generate_report" com "title" e "content" para criar documentos.
        6. MODO BUSCA: Você pode "baixar" arquivos usando "gesture": "download" com "name" e "type".
        7. MODO BUSCA: Se precisar de um app que não está na home, você pode "instalar" usando "gesture": "install_app" com "name".
        8. MODO BUSCA: Quando o objetivo for alcançado, você DEVE usar "gesture": "finish_search" para encerrar a busca.
        9. NOTIFICAÇÕES: Você pode enviar pop-ups de notificação para o usuário usando "gesture": "send_notification" com "title" e "body".
        10. MODO FREE: Se "isFreeMode" for true, você deve agir como um usuário comum explorando o celular. Navegue pelos apps, curta posts, veja fotos, mude configurações de acordo com as "Preferências do Usuário". Não espere comandos específicos, apenas explore e interaja de forma natural.
        11. Sempre forneça uma mensagem curta explicando o que você está fazendo.
      `;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const responseText = response.text;
      if (!responseText) throw new Error('No response from AI');
      
      const jsonMatch = responseText.match(/\{.*\}/s);
      
      if (jsonMatch) {
        const data: AIResponse = JSON.parse(jsonMatch[0]);
        
        if (data.message) {
          setAiChatHistory(prev => [...prev, { role: 'ai', text: data.message! }]);
          if (isVoiceResponseEnabled) {
            speak(data.message);
          }
        }

        setAiStatus(`IA decidiu: ${data.actions.map(a => a.gesture).join(', ')}`);
        
        // Simulate execution of AI actions
        for (const action of data.actions) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Trigger actual simulator interaction if it's a tap
          if ((action.gesture === 'tap' || action.gesture === 'double_tap' || action.gesture === 'long_press') && action.x && action.y) {
            handleSimulatorTap(action.x, action.y);
          }

          if (action.gesture === 'type_text' && action.text) {
            if (currentApp === 'chat') setAppChatInput(action.text);
            if (currentApp === 'browser') setBrowserUrl(action.text);
            setAiStatus(`Digitando: ${action.text}`);
          } else if (action.gesture === 'go_home') {
            setCurrentApp('home');
            setAiStatus('Voltando para Home');
          } else if (action.gesture === 'go_back') {
            if (currentApp !== 'home') setCurrentApp('home');
            setAiStatus('Voltando');
          } else if (action.gesture === 'wait') {
            setAiStatus(`Esperando ${action.duration || 1000}ms...`);
            await new Promise(r => setTimeout(r, action.duration || 1000));
          } else if (action.gesture === 'scroll_up' || action.gesture === 'scroll_down' || action.gesture === 'scroll_left' || action.gesture === 'scroll_right') {
            if (currentApp === 'home') {
              if (action.gesture === 'scroll_right' && homePage < 2) setHomePage(prev => prev + 1);
              if (action.gesture === 'scroll_left' && homePage > 0) setHomePage(prev => prev - 1);
            }
            setAiStatus(`Rolando: ${action.gesture}`);
          } else if (action.gesture === 'generate_report') {
            generateMockPDF(action.title || 'Relatório', action.content || 'Conteúdo gerado pela IA.');
          } else if (action.gesture === 'download') {
            const id = Math.random().toString(36).substr(2, 9);
            setGeneratedFiles(prev => [{
              id,
              name: action.name || 'arquivo',
              type: action.type || 'Arquivo',
              date: new Date().toLocaleString(),
              url: '#'
            }, ...prev]);
            setAiStatus(`Download de "${action.name}" concluído!`);
          } else if (action.gesture === 'install_app') {
            setAiStatus(`Instalando app "${action.name}"...`);
            await new Promise(r => setTimeout(r, 2000));
            setInstalledApps(prev => [...new Set([...prev, action.name || 'Novo App'])]);
            setAiStatus(`App "${action.name}" instalado com sucesso!`);
          } else if (action.gesture === 'send_notification') {
            addNotification(action.title || 'Notificação', action.body || 'Você tem uma nova mensagem.');
          } else if (action.gesture === 'finish_search') {
            setIsSearching(false);
            setIsFreeMode(false);
            setAiStatus('Exploração/Busca concluída!');
            return;
          } else if (action.gesture === 'open_app') {
            const target = action.target as any;
            const validApps = ['social', 'chat', 'settings', 'music', 'maps', 'health', 'gallery', 'browser'];
            if (validApps.includes(target)) {
              setCurrentApp(target);
              setAiStatus(`Abrindo ${target}...`);
            } else {
              setAiStatus(`App ${target} não encontrado`);
            }
          } else if (action.gesture === 'swipe' && currentApp === 'home') {
            if (action.direction === 'left' && homePage < 2) setHomePage(prev => prev + 1);
            if (action.direction === 'right' && homePage > 0) setHomePage(prev => prev - 1);
            setAiStatus(`Deslizando para ${action.direction}...`);
          } else if (action.x && action.y) {
            // Add temporary marker for AI gesture
            const aiGesture: GestureAction = {
              id: 999,
              type: action.gesture as GestureType,
              x: action.x,
              y: action.y,
              duration: 300,
              delay: 0,
              color: 'bg-red-500',
            };
            setGestures(prev => [...prev, aiGesture]);
            setTimeout(() => setGestures(prev => prev.filter(g => g.id !== 999)), 2000);
          }
        }

        // Persistence Logic: If in search mode or free mode and not finished, request next action
        if (isSearching) {
          setTimeout(() => {
            // Use a functional update or check current state if needed, 
            // but here we just rely on the next call to check the latest state.
            if (isSearchMode || isFreeMode) {
              const nextCommand = isFreeMode 
                ? `CONTINUE EXPLORAÇÃO: Continue navegando como um usuário baseado em: ${userPreferences}`
                : `CONTINUE BUSCA: O objetivo é "${searchObjective}". O que falta fazer?`;
              requestAIAction(nextCommand);
            }
          }, 4000);
        }
      }
    } catch (error) {
      console.error(error);
      setAiStatus('Erro na comunicação com a IA');
    }
  };

  // Voice Command Simulation
  const startVoiceCommand = () => {
    setIsListening(true);
    setTranscript('Ouvindo...');
    
    // In a real browser we'd use webkitSpeechRecognition
    // Here we simulate a voice command after 2 seconds
    setTimeout(() => {
      const mockCommands = [
        "Abra o WhatsApp",
        "Role para baixo",
        "Clique no botão de enviar",
        "Curta o vídeo"
      ];
      const randomCommand = mockCommands[Math.floor(Math.random() * mockCommands.length)];
      setTranscript(randomCommand);
      setIsListening(false);
      requestAIAction(randomCommand);
    }, 2000);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const command = chatInput;
    setChatInput('');
    setAiChatHistory(prev => [...prev, { role: 'user', text: command }]);
    requestAIAction(command);
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allPermissionsGranted = Object.values(permissions).every(p => p);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Main Layout */}
      <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left: Control Panel */}
        <div className="space-y-6">
          <header className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Brain className="w-6 h-6 text-black" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">AI Gesture Agent</h1>
              </div>
              
              {/* Mode Toggles */}
              <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button 
                  onClick={() => setAppMode('simulated')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    appMode === 'simulated' 
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                    : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  SIMULADO
                </button>
                <button 
                  onClick={() => setAppMode('real')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    appMode === 'real' 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <PhoneIcon className="w-3.5 h-3.5" />
                  MODO REAL
                </button>
              </div>
            </div>
            <p className="text-zinc-400">Automação inteligente via gestos e IA para Android.</p>
          </header>

          {appMode === 'simulated' ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6 backdrop-blur-sm">
              {/* Status & Service Toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${isServiceActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
                  <span className="font-medium">{isServiceActive ? 'Serviço Ativo' : 'Serviço Inativo'}</span>
                </div>
                <button 
                  onClick={() => setIsServiceActive(!isServiceActive)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    isServiceActive 
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                    : 'bg-emerald-500 text-black hover:bg-emerald-400'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {isServiceActive ? 'Parar' : 'Iniciar'}
                </button>
              </div>

              {/* API Key Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  Configuração de Segurança
                </label>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    placeholder="Insira sua Gemini API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button 
                    onClick={saveApiKey}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Salvar API Key"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Voice Settings */}
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isVoiceResponseEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                    {isVoiceResponseEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold">Resposta por Voz</div>
                    <div className="text-[10px] text-zinc-500">IA responde falando via áudio</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsVoiceResponseEnabled(!isVoiceResponseEnabled)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${isVoiceResponseEnabled ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isVoiceResponseEnabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* Gesture Tools */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ferramentas</label>
                  <div className="flex bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
                    <button 
                      onClick={() => setActiveTab('config')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === 'config' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                    >
                      Config
                    </button>
                    <button 
                      onClick={() => setActiveTab('gestures')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === 'gestures' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                    >
                      Gestos
                    </button>
                    <button 
                      onClick={() => setActiveTab('downloads')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === 'downloads' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                    >
                      Downloads
                    </button>
                    <button 
                      onClick={() => setActiveTab('history')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === 'history' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                    >
                      Histórico
                    </button>
                  </div>
                </div>

                {activeTab === 'gestures' && (
                  <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {(['tap', 'double_tap', 'long_press', 'scroll_up', 'scroll_down', 'scroll_left', 'scroll_right', 'swipe', 'drag', 'pinch_in', 'pinch_out', 'type_text', 'open_app', 'go_back', 'go_home', 'wait'] as GestureType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedGestureType(type)}
                        className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
                          selectedGestureType === type 
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${GESTURE_COLORS[type]}`} />
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'config' && (
                  <div className="space-y-4">
                    {/* Search Mode Toggle */}
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSearchMode ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}>
                          <Search className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">Modo Busca</div>
                          <div className="text-[10px] text-zinc-500">IA persiste até achar o objetivo</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsSearchMode(!isSearchMode)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${isSearchMode ? 'bg-blue-500' : 'bg-zinc-800'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isSearchMode ? 'translate-x-6' : ''}`} />
                      </button>
                    </div>

                    {isSearchMode && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Objetivo da Busca</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Ex: Baixar 30 fotos de carros antigos"
                            value={searchObjective}
                            onChange={(e) => setSearchObjective(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                          />
                          <button 
                            onClick={() => requestAIAction(`INICIAR MODO BUSCA: ${searchObjective}`)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-400 transition-colors"
                          >
                            Iniciar
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Free Mode Toggle */}
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isFreeMode ? 'bg-purple-500/10 text-purple-500' : 'bg-zinc-800 text-zinc-500'}`}>
                          <Brain className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">Modo Free</div>
                          <div className="text-[10px] text-zinc-500">IA explora o celular naturalmente</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsFreeMode(!isFreeMode)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${isFreeMode ? 'bg-purple-500' : 'bg-zinc-800'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isFreeMode ? 'translate-x-6' : ''}`} />
                      </button>
                    </div>

                    {isFreeMode && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Preferências / Memória</label>
                        <div className="flex flex-col gap-2">
                          <textarea 
                            rows={3}
                            placeholder="Descreva gostos e preferências do usuário..."
                            value={userPreferences}
                            onChange={(e) => setUserPreferences(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-purple-500 resize-none"
                          />
                          <button 
                            onClick={() => requestAIAction(`INICIAR EXPLORAÇÃO LIVRE: Baseado em minhas preferências: ${userPreferences}`)}
                            className="w-full py-2 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-400 transition-colors"
                          >
                            Iniciar Exploração
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {activeTab === 'downloads' && (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Arquivos ({generatedFiles.length})</span>
                      <button 
                        onClick={() => setGeneratedFiles([])}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Limpar Tudo
                      </button>
                    </div>
                    {generatedFiles.length === 0 ? (
                      <div className="text-center py-8 text-zinc-600 space-y-2">
                        <DownloadCloud className="w-8 h-8 mx-auto opacity-20" />
                        <p className="text-xs italic">Nenhum arquivo gerado ainda.</p>
                      </div>
                    ) : (
                      generatedFiles.map((file) => (
                        <div key={file.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-900 rounded-lg text-emerald-500">
                              {file.type.includes('PDF') ? <FileText className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold truncate max-w-[150px]">{file.name}</div>
                              <div className="text-[10px] text-zinc-500">{file.date}</div>
                            </div>
                          </div>
                          <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {aiChatHistory.length === 0 ? (
                      <div className="text-center py-8 text-zinc-600 space-y-2">
                        <History className="w-8 h-8 mx-auto opacity-20" />
                        <p className="text-xs italic">Nenhum histórico disponível.</p>
                      </div>
                    ) : (
                      aiChatHistory.map((msg, i) => (
                        <div key={i} className={`p-3 rounded-xl border ${msg.role === 'ai' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-950 border-zinc-800'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {msg.role === 'ai' ? <Brain className="w-3 h-3 text-emerald-500" /> : <Smartphone className="w-3 h-3 text-blue-500" />}
                            <span className="text-[10px] font-bold uppercase text-zinc-500">{msg.role === 'ai' ? 'IA' : 'Usuário'}</span>
                          </div>
                          <div className="text-xs text-zinc-300">{msg.text}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                <div className="text-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="text-2xl font-bold">{gestures.length}</div>
                  <div className="text-xs text-zinc-500 uppercase">Gestos</div>
                </div>
                <div className="text-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="text-2xl font-bold">1.5F</div>
                  <div className="text-xs text-zinc-500 uppercase">Modelo IA</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6 backdrop-blur-sm">
              <div className="space-y-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5 text-blue-500" />
                  Configuração do Dispositivo Real
                </h2>
                <p className="text-sm text-zinc-400">
                  Para funcionar no seu celular, o AI Gesture Agent precisa de permissões especiais do sistema Android.
                </p>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Checklist de Permissões</label>
                
                <div className="space-y-2">
                  {[
                    { id: 'overlay', label: 'Sobreposição de Tela', desc: 'Permite que o sidebar apareça sobre outros apps.' },
                    { id: 'accessibility', label: 'Serviço de Acessibilidade', desc: 'Necessário para simular toques e gestos reais.' },
                    { id: 'audio', label: 'Gravação de Áudio', desc: 'Usado para os comandos de voz da IA.' },
                    { id: 'internet', label: 'Acesso à Internet', desc: 'Para comunicação com o modelo Gemini.' },
                  ].map((perm) => (
                    <div 
                      key={perm.id}
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                        permissions[perm.id as keyof typeof permissions] 
                        ? 'bg-blue-500/5 border-blue-500/30' 
                        : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-bold text-sm ${permissions[perm.id as keyof typeof permissions] ? 'text-blue-400' : 'text-zinc-300'}`}>
                          {perm.label}
                        </span>
                        <span className="text-xs text-zinc-500">{perm.desc}</span>
                      </div>
                      <button 
                        onClick={() => togglePermission(perm.id as keyof typeof permissions)}
                        className={`p-2 rounded-lg transition-all ${
                          permissions[perm.id as keyof typeof permissions]
                          ? 'text-blue-500'
                          : 'text-zinc-700 hover:text-zinc-500'
                        }`}
                      >
                        {permissions[perm.id as keyof typeof permissions] ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                disabled={!allPermissionsGranted}
                onClick={() => setIsServiceActive(true)}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  allPermissionsGranted 
                  ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/20' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Power className="w-5 h-5" />
                Vincular e Iniciar no Celular
              </button>

              {!allPermissionsGranted && (
                <p className="text-center text-xs text-zinc-600 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Conceda todas as permissões para continuar
                </p>
              )}

              {/* Android Studio / APK Tips */}
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Dicas para Android Studio (APK)</span>
                </div>
                <ul className="text-[10px] text-zinc-400 space-y-2 list-disc pl-4">
                  <li>Certifique-se de que o <code className="text-blue-300">AndroidManifest.xml</code> inclui <code className="text-blue-300">SYSTEM_ALERT_WINDOW</code>.</li>
                  <li>O serviço de acessibilidade deve ser declarado como um <code className="text-blue-300">AccessibilityService</code> no XML.</li>
                  <li>Em dispositivos Android 10+, a permissão de sobreposição deve ser solicitada via Intent explícita.</li>
                  <li>Teste o "Modo Real" abaixo para verificar a lógica de interface flutuante.</li>
                </ul>
                <button 
                  onClick={() => setShowOverlaySimulation(!showOverlaySimulation)}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-bold transition-colors"
                >
                  {showOverlaySimulation ? 'Ocultar Simulação de Sobreposição' : 'Testar Simulação de Sobreposição'}
                </button>
              </div>
            </div>
          )}

          {/* AI Feedback Toast */}
          <AnimatePresence>
            {aiStatus && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-4 bg-emerald-500 text-black rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-emerald-500/20"
              >
                <Brain className="w-5 h-5" />
                {aiStatus}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Phone Simulator */}
        <div className="relative flex justify-center">
          {/* Phone Frame */}
          <div 
            ref={phoneRef}
            onClick={handleScreenClick}
            className={`relative w-[320px] h-[640px] bg-zinc-900 rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden transition-all ${
              isEditing ? 'ring-4 ring-emerald-500/50' : ''
            } ${appMode === 'real' ? 'border-blue-900/50' : 'border-zinc-800'}`}
          >
            {/* Screen Content (Mock) */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-950 flex flex-col overflow-hidden">
              {appMode === 'real' && isServiceActive ? (
                <div className="absolute inset-0 bg-blue-950/20 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center space-y-4 z-10">
                  <div className="p-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30">
                    <Smartphone className="w-12 h-12 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Dispositivo Vinculado</h3>
                    <p className="text-sm text-blue-200/70">
                      O AI Gesture Agent está rodando no seu celular real. Use o sidebar flutuante no dispositivo.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    CONEXÃO ATIVA
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Status Bar */}
                  <div className="h-6 bg-black/20 flex items-center justify-between px-6 text-[10px] font-bold text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span>15:48</span>
                      {isSearchMode && (
                        <div className="flex items-center gap-1 text-blue-400 animate-pulse">
                          <Search className="w-2 h-2" />
                          <span className="text-[8px]">BUSCA ATIVA</span>
                        </div>
                      )}
                      {isFreeMode && (
                        <div className="flex items-center gap-1 text-purple-400 animate-pulse">
                          <Brain className="w-2 h-2" />
                          <span className="text-[8px]">MODO FREE</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-2 bg-zinc-600 rounded-sm" />
                      <span>85%</span>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="flex-1 relative overflow-hidden">
                    {/* Floating Overlay Simulation (Real Mode) */}
                    {appMode === 'real' && showOverlaySimulation && (
                      <motion.div 
                        drag
                        dragConstraints={phoneRef}
                        initial={{ x: 250, y: 100 }}
                        className="absolute z-[110] w-12 h-12 bg-blue-500 rounded-full shadow-lg flex items-center justify-center cursor-move border-2 border-white/20"
                      >
                        <Brain className="w-6 h-6 text-white" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 animate-pulse" />
                      </motion.div>
                    )}

                    {/* Notifications Overlay */}
                    <div className="absolute top-2 left-0 right-0 z-[100] px-2 space-y-2 pointer-events-none">
                      <AnimatePresence>
                        {notifications.map((notif) => (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, y: -50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-3 shadow-2xl flex items-start gap-3 pointer-events-auto"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              {notif.icon || <AlertCircle className="w-5 h-5 text-emerald-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-bold text-white truncate">{notif.title}</div>
                              <div className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">{notif.body}</div>
                            </div>
                            <button 
                              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                              className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                              <X className="w-3 h-3 text-zinc-500" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {currentApp === 'home' && (
                      <motion.div 
                        drag="x"
                        dragConstraints={{ left: -640, right: 0 }}
                        onDragEnd={(_, info) => {
                          if (info.offset.x < -50 && homePage < 2) setHomePage(prev => prev + 1);
                          if (info.offset.x > 50 && homePage > 0) setHomePage(prev => prev - 1);
                        }}
                        animate={{ x: -homePage * 320 }}
                        className="flex h-full w-[960px]"
                      >
                        {/* Page 1 */}
                        <div className="w-[320px] p-6 grid grid-cols-3 gap-6 content-start">
                          <AppIcon icon={<Monitor />} label="Social" color="from-blue-500 to-indigo-600" onClick={() => setCurrentApp('social')} />
                          <AppIcon icon={<MessageSquare />} label="Chat" color="from-emerald-500 to-teal-600" onClick={() => setCurrentApp('chat')} />
                          <AppIcon icon={<Settings />} label="Settings" color="from-zinc-600 to-zinc-800" onClick={() => setCurrentApp('settings')} />
                        </div>
                        {/* Page 2 */}
                        <div className="w-[320px] p-6 grid grid-cols-3 gap-6 content-start">
                          <AppIcon icon={<Play />} label="Music" color="from-pink-500 to-rose-600" onClick={() => setCurrentApp('music')} />
                          <AppIcon icon={<Smartphone />} label="Maps" color="from-orange-500 to-amber-600" onClick={() => setCurrentApp('maps')} />
                          <AppIcon icon={<Brain />} label="Health" color="from-emerald-400 to-cyan-500" onClick={() => setCurrentApp('health')} />
                        </div>
                        {/* Page 3 */}
                        <div className="w-[320px] p-6 grid grid-cols-3 gap-6 content-start">
                          <AppIcon icon={<Eye />} label="Gallery" color="from-purple-500 to-violet-600" onClick={() => setCurrentApp('gallery')} />
                          <AppIcon icon={<Monitor />} label="Browser" color="from-blue-400 to-blue-600" onClick={() => setCurrentApp('browser')} />
                          {installedApps.map((app, i) => (
                            <AppIcon 
                              key={i} 
                              icon={<Smartphone />} 
                              label={app} 
                              color="from-zinc-400 to-zinc-600" 
                              onClick={() => setAiStatus(`Abrindo ${app}...`)} 
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {currentApp === 'browser' && (
                      <div className="flex flex-col h-full bg-white">
                        <div className="p-3 bg-zinc-100 flex items-center gap-2 border-b border-zinc-200">
                          <div className="flex-1 bg-white rounded-full px-4 py-1.5 text-[10px] text-zinc-500 flex items-center gap-2 border border-zinc-200 overflow-hidden">
                            <Smartphone className="w-3 h-3 flex-shrink-0" />
                            <input 
                              type="text" 
                              value={browserUrl}
                              onChange={(e) => setBrowserUrl(e.target.value)}
                              className="flex-1 bg-transparent outline-none text-black"
                            />
                          </div>
                          <button 
                            onClick={() => {
                              setIsBrowserLoading(true);
                              setTimeout(() => setIsBrowserLoading(false), 1500);
                            }}
                            className="p-1.5 bg-blue-500 rounded-full text-white active:scale-90 transition-transform"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6 overflow-y-auto">
                          {isBrowserLoading ? (
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <div className="text-4xl font-black tracking-tighter">
                                <span className="text-blue-500">G</span>
                                <span className="text-red-500">o</span>
                                <span className="text-yellow-500">o</span>
                                <span className="text-blue-500">g</span>
                                <span className="text-emerald-500">l</span>
                                <span className="text-red-500">e</span>
                              </div>
                              <div className="w-full space-y-4">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className="space-y-1">
                                    <div className="h-3 w-3/4 bg-zinc-100 rounded" />
                                    <div className="h-2 w-full bg-zinc-50 rounded" />
                                    <div className="h-2 w-1/2 bg-zinc-50 rounded" />
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {currentApp === 'music' && (
                      <div className="flex flex-col h-full bg-zinc-950 text-white p-6 items-center justify-center space-y-8">
                        <div className="w-48 h-48 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl shadow-2xl flex items-center justify-center animate-pulse">
                          <Play className="w-20 h-20 text-white" />
                        </div>
                        <div className="text-center">
                          <h3 className="font-bold text-lg">AI Symphony</h3>
                          <p className="text-zinc-500 text-sm">Generative Beats</p>
                        </div>
                        <div className="w-full space-y-2">
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-pink-500" />
                          </div>
                          <div className="flex justify-between text-[10px] text-zinc-500">
                            <span>1:20</span>
                            <span>3:45</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <button 
                            onClick={() => setAiStatus('Música Anterior')}
                            className="text-zinc-400 hover:text-white active:scale-90 transition-transform"
                          >
                            <ChevronRight className="w-6 h-6 rotate-180" />
                          </button>
                          <button 
                            onClick={() => setMusicPlaying(!musicPlaying)}
                            className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black active:scale-90 transition-transform"
                          >
                            {musicPlaying ? <X className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                          </button>
                          <button 
                            onClick={() => setAiStatus('Próxima Música')}
                            className="text-zinc-400 hover:text-white active:scale-90 transition-transform"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    )}

                    {currentApp === 'maps' && (
                      <div className="flex flex-col h-full bg-zinc-100">
                        <div className="p-3 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex gap-2 z-10">
                          <input type="text" placeholder="Buscar no mapa..." className="flex-1 bg-zinc-100 border-none rounded-lg px-4 py-2 text-xs" />
                        </div>
                        <div className="flex-1 bg-[url('https://picsum.photos/seed/map/600/1200')] bg-cover relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-bounce" />
                          </div>
                          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                            <button 
                              onClick={() => setAiStatus('Zoom In')}
                              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center font-bold text-lg active:scale-90 transition-transform"
                            >
                              +
                            </button>
                            <button 
                              onClick={() => setAiStatus('Zoom Out')}
                              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center font-bold text-lg active:scale-90 transition-transform"
                            >
                              -
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentApp === 'health' && (
                      <div className="flex flex-col h-full bg-zinc-50 p-6 space-y-6">
                        <h3 className="text-black font-bold text-xl">Atividade</h3>
                        <div className="aspect-square bg-white rounded-3xl shadow-sm border border-zinc-100 flex items-center justify-center relative">
                          <svg className="w-40 h-40 -rotate-90">
                            <circle cx="80" cy="80" r="70" fill="none" stroke="#f4f4f5" strokeWidth="12" />
                            <circle cx="80" cy="80" r="70" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="440" strokeDashoffset="120" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-zinc-900">{healthSteps}</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Passos</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                            <div className="text-[10px] text-zinc-400 font-bold uppercase">Calorias</div>
                            <div className="text-lg font-bold text-orange-500">420 kcal</div>
                          </div>
                          <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                            <div className="text-[10px] text-zinc-400 font-bold uppercase">Tempo</div>
                            <div className="text-lg font-bold text-blue-500">45 min</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setAiStatus('Treino iniciado!')}
                          className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95"
                        >
                          Iniciar Treino
                        </button>
                      </div>
                    )}

                    {currentApp === 'gallery' && (
                      <div className="flex flex-col h-full bg-black">
                        <div className="p-4 flex justify-between items-center text-white">
                          <span className="font-bold">Fotos</span>
                          <Settings className="w-4 h-4" />
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-1 p-1 overflow-y-auto">
                          {[...Array(12)].map((_, i) => (
                            <div 
                              key={i} 
                              onClick={() => setAiStatus(`Foto ${i + 1} aberta`)}
                              className="aspect-square bg-zinc-800 overflow-hidden active:opacity-50 transition-opacity cursor-pointer"
                            >
                              <img 
                                src={`https://picsum.photos/seed/gallery-${i}/200/200`} 
                                alt="Gallery" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentApp === 'social' && (
                      <div className="flex flex-col h-full bg-zinc-900">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                          <span className="font-bold text-sm">SocialApp</span>
                          <button 
                            onClick={() => setAiStatus('Novo Post criado!')}
                            className="p-1 hover:bg-zinc-800 rounded-lg active:scale-90 transition-transform"
                          >
                            <Plus className="w-4 h-4 text-emerald-500" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {[1, 2].map(id => (
                            <div key={id} className="bg-zinc-800 rounded-xl p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-zinc-700 rounded-full" />
                                <div className="h-2 w-20 bg-zinc-700 rounded-full" />
                              </div>
                              <div className="h-24 bg-zinc-700/50 rounded-lg" />
                              <div className="flex gap-4">
                                <button 
                                  onClick={() => setSocialLikes(prev => ({...prev, [id]: !prev[id]}))}
                                  className={`text-xs font-bold ${socialLikes[id] ? 'text-red-500' : 'text-zinc-500'}`}
                                >
                                  {socialLikes[id] ? 'Curtido' : 'Curtir'}
                                </button>
                                <span className="text-xs text-zinc-500 font-bold">Comentar</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentApp === 'chat' && (
                      <div className="flex flex-col h-full bg-zinc-950">
                        <div className="p-4 bg-emerald-600 text-white font-bold text-sm">Messenger</div>
                        <div className="flex-1 p-4 space-y-4">
                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`max-w-[80%] p-3 rounded-2xl text-xs ${i % 2 === 0 ? 'bg-zinc-800 self-start' : 'bg-emerald-600 text-white self-end ml-auto'}`}>
                              <div className="font-bold mb-1 opacity-70">{msg.sender}</div>
                              {msg.text}
                            </div>
                          ))}
                        </div>
                        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Mensagem..." 
                            value={appChatInput}
                            onChange={(e) => setAppChatInput(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-4 py-2 text-[10px] focus:outline-none text-white" 
                          />
                          <button 
                            onClick={() => {
                              if (!appChatInput.trim()) return;
                              setChatMessages(prev => [...prev, { sender: 'Você', text: appChatInput }]);
                              setAppChatInput('');
                            }}
                            className="p-2 bg-emerald-500 rounded-full active:scale-90 transition-transform"
                          >
                            <Send className="w-3 h-3 text-black" />
                          </button>
                        </div>
                      </div>
                    )}

                    {currentApp === 'settings' && (
                      <div className="flex flex-col h-full bg-zinc-100 text-black">
                        <div className="p-4 border-b border-zinc-200 font-bold">Settings</div>
                        <div className="p-4 space-y-4">
                          {[
                            { id: 'darkMode', label: 'Modo Escuro', active: appSettings.darkMode },
                            { id: 'notifications', label: 'Notificações', active: appSettings.notifications },
                            { id: 'sync', label: 'Sincronização', active: appSettings.sync }
                          ].map((item) => (
                            <div 
                              key={item.id} 
                              onClick={() => setAppSettings(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof appSettings] }))}
                              className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer active:scale-95 transition-transform"
                            >
                              <span className="text-xs font-medium">{item.label}</span>
                              <div className={`w-10 h-5 rounded-full p-1 transition-colors ${item.active ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${item.active ? 'translate-x-5' : ''}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Bar */}
                  <div className="h-12 bg-black/40 flex items-center justify-around px-10">
                    <button onClick={() => setCurrentApp('home')} className="w-3 h-3 border-2 border-zinc-500 rounded-sm" />
                    <div className="w-3 h-3 bg-zinc-500 rounded-full" />
                    <button onClick={() => setCurrentApp('home')} className="flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-zinc-500 rotate-180" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Indicators */}
            {currentApp === 'home' && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${homePage === i ? 'bg-white w-4' : 'bg-white/30'}`} />
                ))}
              </div>
            )}

            {/* Gesture Markers */}
            <AnimatePresence>
              {showMarkers && appMode === 'simulated' && gestures.map((g) => (
                <motion.div
                  key={g.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  style={{ left: g.x - 16, top: g.y - 16 }}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-white/20 ${g.color}`}
                >
                  {g.id}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Floating Sidebar Overlay */}
            <AnimatePresence>
              {isServiceActive && isSidebarOpen && (
                <motion.div 
                  initial={{ x: 100 }}
                  animate={{ x: 0 }}
                  exit={{ x: 100 }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-2xl p-2 flex flex-col gap-3 shadow-2xl z-50"
                >
                  <button onClick={executeGestures} className="p-2 hover:bg-emerald-500 hover:text-black rounded-xl transition-all" title="Executar">
                    <Play className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-emerald-500 text-black' : 'hover:bg-zinc-800'}`}
                    title="Adicionar Gesto"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={startVoiceCommand} 
                    className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'hover:bg-zinc-800'}`}
                    title="Comando de Voz"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsChatOpen(true)} 
                    className="p-2 hover:bg-zinc-800 rounded-xl transition-all" 
                    title="Pedir por Texto"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button onClick={() => requestAIAction('Analise a tela e sugira uma ação')} className="p-2 hover:bg-zinc-800 rounded-xl transition-all" title="Pedir Ação IA">
                    <Brain className="w-5 h-5" />
                  </button>
                  <button onClick={() => setShowMarkers(!showMarkers)} className="p-2 hover:bg-zinc-800 rounded-xl transition-all" title="Mostrar/Esconder Pontos">
                    {showMarkers ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <div className="h-px bg-zinc-800 mx-2" />
                  <button onClick={() => setGestures([])} className="p-2 hover:bg-red-500/20 text-red-500 rounded-xl transition-all" title="Limpar">
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sidebar Toggle Handle */}
            {isServiceActive && !isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-20 bg-zinc-800 rounded-l-lg border-y border-l border-zinc-700 flex items-center justify-center"
              >
                <div className="w-1 h-8 bg-zinc-600 rounded-full" />
              </button>
            )}
          </div>

          {/* Voice Transcript Overlay */}
          <AnimatePresence>
            {transcript && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[280px] bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-700 text-center z-[60]"
              >
                <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Comando de Voz</div>
                <div className="text-emerald-400 font-medium italic">"{transcript}"</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Request Modal */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <MessageSquare className="w-5 h-5" />
                      <span className="font-bold">Pedir para IA</span>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col h-[400px]">
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                      {aiChatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
                          <Brain className="w-12 h-12 opacity-20" />
                          <p className="text-sm">Como posso ajudar você hoje?</p>
                        </div>
                      ) : (
                        aiChatHistory.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                              msg.role === 'user' 
                              ? 'bg-emerald-500 text-black rounded-tr-none' 
                              : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleChatSubmit} className="space-y-4">
                      <div className="relative">
                        <textarea 
                          autoFocus
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ex: 'Abra o Instagram e role 3 vezes'"
                          className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                        />
                        <button 
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="absolute right-3 bottom-3 p-2 bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black rounded-xl hover:bg-emerald-400 transition-all"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="max-w-6xl mx-auto p-8 mt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-sm">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          <span>Simulador de Ambiente Android v1.0</span>
          <button 
            onClick={() => {
              addNotification("Download Iniciado", "O projeto completo está sendo compactado em .zip", <Archive className="w-5 h-5 text-blue-500" />);
              
              // Simulate actual file download
              setTimeout(() => {
                const dummyContent = "Este é um arquivo de simulação do projeto AI Gesture Agent.";
                const blob = new Blob([dummyContent], { type: 'application/zip' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'ai_gesture_agent_project.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                addNotification("Download Concluído", "ai_gesture_agent_project.zip pronto para uso.", <CheckCircle2 className="w-5 h-5 text-emerald-500" />);
              }, 2000);
            }}
            className="ml-2 p-1 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
            title="Download Projeto Completo (.zip)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-zinc-300 transition-colors">Documentação</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Código Fonte Kotlin</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacidade</a>
        </div>
      </footer>
    </div>
  );
}

interface AppIconProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

const AppIcon: React.FC<AppIconProps> = ({ icon, label, color, onClick }) => {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
      <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-7 h-7 text-white" })}
      </div>
      <span className="text-[10px] font-medium text-zinc-300">{label}</span>
    </button>
  );
};
