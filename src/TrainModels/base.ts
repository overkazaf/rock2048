import * as tf from '@tensorflow/tfjs';
interface baseAIInterface {
  predict(inputs: number[]): any[];
  train(inputs: number[], labels: number[]): void;
}
export class
BaseModel implements baseAIInterface {
  predict(inputs: number[]): any[] {
    throw new Error('Implement this predict function in sub class');
  }

  train(inputs: number[], labels: number[]): void {
    throw new Error('Implement this train function in sub class');
  }

  // loss(predictedYs: number[], labels: number[]): number {
  //   const meanSquareError = predictedYs
  //     .sub(tf.tensor(labels))
  //     .square()
  //     .mean();
  //   return meanSquareError;
  // }
}