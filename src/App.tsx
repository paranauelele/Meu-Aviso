import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Bell, Clock, MapPin, Sun, ChevronRight, 
  Plus, Trash2, Zap, Moon, Volume2
} from 'lucide-react'
import { GoogleGenAI } from '@google/genai'

interface Reminder {
  id: string
  text: string
  label: string
  time: string
  date: string
  location?: string
  createdAt: number
}

interface Alarm {
  id: string
  time: string
  label: string
  isActive: boolean
}

const aiService = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })

async function extractReminder(text: string) {
  try {
    const response = await aiService.models.generateContent({
      model: 'gemini-1.5-flash',
      config: {
        systemInstruction: "Você é um assistente. Extraia informações do texto e retorne APENAS um JSON: { label: string, date: 'YYYY-MM-DD', time: 'HH:mm', location: string }. Se a data for relativa, calcule a data real.",
      },
      contents: text,
    })
    const jsonStr = response.text.replace(/```json|```/g, '').trim()
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error(e)
    return null
  }
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-3 transition-all ${active ? 'text-[#bf953f]' : 'text-gray-500'}`}
    >
      <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''}`} />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  )
}

function GlassCard({ children, className = '' }: any) {
  return (
    <div className={`bg-[#0f172a]/60 backdrop-blur-xl border border-[#bf953f]/20 rounded-2xl p-4 shadow-xl ${className}`}>
      {children}
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'reminders' | 'alarm' | 'weather'>('reminders')
  const [inputText, setInputText] = useState('')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(false)
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [alarmTime, setAlarmTime] = useState('08:00')
  const [alarmLabel, setAlarmLabel] = useState('Acordar')

  useEffect(() => {
    const savedReminders = localStorage.getItem('reminders')
    if (savedReminders) setReminders(JSON.parse(savedReminders))
    const savedAlarms = localStorage.getItem('alarms')
    if (savedAlarms) setAlarms(JSON.parse(savedAlarms))
  }, [])

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders))
  }, [reminders])

  useEffect(() => {
    localStorage.setItem('alarms', JSON.stringify(alarms))
  }, [alarms])

  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      alarms.forEach(alarm => {
        if (alarm.isActive && alarm.time === currentTime && now.getSeconds() < 2) {
          if (Notification.permission === 'granted') {
            new Notification("⏰ DESPERTADOR", { body: alarm.label })
          } else {
            alert(`⏰ ALARME: ${alarm.label}`)
          }
        }
      })
    }
    const interval = setInterval(checkAlarms, 1000)
    return () => clearInterval(interval)
  }, [alarms])

  const handleAddReminder = async () => {
    if (!inputText.trim()) return
    setLoading(true)
    const result = await extractReminder(inputText)
    if (result) {
      setReminders(prev => [{
        id: Date.now().toString(),
        text: inputText,
        label: result.label || 'Lembrete',
        time: result.time || '09:00',
        date: result.date || new Date().toISOString().split('T')[0],
        location: result.location,
        createdAt: Date.now()
      }, ...prev])
    }
    setInputText('')
    setLoading(false)
  }

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  const toggleAlarm = (id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))
  }

  const addAlarm = () => {
    setAlarms(prev => [...prev, {
      id: Date.now().toString(),
      time: alarmTime,
      label: alarmLabel,
      isActive: true
    }])
  }

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-[#020617] to-[#0f172a] font-sans text-white">
      <header className="p-6 pt-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#bf953f] bg-clip-text text-transparent uppercase italic">
            Meu Aviso
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#bf953f]/20 flex items-center justify-center border border-[#bf953f]/40">
          <Zap className="w-5 h-5 text-[#bf953f]" />
        </div>
      </header>

      <main className="px-4 space-y-6">
        {activeTab === 'reminders' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <GlassCard className="space-y-4">
              <label className="text-[#bf953f] font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4" /> Diga o que precisa
              </label>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ex: Sexta às 14h dentista no centro..."
                className="w-full bg-black/40 border border-[#334155] rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#bf953f] transition-colors resize-none h-24"
              />
              <button 
                onClick={handleAddReminder}
                disabled={loading || !inputText}
                className="w-full bg-gradient-to-r from-[#bf953f] to-[#aa771c] py-4 rounded-xl text-black font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
              >
                {loading ? 'Processando...' : <>Adicionar Aviso <ChevronRight className="w-5 h-5" /></>}
              </button>
            </GlassCard>

            <div className="space-y-3">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest px-2">Seus Avisos</h3>
              {reminders.map(r => (
                <GlassCard key={r.id} className="relative group overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#bf953f]" />
                  <div className="flex justify-between items-start gap-4 pl-3">
                    <div>
                      <h4 className="font-bold text-lg leading-tight">{r.label}</h4>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-1">{r.text}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-[#bf953f] font-bold">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.location || 'Local não definido'}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteReminder(r.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </GlassCard>
              ))}
              {reminders.length === 0 && (
                <div className="text-center py-10 text-gray-600">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhum aviso agendado.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'alarm' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <GlassCard className="space-y-4">
              <div className="flex gap-3">
                <input 
                  type="time" 
                  value={alarmTime}
                  onChange={(e) => setAlarmTime(e.target.value)}
                  className="flex-1 bg-black/40 border border-[#334155] rounded-xl px-4 text-center text-xl font-bold text-[#bf953f] focus:outline-none"
                />
                <input 
                  type="text" 
                  value={alarmLabel}
                  onChange={(e) => setAlarmLabel(e.target.value)}
                  placeholder="Rótulo"
                  className="flex-[2] bg-black/40 border border-[#334155] rounded-xl px-4 text-sm font-bold text-white focus:outline-none"
                />
              </div>
              <button onClick={addAlarm} className="w-full py-3 rounded-xl border border-[#bf953f]/50 text-[#bf953f] font-bold uppercase text-sm hover:bg-[#bf953f]/10 transition-colors">
                Adicionar Alarme
              </button>
            </GlassCard>

            <div className="space-y-3">
              {alarms.map(a => (
                <GlassCard key={a.id} className={`flex justify-between items-center ${!a.isActive ? 'opacity-50 grayscale' : ''}`}>
                  <div>
                    <div className="text-3xl font-black text-[#fcf6ba]">{a.time}</div>
                    <div className="text-xs text-gray-400 font-bold uppercase">{a.label}</div>
                  </div>
                  <button onClick={() => toggleAlarm(a.id)} className={`w-12 h-7 rounded-full transition-colors relative ${a.isActive ? 'bg-[#bf953f]' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${a.isActive ? 'left-6' : 'left-1'}`} />
                  </button>
                </GlassCard>
              ))}
              {alarms.length === 0 && (
                <div className="text-center py-10 text-gray-600">
                  <Moon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhum alarme configurado.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'weather' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <GlassCard className="text-center py-10 space-y-4">
              <Sun className="w-16 h-16 text-[#bf953f] mx-auto animate-pulse" />
              <h2 className="text-5xl font-black text-white">24°</h2>
              <p className="text-xl text-[#fcf6ba] font-bold">Ensolarado</p>
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4" /> São Paulo
              </div>
            </GlassCard>
          </motion.div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#020617]/90 backdrop-blur-xl border-t border-[#334155] pb-6 pt-2 px-6 z-50">
        <div className="flex justify-between max-w-md mx-auto">
          <TabButton active={activeTab === 'reminders'} onClick={() => setActiveTab('reminders')} icon={Bell} label="Avisos" />
          <TabButton active={activeTab === 'alarm'} onClick={() => setActiveTab('alarm')} icon={Clock} label="Alarme" />
          <TabButton active={activeTab === 'weather'} onClick={() => setActiveTab('weather')} icon={Sun} label="Clima" />
        </div>
      </nav>
    </div>
  )
}
