import {createSlice, PayloadAction} from '@reduxjs/toolkit';
// import { combineEpics, Epic } from 'redux-observable';
// import {tap, distinctUntilChanged} from 'rxjs/operators';
// import {of} from 'rxjs';

export interface BrickState {
  id: string;
  row: number;
  col: number;
  isMine: boolean;
  visible: boolean;
  displayNum: number;
}

export interface MineFieldState {
  mineField: {
    bricks: BrickState[][];
    width: number;
    height: number;
  }
}

const initialState = generateField();

const mineFieldSlice = createSlice({
  name: 'mineField',
  initialState,
  reducers: {
    show: (state, action: PayloadAction<void>) => {
      // TODO: async
      generateMines(state);
    },
    tap: (state, action: PayloadAction<{row: number; col: number}>) => {

    }
  }
});

export default mineFieldSlice;

/**
 * Better be done in a web worker
 * @param size 
 * @param numOfMines 
 */
function generateField(size = 10, numOfMines = 10): MineFieldState['mineField'] {

  const res = {
    bricks: [] as BrickState[][],
    width: size,
    height: size
  }

  const bricks = res.bricks;
  for (let row = 0; row < 10; row++) {
    const line = [] as BrickState[];
    bricks.push(line);
    for (let col = 0; col < 10; col++) {

      line.push({
        id: `${row}-${col}`,
        row,
        col,
        visible: false,
        isMine: false,
        displayNum: 1
      });
    }
  }

  return res;
}

function generateMines(state: MineFieldState['mineField'], numOfMines = 10) {
  const bricks = state.bricks;

  for (let i = 0; i < numOfMines; i++) {
    const idx = Math.floor(Math.random() * 100);
    const row = Math.floor(idx / 10);
    const col = idx - row * 10;
    console.log(idx, row, col, bricks);
    bricks[row][col].isMine = true;
  }
}
