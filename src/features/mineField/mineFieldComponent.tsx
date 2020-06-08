import React, {useEffect} from 'react';
import slice, {MineFieldState} from './mineFieldSlice';
import {useDispatch, connect} from 'react-redux';
import styles from './mineFieldComponent.module.scss';
import classnames from 'classnames';

const Comp: React.FC<MineFieldState['mineField']> = (prop) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(slice.actions.show());
  }, [dispatch]);

  const onClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const dom = event.target as HTMLSpanElement;
    const pos = domToPos(dom);
    if (pos) {
      dispatch(slice.actions.tap(pos))
    }
  };

  return <>
    <div className={styles.mineField} onClick={onClick}>
      {
        prop.bricks.map((line, row) => (
          <div key={line[0].row} className={styles.row}>{
            line.map((brick, col) => (
                <span key={brick.id}
                  className={classnames('brick', styles.brick, {
                    [styles.inVisible]: !brick.visible,
                    [styles.visible]: brick.visible,
                    [styles.mine]: brick.isMine
                  })}
                  data-minpos={`${row},${col}`}>
                  {brick.visible ?
                    (brick.isMine ? <>&nbsp;</> : (brick.displayNum > 0 ? brick.displayNum : <>&nbsp;</>))
                    : <>&nbsp;</>}
                </span>
            ))
          }</div>)
        )
      }
    </div>
    <section className={styles.statusBar}><span>{prop.mines.length}</span> Mines | {prop.unexplored} unexplored</section>
  </>;
};

function domToPos(dom: HTMLSpanElement) {
  const dataMinpos = dom.getAttribute('data-minpos');
  if (dataMinpos == null)
    return null;
  const [row, col] = dataMinpos.split(',').map(value => parseInt(value, 10));
  return {row, col};
}

export default connect<MineFieldState['mineField'], {}, {}, MineFieldState>(
  (rootState) => rootState['mineField']
)(Comp);
