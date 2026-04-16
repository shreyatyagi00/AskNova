import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSelector, useDispatch } from 'react-redux'
import { useChat } from '../hooks/useChat'

const Dashboard = () => {

  const dispatch = useDispatch()
  const chat = useChat()

  const [chatInput, setChatInput] = useState('')
  const [isListening, setIsListening] = useState(false)

  const chats = useSelector((state) => state.chat.chats)
  const currentChatId = useSelector((state) => state.chat.currentChatId)
  const isLoading = useSelector((state) => state.chat.isLoading)

  const bottomRef = useRef(null)
  const hasRestoredRef = useRef(false)

  useEffect(() => {
    chat.initializeSocketConnection()
    chat.handleGetChats()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats, currentChatId])

  useEffect(() => {
    if (currentChatId && chats[currentChatId]?.messages.length === 0) {
      chat.handleOpenChat(currentChatId, chats)
    }
  }, [currentChatId])

  useEffect(() => {
    if (!Object.keys(chats).length) return
    if (hasRestoredRef.current) return

    const savedChatId = localStorage.getItem("lastChatId")

    if (savedChatId && chats[savedChatId]) {
      chat.handleOpenChat(savedChatId, chats)
    } else {
      const firstChatId = Object.keys(chats)[0]
      if (firstChatId) chat.handleOpenChat(firstChatId, chats)
    }

    hasRestoredRef.current = true
  }, [chats])

  const handleSubmitMessage = (e) => {
    e.preventDefault()
    const trimmed = chatInput.trim()
    if (!trimmed) return

    chat.handleSendMessage({
      message: trimmed,
      chatId: currentChatId
    })

    setChatInput('')
  }

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) return

    const recognition = new window.webkitSpeechRecognition()
    recognition.lang = "en-US"

    recognition.start()
    setIsListening(true)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setChatInput((prev) => prev + " " + transcript)
    }

    recognition.onend = () => setIsListening(false)
  }

  const openChat = (chatId) => {
    localStorage.setItem("lastChatId", chatId)
    chat.handleOpenChat(chatId, chats)
  }

  const handleNewChat = () => {
    hasRestoredRef.current = false
    chat.handleCreateChat()
    localStorage.removeItem("lastChatId")
    setChatInput('')
  }

  return (
    <main className="h-screen overflow-hidden bg-[#05070d] text-white flex">

      {/* SIDEBAR */}
      <aside className="w-72 h-full overflow-y-auto p-4 rounded-r-2xl 
        bg-gradient-to-b from-[#0a1a3a] via-[#07122a] to-[#05070d]
        border-r border-blue-900/30">

        <h1 className="text-2xl font-semibold text-blue-400 text-center mb-4">
          AutoNova
        </h1>

        <button
          onClick={handleNewChat}
          className="w-full mb-4 py-2 rounded-xl 
          bg-blue-500/20 hover:bg-blue-500/30 transition"
        >
          + New Chat
        </button>

        <div className="space-y-2">
          {Object.values(chats)
            .slice()
            .reverse()
            .map((chatItem, index, arr) => (
              <div key={chatItem.id} className="relative group">

                <button
                  onClick={() => openChat(chatItem.id)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-500/20 transition"
                >
                  {chatItem.title || "New Chat"}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const prevChat = arr[index + 1]
                    const prevChatId = prevChat?.id || null
                    chat.handleDeleteChat(chatItem.id, prevChatId)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 
                             opacity-0 group-hover:opacity-100 
                             text-red-400 hover:text-red-600 transition text-sm"
                >
                  🗑
                </button>

              </div>
            ))}
        </div>
      </aside>

      {/* MAIN */}
      <section className="flex-1 flex flex-col max-w-4xl mx-auto relative">

        <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32 chat-scroll">

          {/* ✅ EMPTY STATE */}
          {!currentChatId || !chats[currentChatId]?.messages.length ? (
            <div className="h-full flex items-start justify-center text-center pt-32">
              <div>
                <h2 className="text-xl font-semibold text-gray-500 mb-2">
                   Ask anything✨
                </h2>
                <p className="text-gray-500">
                  AI will answer it like a pro 
                </p>
              </div>
            </div>
          ) : (
            chats[currentChatId]?.messages.map((message, index) => (
              <div key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-[#0f172a] text-gray-200 border border-gray-700"
                }`}>
                  {message.role === "user" ? (
                    <p>{message.content}</p>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && <p className="text-gray-400">Thinking...</p>}
          <div ref={bottomRef} />
        </div>

        <footer className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-3xl">
          <form onSubmit={handleSubmitMessage}
            className="flex items-center gap-3 bg-gradient-to-r from-[#0a1a3a] to-[#07122a]
            border border-blue-900/40 rounded-full px-5 py-3 shadow-lg backdrop-blur">

            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent outline-none text-sm"
            />

            <button type="button" onClick={handleVoiceInput}>🎤</button>
            <button type="submit" className="bg-blue-600 px-4 py-2 rounded-full">➤</button>

          </form>
        </footer>

      </section>
    </main>
  )
}

export default Dashboard