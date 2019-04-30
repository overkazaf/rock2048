import { algo } from './algorithm';
import { Matrix } from './matrix';
import { DIRECTION } from './enums/direction';
import * as Models from './TrainModels/index';

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const {
  RandomModel,
  NNModel,
} = Models;
const SWITCH_PLAYER_TIMEOUT = 0;
const RESTART_COUNT = process.argv[2] || 5;

interface GameBaseInterface {
  isGameOver(): boolean;
  genRandomUsableCoordinate(): void;
  findEmptyCoordinates(): number[][];
}

type DataSet = {
  inputs: number[][];
  labels: number[];
}

const trainingDataSet: any = {
  inputs: [],
  labels: [],
};

class Game implements algo, GameBaseInterface {
  matrix: Matrix;
  score: number;
  isOver: boolean;
  timer: any;
  lastMatrixShadow: any;
  states: any[];
  trainModel: any;
  trainRecords: any[];
  lastPredictions: number[];
  prevPredictions: number[];
  prevMovementDirection: DIRECTION | null;
  lastMovementDirection: DIRECTION | null;
  lastState: number[][];
  prevState: number[][];
  restartCount: number;

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
    this.trainRecords = [];
    this.prevPredictions = [];
    this.lastPredictions = [];
    this.lastState = [];
    this.prevState = [];
    this.prevMovementDirection = null;
    this.lastMovementDirection = null;
    this.trainModel = new NNModel();
    this.trainModel.init();
    this.restartCount = RESTART_COUNT;
  }

  resetMatrix(): void {
    this.score = 0;
    this.matrix = new Matrix(
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]
    );
  }

  printState(prefix?: string): void {
    const { data } = this.matrix;
    console.log(chalk.yellow(`\nCurrent score: ${this.score}, board state: `));
    data.forEach(row => {
      const current: number[] = [];
      row.forEach(item => {
        current.push(<number>item);
      });
      console.log(chalk.green(`[ ${current.join(',')} ]`));
    });
    console.log('\n');
  }

  predictNextDirection() {
    this.prevState = this.lastState;
    console.log(
      `original score: ${this.score}`,
    );
    const currentState = this.convertBoardStateToVector();

    console.log(
      'currentState in predictNextDirection\n',
      chalk.red(`emptyBlockCounts, scores, existed2Counts`),
    );
    console.table(
      currentState.map((r: number[], i: number) => {
        return r.map((c: number) => {
          if (i === 0) return `empty ${c}`;
          else if (i === 1) return `score ${c}`;
          else return `2counts ${c}`;
        })
      }),
    );

    this.lastState = currentState;
    return this.trainModel.predict(currentState);
  }

  genNextRandomDirection(): DIRECTION {
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
      case DIRECTION.UP:
        // 上次是向上移动挂掉的，同理是可以向下的，下次记得向下做一次尝试，至少不会太差。
        label = [0, 1, 0, 0];
        break;
      case DIRECTION.DOWN:
        label = [1, 0, 0, 0];
        break;
      case DIRECTION.LEFT:
        label = [0, 0, 0, 1];
        break;
      case DIRECTION.RIGHT:
        label = [0, 0, 1, 0];
        break;
    }

    console.log(
      'lastState',
      // this.convertBoardStateToVector(),
      DIRECTION[this.lastMovementDirection],
      this.lastMatrixShadow,
      label,
    );

    
    trainingDataSet.inputs.push(this.convertBoardStateToVector(this.lastMatrixShadow));
    trainingDataSet.labels.push(label);
    
    if (this.findCurrentMaxNumber() < 2048 && this.restartCount-- > 0) {
      // this.trainRecords.push([ 
      //   this.findCurrentMaxNumber(), 
      //   [this.trainModel.weights, this.trainModel.biases]
      // ]);
      setTimeout( () => {
        this.resetMatrix();
        this.start();
      }, 50);
    } else {
      console.log(
        'Current max value in the matrix',
        this.findCurrentMaxNumber(),
      );
      console.table(
        trainingDataSet.inputs[0],
      )
      console.table(
        trainingDataSet.inputs[1],
      )
      console.table(
        trainingDataSet.labels,
      )

      fs.writeFileSync(path.join(__dirname, `trained_${new Date()}.json`), JSON.stringify(trainingDataSet))
    }

    // console.info(
    //   'Training',
    //   'lastMovementDirection ==>',
    //   DIRECTION[lastMovementDirection],
    //   'lastState ==> ',
    //   lastState,
    //   'label ==> ',
    //   label,
    // );
    // this.trainingModel.fit(trainingDataSet.inputs, trainingDataSet.labels);
  }

  getOptimizedStateToVector() {
    const directions = [ DIRECTION.UP, DIRECTION.DOWN, DIRECTION.LEFT, DIRECTION.RIGHT ];
    const originalMatrix = this.matrix.clone();

    // 这里可以做一些DFS的优化，进行深度移动的尝试，搜索从某个方向开始，在N次移动后的分值
    // 必要的时候可以memorized，后续做剪枝

    const board: any = {
      [DIRECTION.UP]: [],
      [DIRECTION.DOWN]: [],
      [DIRECTION.LEFT]: [],
      [DIRECTION.RIGHT]: [],
    };

    const dfs = (startDir: DIRECTION, paths: DIRECTION[], depth: number = 4) => {
      if (depth === 0) {
        // 递归结束，还原矩阵
        this.setMatrix(originalMatrix);
        return;
      }
      
      let emptyBlockCounts: number[] = [];
      let scores: number[] = [];
      let existed2Counts: number[] = [];
      directions.forEach(dir => {
        const oldScore = this.score;
        if (!this.isDirMovable(dir)) {
          emptyBlockCounts.push(0);
        } else {
          this.moveByDirection(dir);
          emptyBlockCounts.push(this.findEmptyCoordinates().length);
        }
        scores.push(this.score);
        existed2Counts.push(this.findCurrentMaxNumber());
        
        const rMatrix = this.matrix.clone();
        const newPaths = [...paths];
        newPaths.push(dir);

        console.log('newPaths', newPaths.join('-'));

        // if (emptyBlockCounts.length === 4 && depth === 1) {
        //   // 只放入最后第depth次移动的结果，根据其分值进行预测
        //   board[startDir].push({
        //     emptyBlockCounts,
        //     scores,
        //     existed2Counts,
        //   });
        // }
        
        board[paths.join('-')] = {
          score: this.score,
          state: rMatrix.data,
        };

        dfs(startDir, newPaths, depth - 1);
        this.score = oldScore;
        this.setMatrix(rMatrix);
        newPaths.pop();
      });
    };
    this.setMatrix(originalMatrix);

    directions.forEach(dir => {
      dfs(dir, [], 3);
    });

    // 对比maxState与state的评分，我们用相应的权重做加权对比
    const ys = (givenState: any) => {
      return directions.map(dir => {
        if (givenState.emptyBlockCounts[dir] === 0) return 0;
        return this.trainModel.weights[0] * givenState.emptyBlockCounts[dir] || 0 +
        this.trainModel.weights[0] * givenState.scores[dir] || 0 +
        this.trainModel.weights[0] * givenState.existed2Counts[dir] || 0 +
        this.trainModel.biases[0];
      });
    };
    
    const getMaxEvalState = (states: any[]): any => {
      let maxState = {};
      states.forEach((state: any) => {
        if (!Object.keys(maxState).length) {
          maxState = {...state};
        } else {
          const ys1 = Math.max.apply(null, ys(maxState));
          const ys2 = Math.max.apply(null, ys(state));
          if (ys2 > ys1) {
            maxState = {...state};
          }
        }
      });
      return maxState;
    };

    const dfsMaxEvaluations = () => {
      const evals = Object.keys(board).map(dir => {
        // 找到评估最高的state并返回
        return getMaxEvalState(board[dir]);
      });
      return evals;
    };

    console.log('board', board);

    const {
      emptyBlockCounts,
      scores,
      existed2Counts,
    } = getMaxEvalState(dfsMaxEvaluations());
    
    return [
      emptyBlockCounts,
      scores,
      existed2Counts,
    ];
  }

  convertBoardStateToVector(givenMatrix?: any): any {
    // return this.getOptimizedStateToVector();
    
    const directions = [ DIRECTION.UP, DIRECTION.DOWN, DIRECTION.LEFT, DIRECTION.RIGHT ];
    
    const emptyBlockCounts: number[] = [];
    const scores: number[] = [];
    const existed2Counts: number[] = [];
    
    const originalMatrix = givenMatrix || this.matrix.clone();
    
    // this.getOptimizedStateToVector();

    // console.log('Speculating matrix transformation');
    // console.table(
    //   originalMatrix.data,
    // );
    directions.forEach(dir => {
      // 从每个方向开始，递归做尝试
      const oldScore = this.score;
      if (!this.isDirMovable(dir)) {
        // 无法移动，说明存在的空格数为0，且强制记住这个值为不可移动
        emptyBlockCounts.push(-1);
        console.log(
          chalk.red(`${DIRECTION[dir]} is unreachable...`)
        );
        existed2Counts.push(0);
      } else {
        // 移动后计算分值
        this.moveByDirection(dir);
        emptyBlockCounts.push(this.findEmptyCoordinates().length);
        // console.log(
        //   chalk.red(`Trying ${DIRECTION[dir]}...`)
        // );
        // console.table(
        //   this.matrix.data,
        // );
        existed2Counts.push(this.findExistedNumberCounts());
      }
      scores.push(this.score);
      
      // 还原状态
      this.setMatrix(originalMatrix);
      // 还原分数
      this.score = oldScore;
    });
    
    return [
      emptyBlockCounts,
      scores,
      existed2Counts,
    ];
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

  checkContinousNumber(data: number[][], x: number, y: number): boolean {
    let current = data[x][y];
    let count: number = 0;
    if (data[x][y+1] && current === data[x][y+1]) count++;
    if (data[x][y-1] && current === data[x][y-1]) count++;
    if (data[x+1] && data[x+1][y] && current === data[x+1][y]) count++;
    if (data[x-1] && data[x-1][y] && current === data[x-1][y]) count++;
    return count > 0;
  }

  findExistedNumberCounts(): number {
    const { data } = this.matrix;
    const resultMap: any = {};
    data.forEach((row: number[], x: number) => {
      row.forEach((item: number, y: number) => {
        if(typeof resultMap[item] === 'undefined') resultMap[item] = 0;
        if (
            this.checkContinousNumber(data, x, y)
          ) {
          resultMap[item]++;
        }
      });
    });

    let maxCount: number = 0;
    Object.keys(resultMap).map((item: any) => {
      if (resultMap[item] > maxCount) maxCount = resultMap[item];
    });
    return maxCount;
  }

  showGameOverMessage(): void {
    console.log('');
    console.log(chalk.red(`U failed, final score:${this.score}, total steps: ${this.states.length / 2}`));
    console.log('Final 2048 game state');
    console.table(
      this.matrix.data,
    )
    console.log('');
  }

  start(): void {
    this.genNewBoardState();
  }

  genNewBoardState(): void {
    const coords = this.genRandomUsableCoordinate();
    if (!coords.length) {
      // Can't find a random position to place
      clearInterval(this.timer);
      this.showGameOverMessage();
      this.trainRecords.push([this.score, this.states]);
      this.handleGameOver();
      return;
    }
    const [x, y] = coords;
    // Try to put 2 into a valid place
    this.matrix.data[x][y] = 2;
    this.pushState([
      // marked -1 as AI's movement
      -1, this.matrix.data
    ]);
    
    if (1) {
      setTimeout(this.simulateNextMove.bind(this), SWITCH_PLAYER_TIMEOUT);
    }
  }

  simulateNextMove(): void {
    const predictionPromiseLike = this.predictNextDirection();
    const predictionFn = (predictions: number[]) => {
      console.log('predictions', predictions);
      const cannotMoveAnyMore: boolean = predictions.every(p => { return p === 0 });
      if (cannotMoveAnyMore) {
        this.showGameOverMessage();
        this.handleGameOver();
      } else {
        // 找到加权值最大的方向，选择它作为下次移动的方向
        const maxSortedPredictions = predictions.sort((a: number, b: number) => {
          return b - a;
        });
        let dir = 0;
        for (let i = 0; i < maxSortedPredictions.length; i++) {
          if (this.isDirMovable(i)) {
            dir = i;
            break;
          }
        }
        // const dir = findMaxAndMovableDirection(predictions);
        // We will use this state to optimize the training performance later
        // this.lastPredictions = predictions;
        this.lastMovementDirection = dir;
        
        console.log(`AI predictions ==> ${predictions}, dir ===> ${DIRECTION[dir]}, isMovable(${this.isDirMovable(dir)})`);
        console.log(`Before moving ${DIRECTION[dir]}`);
        console.table(
          this.matrix.data,
        )
        
        // 检查是否真正可移动
        const tmp: any = this.matrix.clone();
        this.moveByDirection(dir);
        const isTheSameMatrix = this.equalsMatrix(tmp, this.matrix);
        if (!isTheSameMatrix) {
          this.lastMatrixShadow = tmp;
          this.lastMovementDirection = dir;
        }
        this.pushState([dir, this.matrix.data]);
        console.log(`After moving ${DIRECTION[dir]}`);
        console.table(
          this.matrix.data,
        );
        
        // Tell the programme to generate next state
        this.genNewBoardState();
      }
    };
    try {
      // Promise-Like values, and these values are probably returned by tensorflow
      predictionPromiseLike.data().then((data) => {
        const exp_sum = data.reduce((prev: number, curr: number) => {
          return prev + curr
        }, 0);

        const softmaxData = data.map(d => {
          return d / exp_sum;
        });

        // console.log('softmaxData', fixedData, exp_sum, softmaxData);
        predictionFn(softmaxData);
      });
    } catch(e) {
      predictionFn.call(null, predictionPromiseLike);
    }
  }

  pushState(step: any[]): void {
    this.states.push(step);

    if (1) {
      // For debugging
      this.printState();
    }
  }

  moveByDirection(dir: DIRECTION): void {
    switch(dir) {
      case DIRECTION.UP:
        this.moveUp();
        break;
      case DIRECTION.DOWN:
        this.moveDown();
        break;
      case DIRECTION.LEFT:
        this.moveLeft();
        break;
      case DIRECTION.RIGHT:
        this.moveRight();
        break;
    } 
  }

  equalsMatrix(matrixA: Matrix, matrixB: Matrix): boolean {
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

  isDirMovable(dir: DIRECTION): boolean {
    const originalMatrix = this.matrix.clone();
    this.moveByDirection(dir);
    const isTheSameMatrix = this.equalsMatrix(originalMatrix, this.matrix);
    // 移动后重置
    this.setMatrix(originalMatrix);
    // 如果两个矩阵值不一样，说明是可移动的
    return !isTheSameMatrix;
  }

  setMatrix(matrix: Matrix): void {
    this.matrix = new Matrix([...matrix.data]);
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
        // 每次len -=2 是因为每一轮的旋转操作，都会消除最外层的两圈数字
        for (let j: number = i; j < c-i-1; j++) {
          // 可以认为是在四个象限里对四个数字进行旋转，记为 A,B,C,D，变换关系为 A->B->C->D->A
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
    // console.log(
    //   'uuuuu'
    // );
    // console.table(
    //   this.matrix.data
    // );
    const tmpMatrix = this.rotateClockwise(this.matrix);
    // console.table(
    //   tmpMatrix.data
    // );
    this.setMatrix(tmpMatrix);
    
    this.moveRight();

    // console.table(
    //   this.matrix.data
    // );

    const targetMatrix = this.rotateClockwise(this.matrix, 3);
    // console.table(
    //   targetMatrix.data
    // );
    this.setMatrix(targetMatrix);
  }
  moveDown(): void {
    // 相当于逆时针旋转，右移，再进行顺时针旋转
    // console.log(
    //   'ddddd'
    // );
    // console.table(
    //   this.matrix.data
    // );
    const tmpMatrix = this.rotateCounterClockwise(this.matrix);
    // console.table(
    //   tmpMatrix.data
    // );
    this.setMatrix(tmpMatrix);
    
    this.moveRight();
    // console.table(
    //   this.matrix.data
    // );

    const targetMatrix = this.rotateClockwise(this.matrix);
    // console.table(
    //   targetMatrix.data
    // );
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

  /**
   * 生成随机可占用的坐标点
   */
  genRandomUsableCoordinate(): number[] {
    const coords = this.findEmptyCoordinates();
    if (coords.length) {
      return coords[Math.floor(Math.random() * coords.length)];
    } else {
      return [];
    }
  }
  
  findEmptyCoordinates(): number[][] {
    const { data } = this.matrix;
    const coordinates: any[] = [];
    data.forEach((row, x) => {
      row.forEach((item, y) => {
        if (item === 0) {
          coordinates.push([x, y]);
        }
      });
    });
    return coordinates;
  }
}

export default Game;