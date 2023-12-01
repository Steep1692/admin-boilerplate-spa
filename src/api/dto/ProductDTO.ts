import { CategoryDTO } from './CategoryDTO';
import { TagDTO } from './TagDTO';

export interface ProductDTO {
  id?: string;
  name: string;
  categoryId?: string;
  description?: string;
  category?: CategoryDTO;
  tags?: TagDTO[];
}
