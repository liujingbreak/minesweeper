import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import { Epic } from 'redux-observable';
import {map, distinctUntilChanged, filter, take, mergeMap, concatMap, finalize} from 'rxjs/operators';
import {of, timer, merge, from} from 'rxjs';
import has from 'lodash/has';


const FIELD_WIDTH = 12;
const FIELD_HEIGHT = 12;
const NUM_OF_MINES = 13;

export interface BrickState {
  id: string;
  row: number;
  col: number;
  isMine: boolean;
  visible: boolean;
  displayNum: number;
}

export interface Position {
  row: number;
  col: number
}
export interface MineFieldState {
  mineField: {
    bricks: BrickState[][];
    width: number;
    height: number;

    /** probably redendunt */
    gameover: null | 'win' | 'lose';
    /** cache mines position */
    mines: {col: number, row: number}[];
    lastClickPos?: Position;
    /** count of remaining unexplored*/
    unexplored: number;
  }
}

const initialState = generateField(FIELD_WIDTH, FIELD_HEIGHT);

const mineFieldSlice = createSlice({
  name: 'mineField',
  initialState,
  reducers: {
    show(state, action: PayloadAction<void>) {
      // TODO: async
      generateMines(state, NUM_OF_MINES);
    },
    tap(state, action: PayloadAction<{row: number; col: number}>) {
      const {row, col} = action.payload;
      const brick = state.bricks[row][col];
      
      if (!brick.visible) {
        brick.visible = true;
        state.lastClickPos = {row, col};
        if (brick.isMine) {
          state.gameover = 'lose';
        } else {
          calcVisibility({row, col}, state);
        }
      }
    },
    syncStatus(state, action: PayloadAction<{unexplored: number}>) {
      state.unexplored = action.payload.unexplored;
    },
    _endGame(state) {
      state.gameover = 'win';
    },
    _showBrick(state, action: PayloadAction<{row: number, col: number}>) {
      state.bricks[action.payload.row][action.payload.col].visible = true;
    },
  }
});

export default mineFieldSlice;

export const epic: Epic<PayloadAction<any>, PayloadAction<any>, MineFieldState> = (action$, state$) => {
  let isLost = false;
  return merge<PayloadAction<any>>(
    state$.pipe(
      map(s => s.mineField.bricks),
      distinctUntilChanged(),
      concatMap(bricks => {
        let count = 0;
        for (const line of bricks) {
          for (const bricks of line) {
            if (!bricks.visible)
              count++;
          }
        }
        if (count === state$.value.mineField.mines.length) {
          return of(
            mineFieldSlice.actions.syncStatus({unexplored: count}),
            mineFieldSlice.actions._endGame()
          );
        }
        return of(mineFieldSlice.actions.syncStatus({unexplored: count}));
      })
    ),

    state$.pipe(
      map(s => s.mineField.gameover),
      distinctUntilChanged(),
      filter(result => result != null),
      take(1),
      mergeMap(result => {
        isLost = result === 'lose';
        const currState = state$.value.mineField;
        const rippleStarPoint = currState.lastClickPos ||
          {col: currState.width >> 1, row: currState.height >> 1};

        const posList = makeRippleArray(rippleStarPoint.row, rippleStarPoint.col, currState.height, currState.width)
        .filter(pos => !currState.bricks[pos.row][pos.col].visible);

        return from(posList.map(({row, col}) => mineFieldSlice.actions._showBrick({row, col})));
      }),
      concatMap(action => timer(5)
        .pipe(map(() => action))
      ),
      finalize(() => setTimeout(() => alert(isLost ? 'BANG !!!' : 'You win !'), 500))
    )
  )
};

/**
 * Better be done in a web worker
 * @param size 
 * @param numOfMines 
 */
function generateField(width = 10, height = 10): MineFieldState['mineField'] {

  const res = {
    bricks: [] as BrickState[][],
    width: width,
    height: height,
    gameover: null,
    mines: [],
    unexplored: width * height
  }

  const bricks = res.bricks;
  for (let row = 0; row < height; row++) {
    const line = [] as BrickState[];
    bricks.push(line);
    for (let col = 0; col < width; col++) {

      line.push({
        id: `${row}-${col}`,
        row,
        col,
        visible: false,
        isMine: false,
        displayNum: 0
      });
    }
  }

  return res;
}

function generateMines(state: MineFieldState['mineField'], numOfMines = 10) {
  const bricks = state.bricks;
  const rowNum = state.height;
  const colNum = state.width;

  const mineSet: {[idx: string]: boolean} = {};

  for (let i = 0; i < numOfMines; i++) {
    let idx = Math.floor(Math.random() * rowNum * colNum);
    while (has(mineSet, idx + '')) {
      idx = Math.floor(Math.random() * rowNum * colNum);
    }
    mineSet[idx] = true;

    const row = Math.floor(idx / colNum);
    const col = idx - row * colNum;

    bricks[row][col].isMine = true;
    state.mines.push({row, col});
  }
  calcNumbers(state)
}

/**
 * Calculate times in number of mines, which is faster than scanning each brick in the game map
 * @param state 
 * @param numOfMines 
 */
function calcNumbers(state: MineFieldState['mineField']) {
  for (const {row, col} of state.mines) {
    for (const neibPos of getPositionOfNeighbors(row, col, state.height, state.width)) {
      const brick = state.bricks[neibPos.row][neibPos.col];
      brick.displayNum = brick.displayNum + 1;
    }
  }
}

/**
 * Eliminate those arounding positions which are out of game map
 * @param row 
 * @param right 
 * @param numOfRow 
 * @param numOfWidth 
 */
function getPositionOfNeighbors(row: number, col: number, numOfRow: number, numOfCol: number): {row: number, col: number}[] {
  const res: {row: number, col: number}[] = [
    {row: row - 1, col: col - 1}, // above left
    {row: row - 1, col: col}, // above
    {row: row - 1, col: col + 1}, // above right
    {row: row, col: col - 1}, // left
    {row: row, col: col + 1}, // right
    {row: row + 1, col: col + 1}, // below right
    {row: row + 1, col: col}, // below
    {row: row + 1, col: col - 1}, // below left
  ];

  return res.filter(({row, col}) => row >= 0 && row < numOfRow && col >= 0 && col < numOfCol);
}

/**
 * Took me like half hour
 * Calculate visibility of a brick and its neighbors and visible neighbor's neighbor
 * @param state 
 */
function calcVisibility(origin: {row: number, col: number}, state: MineFieldState['mineField']): void {
  // const brickPosList = makeRippleArray(origin.row, origin.col, state.height, state.width, (row, col) => {
  //   const brick = state.bricks[row][col];
  //   return brick.isMine || brick.displayNum !== 0 || brick.visible;
  // }, true);

  // brickPosList.map(p => state.bricks[p.row][p.col])
  // .filter(b => !b.isMine)
  // .forEach(b => b.visible = true);
  const bricks = state.bricks;
  const brickQ = [bricks[origin.row][origin.col]];
  const checked: {[row: string]: {[col: string]: boolean}} = {};


  for (let i = 0; i < brickQ.length; i++) {
    const brick = brickQ[i];

    if (brick.isMine) {
      continue;
    }
    brick.visible = true;

    if (brick.displayNum !== 0) {
      continue;
    }

    const neighborPos = getPositionOfNeighbors(brick.row, brick.col, state.height, state.width);
    // console.log(neighborPos);
    for (const pos of neighborPos) {
      // console.log('nei', pos.row, pos.col);
      if (checked[pos.row] == null) {
        checked[pos.row] = {};
      }
      // filter for not checked and invisible bricks
      if (checked[pos.row][pos.col] !== true) {
        checked[pos.row][pos.col] = true;
        const neighbor = bricks[pos.row][pos.col];
        if (!neighbor.visible)
          brickQ.push(neighbor);
      }
    }
    
  }
}

function makeRippleArray(startRow: number, startCol: number, height: number, width: number,
  stopPredicate?: (row: number, col: number) => boolean, includeEdge = false)
  : Array<{row: number, col: number}>{

  const rippleQ = [] as Position[];
  const brickQ = [{row: startRow, col: startCol}];
  const checked: {[row: string]: {[col: string]: boolean}} = {};

  for (let i = 0; i < brickQ.length; i++) {
    const brick = brickQ[i];
    const isEdge = stopPredicate != null && stopPredicate(brick.row, brick.col);

    if (!isEdge || includeEdge) {
      rippleQ.push(brick);
      if (!isEdge) {
        const neighborPos = getPositionOfNeighbors(brick.row, brick.col, height, width);
        for (const pos of neighborPos) {
          if (checked[pos.row] == null) {
            checked[pos.row] = {};
          }
          // filter for not checked bricks
          if (checked[pos.row][pos.col] !== true) {
            checked[pos.row][pos.col] = true;
            const neighbor = pos;
            brickQ.push(neighbor);
          }
        }
      }
    }
  }
  return brickQ;
}
