import { BaseModel } from './base';
import *  as tf from '@tensorflow/tfjs';

export class NNModel extends BaseModel {
  weights: any[] = [];
  biases: any[] = [];
  hiddenLayerSize: number;
  inputSize: number;
  outputSize: number;
  optimizer: any;
  
  constructor(
    inputSize: number = 4,
    hiddenLayerSize: number = inputSize * 2,
    outputSize: number = 2,
    learningRate = 0.1,
  ) {
    super();
    this.hiddenLayerSize = hiddenLayerSize;
    this.inputSize = inputSize;
    this.outputSize = outputSize;
    // Using ADAM optimizer
    this.optimizer = tf.train.adam(learningRate);

    this.weights = [];
    this.biases = [];
  }

  init(): void {
    // Hidden layer
    this.weights[0] = tf.variable(
      tf.randomNormal([this.inputSize, this.hiddenLayerSize])
    );
    this.biases[0] = tf.variable(tf.scalar(Math.random()));
    // Output layer
    this.weights[1] = tf.variable(
      tf.randomNormal([this.hiddenLayerSize, this.outputSize])
    );
    this.biases[1] = tf.variable(tf.scalar(Math.random()));
  }

  // 返回一个promise对象
  predict(inputs: number[]): any[] {
    const x = tf.tensor(inputs);

    const prediction = tf.tidy(() => {
      // 2*4 * 4*8 = 2*8
      // 2*8 * 8*2 = 2*2
      const hiddenLayer = tf.sigmoid(x.matMul(this.weights[0]).add(this.biases[0]));
      const outputLayer = tf.sigmoid(hiddenLayer.matMul(this.weights[1]).add(this.biases[1]));
      return outputLayer;
    });
    return prediction;
  }

  fit(inputs: number[], labels: number[], trainningCount: number = 100): void {
    for (let i: number = 0; i < trainningCount; i++) {
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