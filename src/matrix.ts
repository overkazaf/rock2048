export class Matrix {
  data: number[][];
  r: number;
  c: number;
  constructor(data: number[][]) {
    this.data = data;
    this.r = data.length;
    this.c = data[0].length;
    return this;
  }
  clone(): Matrix {
    return new Matrix([...this.data]);
  }
}