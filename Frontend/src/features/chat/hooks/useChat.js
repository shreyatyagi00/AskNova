import { initializeSocketConnection } from "../service/chat.socket";
import { sendMessage, getChats, getMessages, deleteChat, createChat } from "../service/chat.api";
import { 
    setChats, 
    setCurrentChatId, 
    setError, 
    setLoading, 
    createNewChat, 
    addNewMessage, 
    addMessages
} from "../chat.slice";
import { useDispatch } from "react-redux";

export const useChat = () => {

    const dispatch = useDispatch()

    // 🔥 SEND MESSAGE
    async function handleSendMessage({ message, chatId }) {
        dispatch(setLoading(true))

        const data = await sendMessage({ message, chatId })

        const { chatId: newChatId, aiMessage } = data

        const finalChatId = chatId || newChatId

        // 🧠 ensure chat exists in Redux
        if (!chatId) {
            dispatch(createNewChat({
                chatId: newChatId,
                title: ""   // temporary
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

        dispatch(setCurrentChatId(finalChatId))

        // 🔥 refresh chats (title update)
        await handleGetChats()

        dispatch(setLoading(false))
    }

    // 📥 GET ALL CHATS
    async function handleGetChats() {
        dispatch(setLoading(true))

        const data = await getChats()
        const { chats } = data

        dispatch(setChats(
            chats.reduce((acc, chat) => {
                acc[chat._id] = {
                    id: chat._id,
                    title: chat.title,
                    messages: [], // ⚠️ DO NOT PRESERVE HERE
                    lastUpdated: chat.updatedAt,
                }
                return acc
            }, {})
        ))

        dispatch(setLoading(false))
    }

    // 📂 OPEN CHAT
    async function handleOpenChat(chatId, chats) {

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
    }

    // ➕ CREATE NEW CHAT
    async function handleCreateChat() {
        dispatch(setLoading(true))

        try {
            const data = await createChat()
            const { chat } = data

            dispatch(createNewChat({
                chatId: chat._id,
                title: chat.title,
            }))

            dispatch(setCurrentChatId(chat._id))
        } catch (error) {
            dispatch(setError("Failed to create chat"))
        }

        dispatch(setLoading(false))
    }

    return {
        initializeSocketConnection,
        handleSendMessage,
        handleGetChats,
        handleOpenChat,
        handleCreateChat
    }
}