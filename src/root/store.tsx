import { configureStore, Action, Observable } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { createEpicMiddleware, ofType, Epic } from 'redux-observable';
import rootReducer, { RootState } from './rootReducer';
import rootEpic from './rootEpic';
import {BehaviorSubject} from 'rxjs';
import {mergeMap, takeUntil} from 'rxjs/operators';

const epicMiddleware = createEpicMiddleware();

const store = configureStore({
  reducer: rootReducer,
  middleware: [epicMiddleware]
});


const epic$ = new BehaviorSubject<Epic>(rootEpic);
epicMiddleware.run((action$, ...args: any[]) => {
  return epic$.pipe(
    mergeMap(epic => ((epic as any)(action$, ...args) as ReturnType<Epic>).pipe(
      takeUntil(action$.pipe(
        ofType('EPIC_END')
      ))
    ))
  );
});

if (process.env.NODE_ENV !== 'production' && module.hot) {
  module.hot.accept('./rootReducer', () => {
    const newRootReducer = require('./rootReducer').default as typeof rootReducer;
    store.replaceReducer(newRootReducer);
  });

  module.hot.accept('./rootEpic', () => {
    const nextRootEpic = require('./rootEpic').default as typeof rootEpic;
    // First kill any running epics
    store.dispatch({ type: 'EPIC_END' });
 
    epic$.next(nextRootEpic);
  });
}

export type AppDispatch = typeof store.dispatch;

export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;

export default store;
