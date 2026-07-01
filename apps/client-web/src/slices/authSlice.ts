import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

interface AuthState {
  token: string|null; refresh: string|null; userId: string|null;
  name: string|null; role: string|null; loading: boolean; error: string|null;
}

const init: AuthState = {
  token:   localStorage.getItem('access_token'),
  refresh: localStorage.getItem('refresh_token'),
  userId:  localStorage.getItem('user_id'),
  name:    localStorage.getItem('user_name'),
  role:    localStorage.getItem('user_role'),
  loading: false, error: null,
};

const persist = (d: any) => {
  localStorage.setItem('access_token',  d.access);
  localStorage.setItem('refresh_token', d.refresh);
  localStorage.setItem('user_id',   d.user.id);
  localStorage.setItem('user_name', d.user.name);
  localStorage.setItem('user_role', d.user.role);
};

export const login = createAsyncThunk('auth/login',
  async (p: { phone: string; password: string }, { rejectWithValue }) => {
    try { return (await api.post('/auth/login', p)).data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.error ?? 'Ошибка входа'); }
  });

export const register = createAsyncThunk('auth/register',
  async (p: { phone: string; name: string; password: string }, { rejectWithValue }) => {
    try { return (await api.post('/auth/register', p)).data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.error ?? 'Ошибка регистрации'); }
  });

const slice = createSlice({
  name: 'auth', initialState: init,
  reducers: {
    logout(state) {
      state.token=state.refresh=state.userId=state.name=state.role=null;
      localStorage.clear();
    },
  },
  extraReducers: b => {
    const handle = (s: AuthState, a: any) => {
      persist(a.payload);
      s.token=a.payload.access; s.refresh=a.payload.refresh;
      s.userId=a.payload.user.id; s.name=a.payload.user.name;
      s.role=a.payload.user.role; s.loading=false; s.error=null;
    };
    b.addCase(login.pending,      s => { s.loading=true; s.error=null; })
     .addCase(login.fulfilled,    handle)
     .addCase(login.rejected,     (s,a) => { s.loading=false; s.error=a.payload as string; })
     .addCase(register.pending,   s => { s.loading=true; s.error=null; })
     .addCase(register.fulfilled, handle)
     .addCase(register.rejected,  (s,a) => { s.loading=false; s.error=a.payload as string; });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;
