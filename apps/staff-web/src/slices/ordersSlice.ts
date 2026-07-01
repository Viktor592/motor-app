import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../services/api';

export interface Order {
  id: string; orderNumber: string; status: string;
  specialistType: string; complaintRaw: string;
  totalRetail?: number; createdAt: string;
  vehicle: { brand: string; model: string; year: number };
  slot?: { startAt: string; post: { name: string } };
  client?: { name: string; phoneMasked: string };
}

interface State { list: Order[]; current: Order | null; total: number; loading: boolean; error: string | null; }
const init: State = { list: [], current: null, total: 0, loading: false, error: null };

export const fetchOrders = createAsyncThunk('orders/fetch',
  async (p: { page?: number; status?: string } = {}, { rejectWithValue }) => {
    try { return (await api.get('/orders', { params: p })).data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.error ?? 'Ошибка'); }
  });

export const fetchOrder = createAsyncThunk('orders/one',
  async (id: string, { rejectWithValue }) => {
    try { return (await api.get(`/orders/${id}`)).data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.error ?? 'Ошибка'); }
  });

const slice = createSlice({
  name: 'orders', initialState: init,
  reducers: {
    updateStatus(state, a: PayloadAction<{ orderId: string; status: string }>) {
      const o = state.list.find(x => x.id === a.payload.orderId);
      if (o) o.status = a.payload.status;
      if (state.current?.id === a.payload.orderId) state.current.status = a.payload.status;
    },
  },
  extraReducers: b => {
    b.addCase(fetchOrders.pending,   s => { s.loading = true; s.error = null; })
     .addCase(fetchOrders.fulfilled, (s, a) => { s.list = a.payload.orders; s.total = a.payload.total; s.loading = false; })
     .addCase(fetchOrders.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(fetchOrder.fulfilled,  (s, a) => { s.current = a.payload; });
  },
});

export const { updateStatus } = slice.actions;
export default slice.reducer;
