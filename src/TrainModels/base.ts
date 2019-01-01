interface baseAIInterface {
  predict(inputs: number[][]): number[];
  train(inputs: number[], labels: number[]): void;
}
export class
BaseTrainModel implements baseAIInterface {
  predict(inputs: number[][]): number[] {
    throw new Error('Implement this predict function in sub class');
  }
  train(inputs: number[], labels: number[]): void {
    throw new Error('Implement this train function in sub class');
  }
}