import { CrudEndpoint } from '../common/CrudEndpoint';
import { TagDTO } from '../dto/TagDTO';

export class TagCRUD extends CrudEndpoint<TagDTO> {
  constructor() {
    super('tags');
  }
}
