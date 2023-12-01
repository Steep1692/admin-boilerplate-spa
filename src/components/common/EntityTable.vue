<template>
  <v-container fluid class="py-2">
    <router-view name="editDialog" />

    <v-row>
      <v-col>
        <v-data-table-server
          :headers="state.headers"
          :items="state.items"
          :items-length="state.total"
          :items-per-page="state.options.itemsPerPage"
          :page="state.options.page"
          :sort-by="state.options.sortBy"
          :search="state.options.search"
          :loading="state.loading"
          :hide-default-footer="true"
          class="elevation-1"
          @update:options="setOptions"
        >
          <template #top>
            <slot name="top">
              <TableHeader :store-path="storePath">
                <template #left>
                  <slot name="top-left" />
                </template>
                <template #right>
                  <slot name="top-right" />
                </template>
              </TableHeader>

              <v-divider />
            </slot>
          </template>
          <template
            v-for="header in state.editableHeaders"
            #[`item.${header.value}`]="{ item }"
          >
            <slot :name="header.value" :item="item" />
          </template>

          <template #[`item.previewImage`]="{ item }">
            <img
              :src="item.columns.previewImage"
              :alt="item.columns.previewImage"
              width="50"
              height="50"
            />
          </template>

          <template #[`item.template`]="{ item }">
            <img
              :src="item.columns.template"
              :alt="item.columns.template"
              width="50"
              height="50"
            />
          </template>

          <template #[`item.sizeQuantities`]="{ item }">
            <slot
              v-for="(count, size) in item.columns.sizeQuantities"
              :size="size"
              :count="count"
            >
              {{ size }}
              :{{ count }}
              <br :key="size" />
            </slot>
          </template>

          <template #[`item.hexValue`]="{ item }">
            <v-icon large :color="item.columns.hexValue"> mdi-square-rounded </v-icon>
          </template>

          <template #[`item.colors`]="{ item }">
            <slot
              v-for="(color, name) in item.columns.colors"
              :color="color"
              :name="name"
            >
              <v-icon large :color="color"> mdi-square-rounded </v-icon>
              <br :key="color" />
              {{ color }}
              <br :key="color" />
            </slot>
          </template>

          <template #[`item.price`]="{ item }">
            <slot> {{ item.columns.price }}$ </slot>
          </template>

          <template #[`item.tags`]="{ item }">
            <v-chip-group v-for="tagId in item.columns.tags" :key="tagId">
              <v-chip>
                <slot name="tagChipContent" :tagId="tagId"></slot>
              </v-chip>
            </v-chip-group>
          </template>

          <template #[`item.totalPrice`]="{ item }">
            <slot> {{ item.columns.totalPrice }}$ </slot>
          </template>

          <template #[`item.actions`]="{ item }">
            <v-btn icon elevation="0" @click="showDialog(item.raw)">
              <v-icon> mdi-pencil-box-outline </v-icon>
            </v-btn>
          </template>

          <template #bottom>
            <v-divider />
            <slot name="bottom">
              <Pagination :total="state.total" :store-path="storePath" />
            </slot>
          </template>
        </v-data-table-server>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { reactive, watch, onMounted, computed, defineComponent } from 'vue';
import { Store } from 'vuex';
import { RootState } from '../../store/Store';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { watchItems } from '../composables/getItems';
import { EntityType } from '../../store/entityModules/types';
import { ITableHeader } from '../../models/filters/Filters';
import { getEntityStorePath } from '../../store/entityModules/utils';
import { PropType } from 'vue';
import TableHeader from './TableHeader.vue';
import Pagination from './Pagination.vue';
import { VDataTableServer } from 'vuetify/labs/components';
import Entity from '@/models/entities/Entity';

interface TableOptions {
  itemsPerPage: number;
  page: number;
  search: string;
  sortBy: { key: string; order: 'asc' | 'desc' }[];
}

interface State {
  loading: boolean;
  items: Entity[];
  total: number;
  headers: any[];
  editableHeaders: any[];
  options: TableOptions;
}

const Component = defineComponent({
  name: 'EntityTable',

  components: {
    VDataTableServer,
    TableHeader,
    Pagination,
  },

  props: {
    headers: {
      type: Array<ITableHeader>,
      default: () => [],
    },
    entityType: {
      type: String as PropType<EntityType>,
      default: '',
    },
  },

  setup(props) {
    const store: Store<RootState> = useStore();
    const storePath = getEntityStorePath(props.entityType);
    const router = useRouter();

    onMounted(() => {
      const searchHeaders = searchableHeaders(props.headers);
      if (searchHeaders.length > 0)
        store.dispatch(`${storePath}/setSearchHeaders`, searchableHeaders(props.headers));
    });

    const state = reactive({
      loading: computed(() => store.getters[`${storePath}/loading`]),
      items: computed(() => store.getters[`${storePath}/items`]),
      total: computed(() => store.getters[`${storePath}/count`]),
      headers: props.headers,
      editableHeaders: editableHeaders(props.headers),
      options: {
        page: computed(() => store.getters[`${storePath}/queryPage`]),
        itemsPerPage: computed(() => store.getters[`${storePath}/queryRowsPerPage`]),
        search: computed(() => store.getters[`${storePath}/getSearchValue`] || ''),
        sortBy: [],
      },
    }) as State;
    watchItems(storePath);

    // update module sorting query (sortBy) if sorting changed in table
    watch(
      () => state.options,
      (newVal, oldVal) => {
        if (newVal.sortBy !== oldVal.sortBy) {
          store.dispatch(`${storePath}/setQuerySorting`, newVal.sortBy);
        }
      },
      { immediate: false, deep: true },
    );

    function setOptions(options: TableOptions) {
      store.dispatch(`${storePath}/setQuerySorting`, options.sortBy);
    }

    function searchableHeaders(headers: ITableHeader[]) {
      return headers.filter((header: ITableHeader) => header.searchable);
    }

    function editableHeaders(headers: ITableHeader[]) {
      return headers.filter((header: ITableHeader) => header.editable);
    }

    async function showDialog(item: any) {
      router.push(router.currentRoute.value.path + `/${item.id}`);
    }
    function totalPages() {
      if (!state.total) return 0;
      return (
        Math.floor(state.total / state.options.itemsPerPage) +
        (state.total % state.options.itemsPerPage ? 1 : 0)
      );
    }
    function getDropdownItems() {
      return [5, 20, 50, 100];
    }

    return {
      state,
      showDialog,
      storePath,
      totalPages,
      getDropdownItems,
      setOptions,
    };
  },
});
export default Component;
</script>

<style scoped></style>
