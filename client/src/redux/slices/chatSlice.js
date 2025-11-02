import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/api/chat`
  : '/api/chat'

const initialState = {
  chats: [],
  activeChat: null,
  messages: [],
  isLoading: false,
  isError: false,
  message: ''
}

// Get all chats
export const getChats = createAsyncThunk(
  'chat/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.data.chats
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Get messages for a chat
export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (chatId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.get(`${API_URL}/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.data.chat.messages
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Get or create chat (for initiating conversation from property)
export const getOrCreateChat = createAsyncThunk(
  'chat/getOrCreate',
  async (propertyId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      // Use the create endpoint
      const response = await axios.post(
        `${API_URL}/property/${propertyId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data.data
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Send message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const { chatId, content, type = 'text', fileUrl, fileName, fileSize } = messageData

      // Prepare the request data
      const requestData = {
        content: content || '',
        type
      }

      // If there's a file (base64), include it
      if (fileUrl) {
        requestData.fileUrl = fileUrl
        requestData.fileName = fileName
        requestData.fileSize = fileSize
      }

      const response = await axios.post(
        `${API_URL}/${chatId}/message`,
        requestData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      // Don't show toast here as we'll add the message immediately
      return response.data.data.message
    } catch (error) {
      const message = error.response?.data?.message || error.message
      toast.error(message)
      return thunkAPI.rejectWithValue(message)
    }
  }
)

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChat = action.payload
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload)
    },
    clearMessages: (state) => {
      state.messages = []
    },
    updateChatLastMessage: (state, action) => {
      const { chatId, message, currentUserId, isActiveChatOpen } = action.payload
      const chatIndex = state.chats.findIndex(c => c._id === chatId)
      
      if (chatIndex !== -1) {
        // Create a shallow copy to ensure React detects the change
        const chat = { ...state.chats[chatIndex] }
        
        // Update lastMessage
        chat.lastMessage = {
          content: message.content,
          type: message.type || 'text',
          sender: message.sender._id || message.sender
        }
        chat.lastMessageAt = message.createdAt || new Date().toISOString()
        
        // Update unread count if message is from another user AND chat is not currently open
        const messageSenderId = message.sender._id || message.sender
        if (messageSenderId !== currentUserId && !isActiveChatOpen) {
          chat.unreadCount = (chat.unreadCount || 0) + 1
          console.log(`Updated unread count for chat ${chatId}: ${chat.unreadCount}`)
        }
        
        // Remove chat from current position and add to top
        state.chats.splice(chatIndex, 1)
        state.chats.unshift(chat)
      }
    },
    clearUnreadCount: (state, action) => {
      const chatId = action.payload
      const chat = state.chats.find(c => c._id === chatId)
      if (chat) {
        chat.unreadCount = 0
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all chats
      .addCase(getChats.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getChats.fulfilled, (state, action) => {
        state.isLoading = false
        state.chats = action.payload
      })
      .addCase(getChats.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Get messages
      .addCase(getMessages.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.isLoading = false
        state.messages = action.payload
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Get or create chat
      .addCase(getOrCreateChat.fulfilled, (state, action) => {
        state.activeChat = action.payload.chat._id
        state.messages = action.payload.chat.messages || []
        // Add chat to chats list if not already there
        const existingChat = state.chats.find(c => c._id === action.payload.chat._id)
        if (!existingChat) {
          state.chats.unshift(action.payload.chat)
        }
      })
      // Send message - Don't push here, let the component handle it
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Message will be added by the component after successful send
        // This prevents duplicate messages
      })
  }
})

export const { setActiveChat, addMessage, clearMessages, updateChatLastMessage, clearUnreadCount } = chatSlice.actions
export default chatSlice.reducer
