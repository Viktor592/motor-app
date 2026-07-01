import { configureStore } from '@reduxjs/toolkit';
import authReducer   from '../slices/authSlice';
import ordersReducer from '../slices/ordersSlice';
import chatReducer   from '../slices/chatSlice';

export const store = configureStore({
  reducer: {
    auth:   authReducer,
    orders: ordersReducer,
    chat:   chatReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
