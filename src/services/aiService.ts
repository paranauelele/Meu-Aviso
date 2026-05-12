import { GoogleGenAI } from '@google/genai'

const aiService = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })

export async function extractReminder(text: string) {
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

export default aiService
