import { Matrix } from './matrix';

export interface algo {
  moveUp(matrix: Matrix): void;
  moveDown(matrix: Matrix): void; 
  moveRight(matrix: Matrix): void;
  moveLeft(matrix: Matrix): void; 
  rotateClockwise(matrix: Matrix, rotateTimes: number): Matrix;
  rotateCounterClockwise(matrix: Matrix): Matrix;
}

