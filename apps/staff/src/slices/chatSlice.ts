import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../services/api';

export interface Msg { id: string; role: 'USER'|'ASSISTANT'; content: string; createdAt: string; }
interface State { messages: Msg[]; loading: boolean; sending: boolean; error: string | null; }
const init: State = { messages: [], loading: false, sending: false, error: null };

export const fetchMessages = createAsyncThunk('chat/fetch',
  async (orderId: string, { rejectWithValue }) => {
    try { return (await api.get(`/chat/${orderId}/messages`)).data as Msg[]; }
    catch (e: any) { return rejectWithValue(e.response?.data?.error ?? 'Ошибка'); }
  });

export const sendMessage = createAsyncThunk('chat/send',
  async (p: { message: string; orderId?: string }, { rejectWithValue }) => {
    try { return (await api.post('/chat', p)).data.message as Msg; }
    catch (e: any) { return rejectWithValue(e.response?.data?.error ?? 'Ошибка'); }
  });

const slice = createSlice({
  name: 'chat', initialState: init,
  reducers: {
    addMessage: (s, a: PayloadAction<Msg>) => { s.messages.push(a.payload); },
    clearChat:  (s) => { s.messages = []; },
  },
  extraReducers: b => {
    b.addCase(fetchMessages.pending,   s => { s.loading = true; })
     .addCase(fetchMessages.fulfilled, (s, a) => { s.messages = a.payload; s.loading = false; })
     .addCase(fetchMessages.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(sendMessage.pending,     s => { s.sending = true; })
     .addCase(sendMessage.fulfilled,   (s, a) => { s.messages.push(a.payload); s.sending = false; })
     .addCase(sendMessage.rejected,    (s, a) => { s.sending = false; s.error = a.payload as string; });
  },
});

export const { addMessage, clearChat } = slice.actions;
export default slice.reducer;
