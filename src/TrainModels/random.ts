import { BaseTrainModel } from './base';
import tf from '@tensorflow/tfjs';
import { DIRATION } from '../enums/direction';

export class RandomTrainModel extends BaseTrainModel {
  weights: number[] = [];
  biases: number[] = [];
  
  constructor() {
    super();
    this.randomize();
  }

  predict(inputs: number[][]): number[] {
    const directions = [
      DIRATION.UP,
      DIRATION.DOWN,
      DIRATION.LEFT,
      DIRATION.RIGHT,
    ];
    const ys = directions.map(dir => {
      return this.weights[0] * inputs[0][dir] +
        this.weights[1] * inputs[1][dir]+
        this.weights[2] * inputs[2][dir] +
        this.biases[0];
    });
    const sum = ys.reduce((prev, curr) => {
      return prev + curr;
    }, 0.0);
    const normalizedYs = ys.map(y => y / sum);
    return normalizedYs;
  }

  train(inputs: number[], labels: number[]): void {
    // 根据inputs和labels进行weights和biases的参数调整，在随机算法中，我们直接把参数给随机好了。。
    this.randomize();
  }

  randomize(): void {
    // 随机生成所有模型参数
    // 在预测下一次移动过程中，哪个方向的可能性最大，我们假设因素为几个：
    // 1. 下一个状态中剩余的空余格子数
    // 2. 当前移动所增加的分值
    // 3. 下一个状态中，"2"存在的个数（原因是2越多，下一次合并的可能性越大，也可以优化为连续数值相同的个数）
    this.weights[0] = Math.random();
    this.weights[1] = Math.random();
    this.weights[2] = Math.random();
    // this.weights[3] = 10;
    this.biases[0] = Math.random();
  }
}