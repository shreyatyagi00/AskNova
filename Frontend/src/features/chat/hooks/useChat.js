import { initializeSocketConnection } from "../service/chat.socket";
import { sendMessage, getChats, getMessages, createChat, deleteChat } from "../service/chat.api";
import {
  setChats,
  setCurrentChatId,
  setError,
  setLoading,
  createNewChat,
  addNewMessage,
  addMessages,
  deleteChatLocal
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

      if (!chatId) {
        dispatch(createNewChat({
          chatId: newChatId,
          title: ""
        }))
      }

      dispatch(addNewMessage({
        chatId: finalChatId,
        content: message,
        role: "user",
      }))

      dispatch(addNewMessage({
        chatId: finalChatId,
        content: aiMessage.content,
        role: aiMessage.role,
      }))

      dispatch(setCurrentChatId(finalChatId))
      localStorage.setItem("lastChatId", finalChatId)

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
      localStorage.setItem("lastChatId", chatId)

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
      localStorage.setItem("lastChatId", chat._id)

    } catch (error) {
      dispatch(setError("Failed to create chat"))
    } finally {
      dispatch(setLoading(false))
    }
  }

  // 🗑 DELETE CHAT (FINAL FIXED)
  async function handleDeleteChat(chatId) {
    try {
      dispatch(setLoading(true));

      // 🔥 backend delete
      await deleteChat(chatId);

      // 🔥 get ordered chats (same as UI)
      const orderedChats = Object.values(chatsState)
        .slice()
        .reverse();

      // 🔥 find current index
      const index = orderedChats.findIndex(c => c.id === chatId);

      // 🔥 previous chat (UI ke hisaab se)
      const prevChatId = orderedChats[index + 1]?.id || null;

      // 🔥 redux remove
      dispatch(deleteChatLocal(chatId));

      // 🔥 open previous chat
      if (prevChatId) {
        dispatch(setCurrentChatId(prevChatId));
        localStorage.setItem("lastChatId", prevChatId);
      } else {
        dispatch(setCurrentChatId(null));
        localStorage.removeItem("lastChatId");
      }

    } catch (error) {
      dispatch(setError("Failed to delete chat"));
    } finally {
      dispatch(setLoading(false));
    }
  }

  return {
    initializeSocketConnection,
    handleSendMessage,
    handleGetChats,
    handleOpenChat,
    handleCreateChat,
    handleDeleteChat
  }
}