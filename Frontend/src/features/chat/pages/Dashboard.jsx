import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useSelector } from 'react-redux'
import { useChat } from '../hooks/useChat'
import remarkGfm from 'remark-gfm'

const Dashboard = () => {
  const chat = useChat()
  const [chatInput, setChatInput] = useState('')

  const chats = useSelector((state) => state.chat.chats)
  const currentChatId = useSelector((state) => state.chat.currentChatId)
  const isLoading = useSelector((state) => state.chat.isLoading)

  const bottomRef = useRef(null)

  useEffect(() => {
    chat.initializeSocketConnection()
    chat.handleGetChats()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats, currentChatId])

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

  const openChat = (chatId) => {
    chat.handleOpenChat(chatId, chats)
  }

  const handleNewChat = () => {
    chat.handleCreateChat()
    setChatInput('')
  }

  return (
    <main className="h-screen overflow-hidden bg-[#07090f] text-white p-3 md:p-5">
      <section className="mx-auto flex h-full max-w-7xl gap-4">

        {/* SIDEBAR */}
        <aside className="hidden md:flex w-72 flex-col 
        bg-gradient-to-b from-[#080b12] to-[#0b1220] 
        rounded-2xl p-4 
        border border-blue-400/10 
        shadow-[0_0_25px_rgba(59,130,246,0.08)]">

          <h1 className="text-2xl font-semibold mb-4 
          bg-gradient-to-r from-blue-400 to-blue-200 
          bg-clip-text text-transparent text-center">
            AutoNova
          </h1>

          <button
            onClick={handleNewChat}
            className="mb-4 w-full rounded-xl 
            bg-blue-500/20 text-blue-300 
            py-2 font-semibold 
            hover:bg-blue-500/30 
            transition"
          >
            + New Chat
          </button>

          <div className="space-y-2 overflow-y-auto no-scrollbar">
            {Object.values(chats).map((chatItem) => (
              <button
                key={chatItem.id}
                onClick={() => openChat(chatItem.id)}
                className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition
                ${
                  currentChatId === chatItem.id
                    ? 'bg-blue-500/20 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : 'hover:bg-blue-500/10 text-white/80'
                }`}
              >
                {chatItem.title || "New Chat"}
              </button>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <section className="flex flex-1 flex-col max-w-4xl mx-auto relative">

          {/* MESSAGES */}
          <div className="messages flex-1 overflow-y-auto space-y-4 pb-32 pr-1 no-scrollbar">

            {!chats[currentChatId]?.messages?.length && (
              <div className="text-center text-white/50 mt-20">
                <h2 className="text-xl">Ask anything ✨</h2>
                <p className="text-sm mt-2">AI will answer like Perplexity</p>
              </div>
            )}

            {chats[currentChatId]?.messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-2xl w-fit px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'ml-auto bg-white/10 rounded-br-none'
                    : 'mr-auto text-white/90'
                }`}
              >
                {message.role === 'user' ? (
                  <p>{message.content}</p>
                ) : (
                  <div>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p className="mb-3 leading-7">{children}</p>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold mb-3">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold mb-2">{children}</h2>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-5 mb-2">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-5 mb-2">{children}</ol>
                        ),
                        code: ({ children }) => (
                          <code className="bg-white/10 px-1 py-0.5 rounded">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-[#0d1117] p-4 rounded-xl overflow-x-auto text-sm mb-3">
                            {children}
                          </pre>
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>

                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(message.content)
                      }
                      className="text-xs text-white/40 hover:text-white mt-2"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="text-white/60 text-sm animate-pulse">
                Thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ✨ FLOATING BLUE INPUT */}
          <footer className="absolute bottom-4 left-1/2 w-[95%] max-w-3xl -translate-x-1/2">
            <form
              onSubmit={handleSubmitMessage}
              className="flex items-center gap-3 rounded-full border border-blue-400/20 
              bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 
              px-4 py-2 backdrop-blur-xl 
              shadow-[0_0_25px_rgba(59,130,246,0.15)] 
              hover:shadow-[0_0_35px_rgba(59,130,246,0.25)] 
              transition"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent px-2 py-3 text-base text-white outline-none placeholder:text-white/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitMessage(e)
                  }
                }}
              />

              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full 
                bg-blue-500/20 hover:bg-blue-500/30 
                text-blue-300 transition disabled:opacity-40"
              >
                ➤
              </button>
            </form>
          </footer>

        </section>
      </section>
    </main>
  )
}

export default Dashboard