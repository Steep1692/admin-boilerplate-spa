import Entity from './Entity';

export class Product implements Entity {
  public id?: string;
  public name = '';
  public categoryId = '';
  public description = '';
  public thumbnail = '';

  constructor(initData: Partial<Product>) {
    Object.assign(this, initData);
  }
}
