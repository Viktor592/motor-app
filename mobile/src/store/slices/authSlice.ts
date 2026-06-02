import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { storage } from '../../utils/storage';

interface AuthState {
  token:     string | null;
  refresh:   string | null;
  userId:    string | null;
  name:      string | null;
  role:      'CLIENT' | 'MASTER' | 'RECEPTIONIST' | 'ADMIN' | null;
  needsName: boolean;
  loading:   boolean;
  error:     string | null;
}

const initialState: AuthState = {
  token:     storage.getString('access_token') ?? null,
  refresh:   storage.getString('refresh_token') ?? null,
  userId:    storage.getString('user_id') ?? null,
  name:      storage.getString('user_name') ?? null,
  role:      (storage.getString('user_role') as AuthState['role']) ?? null,
  needsName: false,
  loading:   false,
  error:     null,
};

const persist = (data: any) => {
  storage.set('access_token',  data.access);
  storage.set('refresh_token', data.refresh);
  storage.set('user_id',   data.user.id);
  storage.set('user_name', data.user.name);
  storage.set('user_role', data.user.role);
};

// OTP — шаг 1: запросить код
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (phone: string, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/otp/send', { phone });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Ошибка отправки кода');
    }
  }
);

// OTP — шаг 2: подтвердить код
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (payload: { phone: string; code: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/otp/verify', payload);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Неверный код');
    }
  }
);

// Пароль (для персонала/веб)
export const login = createAsyncThunk(
  'auth/login',
  async (payload: { phone: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', payload);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Ошибка входа');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: { phone: string; name: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', payload);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Ошибка регистрации');
    }
  }
);

export const updateName = createAsyncThunk(
  'auth/updateName',
  async (name: string, { rejectWithValue }) => {
    try {
      const res = await api.patch('/auth/name', { name });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Ошибка');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = state.refresh = state.userId = state.name = state.role = null;
      state.needsName = false;
      storage.delete('access_token');
      storage.delete('refresh_token');
      storage.delete('user_id');
      storage.delete('user_name');
      storage.delete('user_role');
    },
    clearError(state) { state.error = null; },
    setTokens(state, action: PayloadAction<{ access: string; refresh: string }>) {
      state.token   = action.payload.access;
      state.refresh = action.payload.refresh;
      storage.set('access_token', action.payload.access);
      storage.set('refresh_token', action.payload.refresh);
    },
  },
  extraReducers: (builder) => {
    const handleAuth = (state: AuthState, action: any) => {
      persist(action.payload);
      state.token     = action.payload.access;
      state.refresh   = action.payload.refresh;
      state.userId    = action.payload.user.id;
      state.name      = action.payload.user.name;
      state.role      = action.payload.user.role;
      state.needsName = action.payload.user.needsName ?? false;
      state.loading   = false;
      state.error     = null;
    };

    builder
      // sendOtp
      .addCase(sendOtp.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(sendOtp.fulfilled, (s) => { s.loading = false; })
      .addCase(sendOtp.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      // verifyOtp
      .addCase(verifyOtp.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(verifyOtp.fulfilled, handleAuth)
      .addCase(verifyOtp.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      // login
      .addCase(login.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, handleAuth)
      .addCase(login.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      // register
      .addCase(register.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled, handleAuth)
      .addCase(register.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      // updateName
      .addCase(updateName.fulfilled, (s, a) => {
        s.name = a.payload.name;
        storage.set('user_name', a.payload.name);
        s.needsName = false;
      });
  },
});

export const { logout, clearError, setTokens } = authSlice.actions;
export default authSlice.reducer;
