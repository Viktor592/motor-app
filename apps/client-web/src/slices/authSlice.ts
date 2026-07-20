import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null; refresh: string | null; userId: string | null;
  name: string | null; role: string | null;
}

const init: AuthState = {
  token:   localStorage.getItem('motor_access'),
  refresh: localStorage.getItem('motor_refresh'),
  userId:  localStorage.getItem('motor_user_id'),
  name:    localStorage.getItem('motor_user_name'),
  role:    localStorage.getItem('motor_user_role'),
};

const slice = createSlice({
  name: 'auth', initialState: init,
  reducers: {
    logout(state) {
      state.token = state.refresh = state.userId = state.name = state.role = null;
      localStorage.clear();
    },
    // Синхронизировать состояние из localStorage (например, сразу после логина
    // на отдельной странице LoginPage.tsx, которая пишет напрямую в localStorage
    // в обход Redux).
    syncFromStorage(state) {
      state.token   = localStorage.getItem('motor_access');
      state.refresh = localStorage.getItem('motor_refresh');
      state.userId  = localStorage.getItem('motor_user_id');
      state.name    = localStorage.getItem('motor_user_name');
      state.role    = localStorage.getItem('motor_user_role');
    },
  },
});

export const { logout, syncFromStorage } = slice.actions;
export default slice.reducer;
