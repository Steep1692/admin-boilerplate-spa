import Entity from './Entity';

export class Tag implements Entity {
  public id?: string;
  public name = '';

  constructor(initData: Partial<Tag>) {
    Object.assign(this, initData);
  }
}
