import { BaseModel } from './base';
import { DIRECTION } from '../enums/direction';
import *  as tf from '@tensorflow/tfjs';

export class NNModel extends BaseModel {
  weights: any[] = [];
  biases: any[] = [];
  hiddenSize: number;
  inputSize: number;
  outputSize: number;
  optimizer: any;
  
  constructor(
    inputSize: number = 12,
    hiddenSize: number = inputSize * 2,
    outputSize: number = 4, // 标识最终输入的预测方向向量
    learningRate = 0.01,
  ) {
    super();
    this.hiddenSize = hiddenSize;
    this.inputSize = inputSize;
    this.outputSize = outputSize;
    // Using ADAM optimizer, we can compare it with SDG, AdaGrad and also Momentum optimizer
    this.optimizer = tf.train.adam(learningRate);

    this.weights = [];
    this.biases = [];
  }

  init(): void {
    // for hidden layer
    console.log(
      'this',
      this.inputSize,
      this.hiddenSize,
      this.outputSize,
    );
    this.weights[0] = tf.variable(
      tf.randomNormal([this.inputSize, this.hiddenSize])
    );
    this.biases[0] = tf.variable(tf.scalar(Math.random()));
    
    // for output layer
    this.weights[1] = tf.variable(
      tf.randomNormal([this.hiddenSize, this.outputSize])
    );

    this.biases[1] = tf.variable(tf.scalar(Math.random()));
  }
  
  calWeightedScore(inputs: number) {
    const [ empty, s, e2 ] = inputs;

    return [
      ...empty,
      ...s,
      ...e2,
    ];

    // return empty.map((e: number, index: number) => {
    //   if (e == -1) return 0;
    //   else {
    //     return e + s[index] * e2[index];
    //   }
    // });
  }
  // 返回一个promise对象
  predict(inputs: number[]): any[] {
    const x = tf.tensor([
      this.calWeightedScore(inputs)
    ]);
    const prediction = tf.tidy(() => {
      const hiddenLayer = tf.sigmoid(x.matMul(this.weights[0]).add(this.biases[0]));
      const outputLayer = tf.sigmoid(hiddenLayer.matMul(this.weights[1]).add(this.biases[1]));
      return outputLayer;
    });
    return prediction;
  }

  fit(inputs: number[], labels: number[], trainingCount: number = 100): void {
    for (let i: number = 0; i < trainingCount; i++) {
      this.train(inputs, labels);
    }
  }

  train(inputs: number[], labels: number[]): void {
    this.optimizer.minimize(() => {
      const predictedYs = this.predict(inputs);
      // 计算评价值，默认用均方差，值越小说明拟合效果越好
      return this.loss(predictedYs, labels);
    });
  }
}