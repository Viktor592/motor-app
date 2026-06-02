import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface ChatMsg {
  id:        string;
  role:      'USER' | 'ASSISTANT';
  content:   string;
  createdAt: string;
}

interface ChatState {
  messages: ChatMsg[];
  loading:  boolean;
  sending:  boolean;
  error:    string | null;
}

const initialState: ChatState = { messages: [], loading: false, sending: false, error: null };

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/chat/${orderId}/messages`);
      return res.data as ChatMsg[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Ошибка');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/send',
  async (payload: { message: string; orderId?: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/chat', payload);
      return res.data.message as ChatMsg;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Ошибка отправки');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMsg>) {
      state.messages.push(action.payload);
    },
    clearChat(state) {
      state.messages = [];
    },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchMessages.pending,   (s) => { s.loading = true; })
      .addCase(fetchMessages.fulfilled, (s, a) => { s.messages = a.payload; s.loading = false; })
      .addCase(fetchMessages.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(sendMessage.pending,     (s) => { s.sending = true; })
      .addCase(sendMessage.fulfilled,   (s, a) => { s.messages.push(a.payload); s.sending = false; })
      .addCase(sendMessage.rejected,    (s, a) => { s.sending = false; s.error = a.payload as string; });
  },
});

export const { addMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
