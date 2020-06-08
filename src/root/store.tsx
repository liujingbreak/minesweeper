import { configureStore, Action } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { createEpicMiddleware } from 'redux-observable';
import rootReducer, { RootState } from './rootReducer';
import rootEpic from './rootEpic';
import {BehaviorSubject} from 'rxjs';
import {switchMap} from 'rxjs/operators';

const epicMiddleware = createEpicMiddleware();

const store = configureStore({
  reducer: rootReducer,
  middleware: [epicMiddleware]
});


const epic$ = new BehaviorSubject(rootEpic);
epicMiddleware.run((...args: any[]) => {
  return epic$.pipe(
    switchMap(epic => (epic as any)(...args))
  ) as any;
});

if (process.env.NODE_ENV !== 'production' && module.hot) {
  module.hot.accept('./rootReducer', () => {
    const newRootReducer = require('./rootReducer').default as typeof rootReducer;
    store.replaceReducer(newRootReducer);
  });

  module.hot.accept('./rootEpic', () => {
    const nextRootEpic = require('./rootEpic').default as typeof rootEpic;
    epic$.next(nextRootEpic);
  });
}

export type AppDispatch = typeof store.dispatch;

export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;

export default store;
