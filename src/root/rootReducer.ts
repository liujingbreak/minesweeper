import { combineReducers, createSlice, PayloadAction } from '@reduxjs/toolkit';
import mineFieldSlice from '../features/mineField/mineFieldSlice';

export interface MainState {
  started: boolean;
}

const mainReducerSlice = createSlice({
  name: 'main',
  initialState: {started: false} as MainState,
  reducers: {
    watch: (state, action: PayloadAction<string>) => {
      // console.log(action.type);
      state.started = true;
    }
  }
});

const rootReducer = combineReducers({
  [mainReducerSlice.name]: mainReducerSlice.reducer,
  [mineFieldSlice.name]: mineFieldSlice.reducer
  // [MySlice.name]: MySlice.reducer
});

export type RootState = ReturnType<typeof rootReducer>;
export const {actions} = mainReducerSlice;

export default rootReducer;
