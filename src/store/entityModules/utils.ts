import { EntityType } from './types';

export function getEntityStorePath(entityType: EntityType): string {
  switch (entityType) {
    case EntityType.PRODUCT:
      return 'productsModule';
    case EntityType.CATEGORY:
      return 'categoriesModule';
    case EntityType.TAG:
      return 'tagsModule';
    default:
      console.error('No entity module matches provided entity type');
      return '';
  }
}
