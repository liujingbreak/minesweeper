import { combineEpics, Epic } from 'redux-observable';
import {PayloadAction} from '@reduxjs/toolkit';
import {tap, distinctUntilChanged} from 'rxjs/operators';
import {of} from 'rxjs';
const logEpic: Epic<PayloadAction> = (action$, state$) => {
  if (process.env.NODE_ENV !== 'production') {
    action$.pipe(
      tap(action => {
        // tslint:disable-next-line: no-console
        console.log(`[RootEpic] action ${action.type} ${action.payload}`);
      })
    ).subscribe();

    state$.pipe(
      distinctUntilChanged(),
      // tslint:disable-next-line: no-console
      tap(state => console.log('[RootEpic] state', state))
    ).subscribe();
  }
  return of<PayloadAction>({type: 'main/watch', payload: undefined});
};
const epics = combineEpics(
  logEpic
  );

export default epics;

