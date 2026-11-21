import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

let storedUser = null;
try {
  storedUser = JSON.parse(localStorage.getItem('user'));
} catch (e) {
  // corrupted value: treat as logged out
}

const initialState = {
  user: storedUser,   // { access, refresh } or null
  userInfo: {},       // profile of the logged-in user, loaded after login / page reload
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

const errorMessage = (error) => error.response?.data?.detail || error.message || String(error);

export const login = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
  try {
    return await authService.login(credentials);
  } catch (error) {
    return thunkAPI.rejectWithValue(errorMessage(error));
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  authService.logout();
});

export const getUserInfo = createAsyncThunk('auth/getUserInfo', async (_, thunkAPI) => {
  try {
    return await authService.getUserInfo();
  } catch (error) {
    return thunkAPI.rejectWithValue(errorMessage(error));
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.isLoading = true; })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.userInfo = {};          // never show the previous user's data
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.userInfo = {};
      })
      .addCase(getUserInfo.fulfilled, (state, action) => { state.userInfo = action.payload; });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;