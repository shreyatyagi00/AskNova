import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        chats: {},
        currentChatId: null,
        isLoading: false,
        error: null,
    },
    reducers: {

        createNewChat: (state, action) => {
            const { chatId, title } = action.payload
            state.chats[chatId] = {
                id: chatId,
                title,
                messages: [],
                lastUpdated: new Date().toISOString(),
            }
        },

        addNewMessage: (state, action) => {
            const { chatId, content, role } = action.payload

            if (!state.chats[chatId]) return   // 🔥 safety

            state.chats[chatId].messages.push({ content, role })
        },
        deleteChatLocal: (state, action) => {
    const chatId = action.payload;

    delete state.chats[chatId];

    if (state.currentChatId === chatId) {
        state.currentChatId = null;
    }
},

        addMessages: (state, action) => {
            const { chatId, messages } = action.payload

            if (!state.chats[chatId]) return

            state.chats[chatId].messages.push(...messages)
        },

        // 🔥 MAIN FIX (PREVENT DISAPPEARING MESSAGES)
        setChats: (state, action) => {
            const newChats = action.payload

            Object.keys(newChats).forEach(chatId => {
                if (state.chats[chatId]) {
                    newChats[chatId].messages = state.chats[chatId].messages
                }
            })

            state.chats = newChats
        },

        setCurrentChatId: (state, action) => {
            state.currentChatId = action.payload
        },

        setLoading: (state, action) => {
            state.isLoading = action.payload
        },

        setError: (state, action) => {
            state.error = action.payload
        },
    }
})

export const {
    setChats,
    setCurrentChatId,
    setLoading,
    setError,
    createNewChat,
    addNewMessage,
    addMessages,
    deleteChatLocal
} = chatSlice.actions

export default chatSlice.reducer