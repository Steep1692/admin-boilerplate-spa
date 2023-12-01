<template>
  <EntityTable :entity-type="entityType" :headers="state.headers">
    <template #tagChipContent="{tagId}">
      {{ mapTagIdToTagName.get(tagId) ?? '?' }}
    </template>
  </EntityTable>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, reactive, ref, Ref } from 'vue';
import { useStore } from 'vuex';
import { EntityType } from '../../../store/entityModules/types';
import EntityTable from '../../common/EntityTable.vue';
import { Tag } from '../../../models/entities/Tag';

const Component = defineComponent({
  name: 'ProductTable',

  components: {
    EntityTable,
  },

  setup() {
    const store = useStore();
    const entityType = EntityType.PRODUCT;

    let listTag: Ref<Tag[]> = ref([]);
    onBeforeMount(async () => {
      listTag.value = await store.dispatch(
        'tagsModule/fetchAllItems',
        undefined,
      );
    });

    const state = reactive({
      headers: [
        { title: 'Name', key: 'name', sortable: true, searchable: true },
        { title: 'Category ID', key: 'categoryId', sortable: true },
        { title: 'Description', key: 'description', sortable: false },
        { title: 'Tags', key: 'tags', sortable: false },
        { title: 'Details', key: 'actions', sortable: false },
      ],
    });

    const mapTagIdToTagName = computed(() => {
      const map = new Map();
      listTag.value.forEach((tag) => {
        map.set(tag.id, tag.name);
      });
      return map;
    });

    return {
      entityType,
      state,
      mapTagIdToTagName,
    };
  },
});
export default Component;
</script>

<style lang="scss" scoped></style>
