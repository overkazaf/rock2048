import { algo } from './algorithm';
import { Matrix } from './matrix';
import { DIRATION } from './enums/direction';
import * as Models from './TrainModels/index';

const {
  BaseModel,
  RandomModel,
  NNModel,
} = Models;

const TIMEOUT = 3000;

interface GameBaseInterface {
  isGameOver(): boolean;
  genRandomCordinate(): void;
  findEmptyCordinates(): number[][];
}

type DataSet = {
  inputs: number[];
  labels: number[];
}
const trainingDataSet: DataSet = {
  inputs: [],
  labels: [],
};

class Game implements algo, GameBaseInterface {
  matrix: Matrix;
  score: number;
  isOver: boolean;
  timer: any;
  states: any[];
  trainingModel: any;
  trainingRecords: any[];
  lastPredictions: number[];
  prevPredictions: number[];
  prevMovementDirection: DIRATION | null;
  lastMovementDirection: DIRATION | null;
  lastState: number[][];
  prevState: number[][];

  constructor() {
    this.matrix = new Matrix(
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]
    );
    this.score = 0;
    this.isOver = false;
    this.states = [];
    this.trainingRecords = [];
    this.prevPredictions = [];
    this.lastPredictions = [];
    this.lastState = [];
    this.prevState = [];
    this.prevMovementDirection = null;
    this.lastMovementDirection = null;
    this.trainingModel = new RandomModel();
    this.trainingModel.init();  
  }

  printState(prefix?: string): void {
    const { data } = this.matrix;
    console.log(`\nCurrent score: ${this.score}, board state: `);
    data.forEach(row => {
      const current: number[] = [];
      row.forEach(item => {
        current.push(<number>item);
      });
      console.log(`[ ${current.join(',')} ]`);
    });
    console.log('\n');
  }

  predictNextDirection() {
    this.prevState = this.lastState;
    const state = this.convertBoardStateToVector();
    this.lastState = state;
    return this.trainingModel.predict(state);
  }

  genNextRandomDirection(): DIRATION {
    return ~~(Math.random() * 4);
  }

  handleGameOver() {
    let label: number[] = [];
    // 优化之前移动导致游戏结束的状态
    const {
      lastState,
      prevMovementDirection,
      lastMovementDirection
    } = this;

    switch(lastMovementDirection) {
      case DIRATION.UP:
        // 上次是向上移动挂掉的，同理是可以向下的，下次记得向下做一次尝试，至少不会太差。
        label = [0, 1, 0, 0];
        break;
      case DIRATION.DOWN:
        label = [1, 0, 0, 0];
        break;
      case DIRATION.LEFT:
        label = [0, 0, 0, 1];
        break;
      case DIRATION.RIGHT:
        label = [0, 0, 1, 0];
        break;
    }

    trainingDataSet.inputs.push(lastState);
    trainingDataSet.labels.push(label);

    // console.info(
    //   'Training',
    //   'lastMovementDirection ==>',
    //   DIRATION[lastMovementDirection],
    //   'lastState ==> ',
    //   lastState,
    //   'label ==> ',
    //   label,
    // );
    // this.trainingModel.fit(trainingDataSet.inputs, trainingDataSet.labels);
  }

  convertBoardStateToVector(): number[][] {
    const directions = [ DIRATION.UP, DIRATION.DOWN, DIRATION.LEFT, DIRATION.RIGHT ];
    
    const emptyBlockCounts: number[] = [];
    const scores: number[] = [];
    const existed2Counts: number[] = [];
    
    const originalMatrix = this.matrix.clone();

    directions.forEach(dir => {
      if (!this.isMovable(dir)) {
        emptyBlockCounts.push(0);
        scores.push(this.score);
      } else {
        // 移动后计算分值
        this.moveByDirection(dir);
        emptyBlockCounts.push(this.findEmptyCordinates().length);
        scores.push(this.score);
      }
      existed2Counts.push(this.findCurrentMaxNumber());
      // 还原状态
      this.setMatrix(originalMatrix);
    });
    const vector = [
      scores,
      emptyBlockCounts,
      existed2Counts,
    ];
    console.log('vector', vector);
    return vector;
  }

  findCurrentMaxNumber(): number {
    const { data } = this.matrix;
    let maxNum: number = 0;
    data.forEach((row, x) => {
      row.forEach((item, y) => {
        if (item >= maxNum) {
          maxNum = item;
        }
      });
    });
    return maxNum;
  }

  findExistedNumberCounts(num: number): number {
    const { data } = this.matrix;
    let count: number = 0;
    data.forEach((row, x) => {
      row.forEach((item, y) => {
        if (item === num) {
          count++;
        }
      });
    });
    return count;
  }

  showGameOverMessage(): void {
    console.log('');
    console.log(`U failed, final score:${this.score}, total steps: ${this.states.length / 2}`);
    console.log('Final 2048 game state', this.matrix.data);
    console.log('');
  }

  start(): void {
    this.genNewBoardState();
  }

  genNewBoardState(): void {
    const cords = this.genRandomCordinate();
    if (!cords.length) {
      clearInterval(this.timer);
      this.showGameOverMessage();
      this.trainingRecords.push([this.score, this.states]);
      this.handleGameOver();
      return;
    }
    const [x, y] = cords;
    this.matrix.data[x][y] = 2;
    this.pushState([ -1, this.matrix.data]);
    this.printState();
    
    setTimeout(() => {
      this.moveNext();
    }, TIMEOUT);
  }

  moveNext(): void {
    const predictionPromiseLike = this.predictNextDirection();
    const predictionFn = (predictions: number[]) => {
      if (predictions.every(p => { return p == 0 })) {
        this.showGameOverMessage();
        this.handleGameOver();
      } else {
        const findMaxNumIndexInArray = (arr: number[]) => {
          let maxNum = Math.max.apply(null, arr);
          let maxIndex = -1;
          arr.forEach((num: number, index: number) => {
            if (num >= maxNum) {
              maxIndex = index;
              return;
            }
          });
          return maxIndex;
        };
        this.prevPredictions = this.lastPredictions;
        this.prevMovementDirection = this.lastMovementDirection;
        const dir = findMaxNumIndexInArray(predictions);
        // We will use this state to optimize the training performance later
        this.lastPredictions = predictions;
        this.lastMovementDirection = dir;
        console.log(`AI predictions ==> ${predictions}, dir ===> ${dir}`);
        console.log(`Before moving ${DIRATION[dir]}`, this.matrix.data);
        this.moveByDirection(dir);
        this.pushState([dir, this.matrix.data]);
        console.log('After moving', this.matrix.data);
        
        // Tell the programme to generate next state
        this.genNewBoardState();
      }
    };
    try {
      // promise-like return values, probably returned by tensorflow
      predictionPromiseLike.data().then(predictionFn);
    } catch(e) {
      predictionFn.call(null, predictionPromiseLike);
    }
  }

  pushState(step: any[]): void {
    this.states.push(step);
  }

  moveByDirection(dir: DIRATION): void {
    switch(dir) {
      case DIRATION.UP:
        this.moveUp();
        break;
      case DIRATION.DOWN:
        this.moveDown();
        break;
      case DIRATION.LEFT:
        this.moveLeft();
        break;
      case DIRATION.RIGHT:
        this.moveRight();
        break;
    } 
  }

  compareMatrix(matrixA: Matrix, matrixB: Matrix): boolean {
    const { data: ma, r: ra, c: ca } = matrixA;
    const { data: mb, r: rb, c: cb } = matrixB;
    if (ra !== rb || ca !== cb) return false;
    for (let i: number = 0; i < ra; i++) {
      for (let j: number = 0; j < ca; j++) {
        if (ma[i][j] !== mb[i][j]) {
          return false;
        }
      }
    }
    return true;
  }

  isMovable(dir: DIRATION): boolean {
    const originalMatrix = this.matrix.clone();
    this.moveByDirection(dir);
    if (this.compareMatrix(originalMatrix, this.matrix)) {
      this.setMatrix(originalMatrix);
      return false;
    }
    return true;
  }

  setMatrix(matrix: Matrix): void {
    this.matrix = matrix;
  }

  rotateCounterClockwise(matrix: Matrix): Matrix {
    // 逆时针旋转90度相当于顺时针旋转270度，先这么来吧，后边再优化
    return this.rotateClockwise(matrix, 3);
  }

  /** 顺时针旋转二维矩阵，参考我的LeetCode AC case
   *  https://leetcode.com/submissions/detail/16339569/
     * input:
     * [
     *  [1, 2], 
     *  [3, 4]
     * ]
     * 
     * output:
     * 
     * [
     *  [4, 1], 
     *  [3, 2]
     * ]
     * 
     * 即
     * 【
     *    A(0,0), ....., A(0, j+c-1),
     *    ....
     *    A(r-1,0), ....., A(r-1, j+c-1),
     *  】
     * 进行顺时针旋转有如下的变换关系，记起始变换位置为(x, y)，blablabla
     * 
     */
  rotateClockwise(matrix: Matrix, rotateTimes: number = 1): Matrix {
    const tmpMatrix = matrix.clone();
    let { data, r, c } = tmpMatrix;
    let modedRotateTimes = rotateTimes % 4;
    while (modedRotateTimes--) {
      for (let i: number = 0, len = r; i < ~~(r/2); i++, len -= 2) {
        for (let j: number = i; j < c-i-1; j++) {
          let t: number = data[i][j];
          data[i][j] = data[i+len-1 - (j-i)][i];
          data[i+len-1 - (j-i)][i] = data[i+len-1][i+len-1 - (j-i)];
          data[i+len-1][i+len-1 - (j-i)] = data[j][i+len-1];
          data[j][i+len-1] = t;
        }
      }
    }
    return tmpMatrix;
  }

  moveUp(): void {
    // 相当于顺时针旋转，右移，再进行逆时针旋转
    const tmpMatrix = this.rotateClockwise(this.matrix);
    this.setMatrix(tmpMatrix);
    
    this.moveRight();

    const targetMatrix = this.rotateCounterClockwise(this.matrix);
    this.setMatrix(targetMatrix);
  }
  moveDown(): void {
    // 相当于逆时针旋转，右移，再进行顺时针旋转
    const tmpMatrix = this.rotateCounterClockwise(this.matrix);
    this.setMatrix(tmpMatrix);
    
    this.moveRight();

    const targetMatrix = this.rotateClockwise(this.matrix);
    this.setMatrix(targetMatrix);
  }

  moveLeft(): void {
    const shiftedMatrix = this.shiftLeft(this.matrix);
    const accumulatedMatrix = this.accumulateLeft(shiftedMatrix);
    this.setMatrix(accumulatedMatrix);
  }

  moveRight(): void {
    const shiftedMatrix = this.shiftRight(this.matrix);
    const accumulatedMatrix = this.accumulateRight(shiftedMatrix);
    this.setMatrix(accumulatedMatrix);
  }

  shiftLeft(matrix: Matrix): Matrix {
    const tmpMatrix = matrix.clone();
    const { data, r, c } = tmpMatrix;
    for (let i: number = 0; i < r; i++) {
      const zeroArr = [];
      const tmp = [];
      for (let j: number = 0; j < c; j++) {
        if (data[i][j] === 0) {
          zeroArr.push(0);
        } else {
          tmp.push(data[i][j]);
        }
      }
      data[i] = tmp.concat(zeroArr);
    }
    return tmpMatrix;
  }

  accumulateLeft(matrix: Matrix): Matrix {
    const tmpMatrix = matrix.clone();
    const { data, r, c } = tmpMatrix;
    for (let i: number = 0; i < r; i++) {
      for (let j: number = 0; j < c; j++) {
        if (data[i][j] === 0 && data[i][j + 1] >0 ) {
          data[i][j] = data[i][j+1];
          data[i][j + 1] = 0;
        } else if (data[i][j] !== 0 && data[i][j] === data[i][j + 1]) {
          data[i][j] *= 2;
          this.score += data[i][j];
          data[i][j + 1] = 0;
        }
      }
    }
    return tmpMatrix;
  }

  shiftRight(matrix: Matrix): Matrix {
    const tmpMatrix = matrix.clone();
    const { data, r, c } = tmpMatrix;
    for (let i: number = 0; i < r; i++) {
      const row = [];
      for (let j: number = 0; j < c; j++) {
        if (data[i][j] === 0) {
          row.unshift(0);
        } else {
          row.push(data[i][j]);
        }
      }
      data[i] = row;
    }
    return tmpMatrix;
  }

  accumulateRight(matrix: Matrix): Matrix {
    const tmpMatrix = matrix.clone();
    const { data, r, c } = tmpMatrix;
    for (let i: number = 0; i < r; i++) {
      for (let j: number = c - 1; j > 0; j--) {
        if (data[i][j] === 0 && data[i][j - 1] >0 ) {
          data[i][j] = data[i][j-1];
          data[i][j - 1] = 0;
        } else if (data[i][j] !== 0 && data[i][j] === data[i][j - 1]) {
          data[i][j] *= 2;
          this.score += data[i][j];
          data[i][j - 1] = 0;
        }
      }
    }
    return tmpMatrix;
  }

  isGameOver(): boolean {
    return false;
  }

  genRandomCordinate(): number[] {
    const cords = this.findEmptyCordinates();
    if (cords.length) {
      return cords[Math.floor(Math.random() * cords.length)];
    } else {
      return [];
    }
  }
  
  findEmptyCordinates(): number[][] {
    const { data } = this.matrix;
    const cordinates: any[] = [];
    data.forEach((row, x) => {
      row.forEach((item, y) => {
        if (item === 0) {
          cordinates.push([x, y]);
        }
      });
    });
    return cordinates;
  }
}

export default Game;