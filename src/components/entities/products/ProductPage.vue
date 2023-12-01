<template>
  <EntityPage
    entity-type="product"
    :title="title"
    :item="state.entity"
    :thumbnail="state.thumbnail?.[0]"
    :loading="state.loading"
    :is-new="isNew()"
    :is-deletable="!isNew()"
  >
    <template #form-content>
      <div>
        <v-row align="start">
          <v-col cols="12">
            <v-file-input
              v-model="state.thumbnail"
              label="Preview Image"
              variant="outlined"
              accept="image/png, image/jpeg"
              placeholder="Pick a thumbnail image"
              prepend-icon="mdi-camera"
              :rules="rules.thumbnail"
            ></v-file-input>
          </v-col>
          <v-col v-if="thumbnailPreviewUrl" cols="12">
            <img width="100" height="100" :src="thumbnailPreviewUrl" alt="Preview image" />
            <v-btn icon @click="removeThumbnail">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="state.entity.name"
              label="Name"
              variant="outlined"
              required
              hide-details="auto"
              :rules="rules.name"
              data-test="product-name"
            />
          </v-col>
          <v-col cols="12">
            <v-select
              v-model="state.entity.categoryId"
              label="Category ID"
              variant="outlined"
              hide-details="auto"
              :items="listCategory"
              item-title="name"
              item-value="id"
              data-test="product-categoryId"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="state.entity.description"
              label="Description"
              variant="outlined"
              hide-details="auto"
              data-test="product-categoryId"
            />
          </v-col>
        </v-row>
      </div>
    </template>
  </EntityPage>
</template>

<script lang="ts">
import EntityPage from '@/components/common/EntityPage.vue';
import { defineComponent, onBeforeMount, reactive, watch, computed, ref, Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { Product } from '../../../models/entities/Product';
import { $http } from '../../../api/common/Axios';

const baseUrl = $http.defaults.baseURL;

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTE = MAX_FILE_SIZE_MB * 1024 * 1024;

interface State {
  entity: Product;
  loading: boolean;
}

const Component = defineComponent({
  name: 'ProductDialog',

  components: {
    EntityPage,
  },

  props: {
    id: {
      type: String,
      default: '',
    },
  },

  setup(props) {
    const store = useStore();
    const router = useRouter();
    const product = new Product({});
    const isNew = () => !props.id;
    let listCategory: Ref<string[]> = ref([]);
    onBeforeMount(async () => {
      if (!isNew()) {
        const res = await store.dispatch(`productsModule/fetchItem`, props.id);
        if (!res) router.back();
      }
      listCategory.value = await store.dispatch(
        'categoriesModule/fetchAllItems',
        undefined,
      );
    });

    const state = reactive({
      thumbnail: null,
      entity: product,
      loading: computed(() => store.getters['productsModule/loading']),
    }) as State;
    watch(
      () => store.getters['productsModule/selectedItem'],
      (newValue: Product) => Object.assign(product, newValue),
      { immediate: false, deep: true },
    );
    const title = computed(() => {
      if (state.loading) return '';
      if (isNew()) return 'New Product';
      const getSelectedItem = store.getters['productsModule/selectedItem'];
      return getSelectedItem.name;
    });
    const thumbnailPreviewUrl = computed(() => {
      if (state.thumbnail?.length) return URL.createObjectURL(state.thumbnail[0]);
      if (state.entity.thumbnail) return baseUrl + state.entity.thumbnail;
      return null;
    });
    const rules = {
      name: [(v: string) => !!v || 'Name is required'],
      thumbnail: [
        (v: File[]) => !v || !v.length || v[0].size < MAX_FILE_SIZE_BYTE || `Preview image size should be less than ${MAX_FILE_SIZE_MB} MB!`
      ],
    };

    function removeThumbnail() {
      state.thumbnail = null;
      state.entity.thumbnail = '';
    }

    return {
      state,
      title,
      rules,
      isNew,
      listCategory,

      baseUrl,
      thumbnailPreviewUrl,
      removeThumbnail,
    };
  },
});
export default Component;
</script>

<style scoped></style>
