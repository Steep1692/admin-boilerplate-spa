<template>
  <EntityTable :entity-type="entityType" :headers="state.headers" />
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';
import { EntityType } from '../../../store/entityModules/types';
import EntityTable from '../../common/EntityTable.vue';

const Component = defineComponent({
  name: 'TagTable',

  components: {
    EntityTable,
  },

  setup() {
    const entityType = EntityType.TAG;

    const state = reactive({
      headers: [
        { title: 'Name', key: 'name', searchable: true },
        { title: 'Details', key: 'actions', align: 'end', sortable: false },
      ],
    });

    return {
      entityType,
      state,
    };
  },
});
export default Component;
</script>

<style lang="scss" scoped></style>
