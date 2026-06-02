import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface Order {
  id:          string;
  orderNumber: string;
  status:      string;
  specialistType: string;
  complaintRaw: string;
  totalRetail?: number;
  createdAt:   string;
  vehicle:     { brand: string; model: string; year: number };
  slot?:       { startAt: string; post: { name: string } };
}

interface OrdersState {
  list:    Order[];
  current: Order | null;
  total:   number;
  loading: boolean;
  error:   string | null;
}

const initialState: OrdersState = {
  list: [], current: null, total: 0, loading: false, error: null,
};

export const fetchOrders = createAsyncThunk(
  'orders/fetch',
  async (params: { page?: number; status?: string } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/orders', { params });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Ошибка загрузки');
    }
  }
);

export const fetchOrder = createAsyncThunk(
  'orders/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/orders/${id}`);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Ошибка');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    updateOrderStatus(state, action) {
      const { orderId, status } = action.payload;
      const order = state.list.find(o => o.id === orderId);
      if (order) order.status = status;
      if (state.current?.id === orderId) state.current.status = status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending,   (s) => { s.loading = true; })
      .addCase(fetchOrders.fulfilled, (s, a) => {
        s.list    = a.payload.orders;
        s.total   = a.payload.total;
        s.loading = false;
      })
      .addCase(fetchOrders.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(fetchOrder.fulfilled,  (s, a) => { s.current = a.payload; });
  },
});

export const { updateOrderStatus } = ordersSlice.actions;
export default ordersSlice.reducer;
