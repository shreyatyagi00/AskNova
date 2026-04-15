import { initializeSocketConnection } from "../service/chat.socket";
import { sendMessage, getChats, getMessages, createChat } from "../service/chat.api";
import {
  setChats,
  setCurrentChatId,
  setError,
  setLoading,
  createNewChat,
  addNewMessage,
  addMessages
} from "../chat.slice";
import { useDispatch, useSelector } from "react-redux";

export const useChat = () => {

  const dispatch = useDispatch()
  const chatsState = useSelector((state) => state.chat.chats)

  // 🔥 SEND MESSAGE
  async function handleSendMessage({ message, chatId }) {
    try {
      dispatch(setLoading(true))

      const data = await sendMessage({ message, chatId })
      const { chatId: newChatId, aiMessage } = data

      const finalChatId = chatId || newChatId

      // ✅ NEW CHAT CREATE IN REDUX
      if (!chatId) {
        dispatch(createNewChat({
          chatId: newChatId,
          title: "" // temporary until backend updates
        }))
      }

      // ✅ USER MESSAGE
      dispatch(addNewMessage({
        chatId: finalChatId,
        content: message,
        role: "user",
      }))

      // 🤖 AI MESSAGE
      dispatch(addNewMessage({
        chatId: finalChatId,
        content: aiMessage.content,
        role: aiMessage.role,
      }))

      // ✅ SET CURRENT CHAT
      dispatch(setCurrentChatId(finalChatId))

      // 🔥 SAVE FOR RELOAD FIX
      localStorage.setItem("lastChatId", finalChatId)

      // 🔥 REFRESH CHAT LIST (title update)
      await handleGetChats()

    } catch (error) {
      dispatch(setError("Failed to send message"))
    } finally {
      dispatch(setLoading(false))
    }
  }

  // 📥 GET ALL CHATS
  async function handleGetChats() {
    try {
      dispatch(setLoading(true))

      const data = await getChats()
      const { chats } = data

      dispatch(setChats(
        chats.reduce((acc, chat) => {
          acc[chat._id] = {
            id: chat._id,
            title: chat.title,
            // 🔥 PRESERVE EXISTING MESSAGES
            messages: chatsState[chat._id]?.messages || [],
            lastUpdated: chat.updatedAt,
          }
          return acc
        }, {})
      ))

    } catch (error) {
      dispatch(setError("Failed to fetch chats"))
    } finally {
      dispatch(setLoading(false))
    }
  }

  // 📂 OPEN CHAT
  async function handleOpenChat(chatId, chats) {
    try {
      // 🔥 SAVE CURRENT CHAT
      localStorage.setItem("lastChatId", chatId)

      // 🔥 LOAD ONLY IF EMPTY
      if (chats[chatId]?.messages.length === 0) {
        const data = await getMessages(chatId)
        const { messages } = data

        const formattedMessages = messages.map(msg => ({
          content: msg.content,
          role: msg.role,
        }))

        dispatch(addMessages({
          chatId,
          messages: formattedMessages,
        }))
      }

      dispatch(setCurrentChatId(chatId))

    } catch (error) {
      dispatch(setError("Failed to open chat"))
    }
  }

  // ➕ CREATE NEW CHAT
  async function handleCreateChat() {
    try {
      dispatch(setLoading(true))

      const data = await createChat()
      const { chat } = data

      dispatch(createNewChat({
        chatId: chat._id,
        title: chat.title,
      }))

      dispatch(setCurrentChatId(chat._id))

      // 🔥 SAVE NEW CHAT
      localStorage.setItem("lastChatId", chat._id)

    } catch (error) {
      dispatch(setError("Failed to create chat"))
    } finally {
      dispatch(setLoading(false))
    }
  }

  return {
    initializeSocketConnection,
    handleSendMessage,
    handleGetChats,
    handleOpenChat,
    handleCreateChat
  }
}