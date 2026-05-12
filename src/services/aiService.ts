import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
});

export const extractEntities = async (text: string) => {
  const now = new Date();
  const nowFormatted = now.toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const prompt = `
Você é um assistente pessoal inteligente que interpreta mensagens em português brasileiro com linguagem natural.
Data e hora atual: ${nowFormatted}
ISO atual: ${now.toISOString()}

Analise o texto e extraia informações para criar um aviso pessoal.
Retorne APENAS JSON puro, sem marcações de código, sem explicações.

REGRAS DE TIPO:
- "saude": médico, consulta, remédio, exame, hospital, dentista, vacina
- "compras": comprar, mercado, supermercado, loja, pagar
- "trabalho": reunião, meeting, apresentação, entrega, deadline, projeto, cliente
- "clima": chuva, tempestade, frio, calor, vento, neblina
- "transito": trânsito, engarrafamento, acidente, rodovia, congestionamento
- "lembrete": qualquer outro lembrete, tarefa, compromisso pessoal

ÍCONE POR TIPO:
- saude → "Heart"
- compras → "ShoppingCart"
- trabalho → "Briefcase"
- clima → "CloudRain"
- transito → "Car"
- lembrete → "Bell"

SEVERIDADE:
- "high": urgente, médico, deadline, não pode esquecer
- "medium": hoje, amanhã, próximas horas
- "low": sem data, informativo

INTERPRETAÇÃO DE TEMPO (use a data/hora atual como base):
- "daqui uma hora" = agora + 1h
- "daqui 30 minutos" = agora + 30min
- "amanhã às 10h" = amanhã 10:00
- "hoje à tarde" = hoje 15:00
- "hoje à noite" = hoje 20:00
- "hoje de manhã" = hoje 09:00
- "dia 15" = dia 15 do mês atual (ou próximo mês se já passou)
- "semana que vem" = próxima segunda-feira
- Sem tempo → dateTime: null

FORMATO DE RETORNO:
{
  "type": "saude|compras|trabalho|clima|transito|lembrete",
  "icon": "Heart|ShoppingCart|Briefcase|CloudRain|Car|Bell",
  "title": "título curto direto máximo 5 palavras",
  "description": "descrição clara e completa",
  "severity": "low|medium|high",
  "dateTime": "ISO 8601 string ou null",
  "hasTime": true ou false
}

Texto: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    let raw = response.text?.trim() || '';
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erro na IA:', error);
    return null;
  }
};

export default ai;
