import Mapper from '../../models/mappers/Mapper';
import { ActionTree, GetterTree, Module, MutationTree } from 'vuex';
import Entity from '../../models/entities/Entity';
import { getEntityApiClient } from '../../api/utils/GetClient';
import { getEntityMapper } from '../../models/mappers/utils';
import { ISortFilter } from '../../models/filters/Filters';
import { QueryFilters } from '../../models/filters/QueryFilters';
import { EntityType } from '../entityModules/types';
import clone from 'lodash/clone';
import { AlertColor, AlertMessageData, dispatchAlert } from '../../utils/alerts';

export interface IModuleState<Item extends Entity, _ItemDTO> {
  items: Item[];
  allItems: Item[];
  selectedItem: Item | null;
  count: number;
  loading: boolean;
  queryFilters: QueryFilters;
  entityType: EntityType;
}

class CrudModule<Item extends Entity, ItemDTO extends Object>
  implements Module<IModuleState<Item, ItemDTO>, any>
{
  namespaced: boolean = true;

  state: IModuleState<Item, ItemDTO> = {
    items: [],
    allItems: [],
    selectedItem: null,
    count: 0,
    loading: false,
    queryFilters: new QueryFilters({}),
    entityType: EntityType.ENTITY,
  };

  getters: GetterTree<IModuleState<Item, ItemDTO>, any> = {
    items(state): Array<Item> {
      return state.items;
    },
    allItems(state): Array<Item> {
      return state.allItems;
    },

    count(state): number {
      return state.count;
    },

    selectedItem(state): Item | null {
      return clone(state.selectedItem);
    },

    loading(state): boolean {
      return state.loading;
    },

    /** Query filters */
    queryFilters(state): Readonly<QueryFilters> {
      return state.queryFilters;
    },
    queryRowsPerPage(state): number {
      return state.queryFilters.rowsPerPage;
    },
    queryPage(state): number {
      return state.queryFilters.page;
    },
    querySorting(state) {
      return state.queryFilters.sortFilter;
    },
  };

  actions: ActionTree<IModuleState<Item, ItemDTO>, any> = {
    // fetch both items list and total value
    async fetchItems({ state, commit, dispatch }): Promise<void> {
      commit('setLoading', true);

      try {
        const apiClient = getEntityApiClient(state.entityType);
        const response = await apiClient.fetchItems(state.queryFilters);
        commit('setItems', response);
      } catch (err) {
        console.error(err);
        dispatchAlert(
          AlertColor.ERROR,
          {
            entityName: state.entityType,
            action: 'fetch',
          },
          dispatch,
        );
      } finally {
        commit('setLoading', false);
      }
    },

    async fetchAllItems({ state, dispatch }, filter: QueryFilters): Promise<Item[]> {
      try {
        const apiClient = getEntityApiClient(state.entityType);
        const response: ItemDTO[] = await apiClient.fetchItems(filter);
        const mapper = <Mapper<Item, ItemDTO>>getEntityMapper(state.entityType);
        const items = response.map(x => mapper.mapFromDTO(x)) ?? [];
        return items;
      } catch (err) {
        console.error(err);
        dispatchAlert(
          AlertColor.ERROR,
          {
            entityName: state.entityType,
            action: 'fetch',
          },
          dispatch,
        );
        return [];
      }
    },

    async fetchItem({ state, commit, dispatch }, itemId: string) {
      commit('setLoading', true);

      try {
        const apiClient = getEntityApiClient(state.entityType);
        const response = await apiClient.fetchItem(<string>itemId);
        if (!response) return null;

        const mapper = <Mapper<Item, ItemDTO>>getEntityMapper(state.entityType);
        const item = mapper.mapFromDTO(response);
        commit('setSelectedItem', item);
        return item;
      } catch (err) {
        console.error(err);
        dispatchAlert(
          AlertColor.ERROR,
          {
            entityName: state.entityType,
            action: 'fetch',
            id: itemId,
          },
          dispatch,
        );
      } finally {
        commit('setLoading', false);
      }
    },

    async updateItem({ state, commit, dispatch }, newItem: Item) {
      commit('setLoading', true);

      const alertData: AlertMessageData = {
        entityName: state.entityType,
        action: 'save',
        id: newItem.id,
      };

      try {
        const apiClient = getEntityApiClient(state.entityType);
        const mapper = <Mapper<Item, ItemDTO>>getEntityMapper(state.entityType);
        const response = await apiClient.updateItem(newItem.id, mapper.mapToDTO(newItem));
        if (!response) return null;

        const item = mapper.mapFromDTO(response);

        commit('updateItem', item.id, item);
        commit('setSelectedItem', item);

        dispatchAlert(AlertColor.SUCCESS, alertData, dispatch);
        return item;
      } catch (err) {
        console.error(err);
        dispatchAlert(AlertColor.ERROR, alertData, dispatch);
        return err;
      } finally {
        commit('setLoading', false);
      }
    },

    async addItem({ state, commit, dispatch }, newItem: Item) {
      commit('setLoading', true);

      const alertData: AlertMessageData = {
        entityName: state.entityType,
        action: 'add',
        single: true,
      };

      try {
        const apiClient = getEntityApiClient(state.entityType);
        const mapper = <Mapper<Item, ItemDTO>>getEntityMapper(state.entityType);

        const response = await apiClient.addItem(mapper.mapToDTO(newItem));
        if (!response) return null;

        const item = mapper.mapFromDTO(response);

        commit('addItem', item);
        commit('setSelectedItem', item);

        dispatchAlert(AlertColor.SUCCESS, alertData, dispatch);
        return item;
      } catch (err) {
        console.error(err);
        dispatchAlert(AlertColor.ERROR, alertData, dispatch);
        return err;
      } finally {
        commit('setLoading', false);
      }
    },

    async deleteItem({ state, commit, dispatch }, itemId: string) {
      commit('setLoading', true);

      const alertData: AlertMessageData = {
        entityName: state.entityType,
        action: 'delete',
        id: itemId,
      };

      try {
        const apiClient = getEntityApiClient(state.entityType);
        const response = await apiClient.deleteItem(<string>itemId);
        if (!response) return null;
        commit('deleteItem', itemId);
        dispatchAlert(AlertColor.SUCCESS, alertData, dispatch);
      } catch (err) {
        console.error(err);
        dispatchAlert(AlertColor.ERROR, alertData, dispatch);
      } finally {
        commit('setLoading', false);
      }
    },
    async fetchCount({ state, commit, dispatch }) {
      commit('setLoading', true);

      try {
        const apiClient = getEntityApiClient(state.entityType);
        const response = (await apiClient.fetchCount()) as { count: number };
        commit('setCount', response.count);
      } catch (err) {
        console.error(err);
        dispatchAlert(
          AlertColor.ERROR,
          {
            entityName: state.entityType,
            action: 'fetch',
          },
          dispatch,
        );
      } finally {
        commit('setLoading', false);
      }
    },

    async uploadThumbnail({ state, commit, dispatch }, { itemId, thumbnailFile }: { itemId: string; thumbnailFile: File }) {
      commit('setLoading', true);

      const alertData: AlertMessageData = {
        entityName: state.entityType,
        action: 'thumbnail upload',
        single: true,
      };

      try {
        const apiClient = getEntityApiClient(state.entityType);
        const thumbnailUrl = await apiClient.uploadThumbnail(itemId, thumbnailFile);
        if (!thumbnailUrl) return null;

        commit('updateItem', itemId, { thumbnail: thumbnailUrl });

        dispatchAlert(AlertColor.SUCCESS, alertData, dispatch);

        return thumbnailUrl;
      } catch (err) {
        dispatchAlert(AlertColor.ERROR, alertData, dispatch);
        return err;
      } finally {
        commit('setLoading', false);
      }
    },

    async deleteThumbnail({ state, commit, dispatch }, itemId: string) {
      commit('setLoading', true);

      const alertData: AlertMessageData = {
        entityName: state.entityType,
        action: 'thumbnail delete',
        single: true,
      };

      try {
        const apiClient = getEntityApiClient(state.entityType);
        const response = await apiClient.deleteThumbnail(itemId);
        if (!response) {
          return;
        }

        commit('deleteItem', itemId);

        dispatchAlert(AlertColor.SUCCESS, alertData, dispatch);
      } catch (err) {
        console.error(err);
        dispatchAlert(AlertColor.ERROR, alertData, dispatch);
        return err;
      } finally {
        commit('setLoading', false);
      }
    },

    setSelectedItem({ commit }, selectedItem: Item) {
      commit('setSelectedItem', selectedItem);
    },

    /** FILTERING */
    setQueryRowsPerPage({ commit }, value: number) {
      commit('setQueryFilters', { rowsPerPage: value });
    },

    setQueryPage({ commit }, value: number) {
      commit('setQueryFilters', { page: value });
    },

    setQuerySorting({ commit }, sortFilter: ISortFilter[] | undefined) {
      commit('setQueryFilters', { sortFilter });
    },
  };

  mutations: MutationTree<IModuleState<Item, ItemDTO>> = {
    setItems(state, items: Array<ItemDTO>) {
      try {
        const mapper = <Mapper<Item, ItemDTO>>getEntityMapper(state.entityType);
        state.items = mapper.mapFromDTOList(items);
      } catch (e) {
        console.error(e);
      }
    },
    setAllItems(state, items: Array<ItemDTO>) {
      try {
        const mapper = <Mapper<Item, ItemDTO>>getEntityMapper(state.entityType);
        state.allItems = mapper.mapFromDTOList(items);
      } catch (e) {
        console.error(e);
      }
    },
    setCount(state, count: number) {
      state.count = count;
    },

    setSelectedItem(state, selectedItem: Item) {
      state.selectedItem = selectedItem;
    },

    updateItem(state, item: Item) {
      const index = state.items.findIndex((i: Item) => i.id === item.id);
      if (index !== -1) state.items.splice(index, 1, item);
    },

    setLoading(state, value: boolean) {
      state.loading = value;
    },

    setQueryFilters: (state, queryFilters: Partial<QueryFilters>) => {
      // need reassign to trigger the watcher
      const queryFiltersCopy = clone(state.queryFilters);
      Object.keys(queryFilters).forEach(key => {
        // @ts-ignore
        queryFiltersCopy[key] = queryFilters[key];
      });
      state.queryFilters = queryFiltersCopy;
    },

    addItem(state, item: Item) {
      state.items.push(item);
      state.count += 1;
    },

    deleteItem(state, itemId: string) {
      state.items.splice(
        state.items.findIndex(i => i.id === itemId),
        1,
      );
      state.count -= 1;
    },
  };
}

export { CrudModule };
