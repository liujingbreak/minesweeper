import React, {useEffect} from 'react';
import slice, {MineFieldState} from './mineFieldSlice';
import {useDispatch, connect} from 'react-redux';
import styles from './mineFieldComponent.module.scss';

const Comp: React.FC<MineFieldState['mineField']> = (prop) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(slice.actions.show());
  }, [dispatch]);

  const onClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // event.target.
    // dispatch(slice.actions.tap());
  };

  return <div className={styles.mineField} onClick={onClick}>
    {
      prop.bricks.map(line => (
        <div key={line[0].row} className={styles.row}>{
          line.map(brick => <span key={brick.id}>
            {brick.visible ? brick.displayNum : '?'}
          </span>)
        }</div>)
      )
    }
  </div>;
};

export default connect<MineFieldState['mineField'], {}, {}, MineFieldState>(
  (rootState) => rootState['mineField']
)(Comp);
