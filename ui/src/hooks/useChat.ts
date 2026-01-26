import { useState, useCallback } from 'react'
import { Message } from '../types'
import { askQuestion } from '../services/api'

// Generate unique IDs for messages
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Initial welcome message
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  type: 'bot',
  text: "Welcome to Insight AI. I'm ready to analyze your documents and provide evidence-based answers. What would you like to know?",
  timestamp: new Date()
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (question: string) => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      type: 'user',
      text: trimmedQuestion,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await askQuestion(trimmedQuestion)

      // Add bot response
      const botMessage: Message = {
        id: generateId(),
        type: 'bot',
        text: response.answer,
        confidence: response.confidence,
        sources: response.sources,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        type: 'bot',
        text: 'Unable to connect to the analysis server. Please ensure the backend service is running and try again.',
        confidence: 1,
        sources: [],
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  return { messages, isLoading, sendMessage }
}
