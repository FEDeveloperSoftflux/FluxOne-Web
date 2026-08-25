import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/rtk/features/auth/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})
