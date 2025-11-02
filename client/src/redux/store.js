import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import propertyReducer from './slices/propertySlice'
import chatReducer from './slices/chatSlice'
import contractReducer from './slices/contractSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    property: propertyReducer,
    chat: chatReducer,
    contract: contractReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})
