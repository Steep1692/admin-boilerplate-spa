<template>
  <v-card v-if="loading" data-test="dialog-preloader">
    <v-skeleton-loader type="article" />
    <v-skeleton-loader type="actions" />
  </v-card>
  <v-card v-else data-test="dialog-card">
    <!-- Dialog title -->
    <v-card-title class="headline pl-5 pr-3 d-flex align-center" data-test="dialog-title">
      <v-btn
        color="gray"
        icon
        variant="text"
        size="44px"
        :disabled="loading"
        data-test="dialog-btn-cancel"
        @click="close()"
      >
        <v-icon :size="28" color="grey-darken-1" icon="mdi-arrow-left-circle-outline" />
      </v-btn>
      <span>{{ title }}</span>
    </v-card-title>

    <v-divider />

    <v-form v-model="valid">
      <v-card-text>
        <v-container fluid class="pa-0">
          <!-- Form content (input fields, etc) goes here -->
          <slot name="form-content" />
        </v-container>
      </v-card-text>

      <v-divider />

      <v-card-actions tile class="pa-3">
        <!-- DELETE -->
        <!-- show tooltip is there are delete warning messages -->
        <v-tooltip v-if="isDeletable && deleteRules && deleteRules.length > 0" right>
          <template #activator="{ props }">
            <span v-bind="props">
              <v-btn
                color="error"
                variant="text"
                disabled
                data-test="dialog-btn-del-by-tooltip"
              >
                Delete
              </v-btn>
            </span>
          </template>
          <div v-for="(rule, i) in deleteRules" :key="i">
            {{ rule }}
          </div>
        </v-tooltip>
        <!-- if no warning messages - ask for confirmation before delete -->
        <Confirmation
          v-else-if="isDeletable"
          :confirm-message="`Are you sure you want to delete ${title}?`"
          @confirmed="deleteItem($event)"
        >
          <template #activator-btn="{ on }">
            <v-btn
              color="error"
              variant="text"
              :disabled="loading"
              v-bind="on"
              data-test="dialog-btn-del-by-conf"
            >
              Delete
            </v-btn>
          </template>
        </Confirmation>

        <v-spacer />

        <!-- CANCEL -->
        <v-btn
          color="gray"
          variant="text"
          :disabled="loading"
          data-test="dialog-btn-cancel"
          @click="close()"
        >
          Cancel
        </v-btn>

        <!-- SAVE / CREATE -->
        <v-btn
          v-if="!isNew"
          color="success"
          :disabled="!valid || loading"
          variant="text"
          data-test="dialog-btn-save"
          @click="save()"
        >
          Save
        </v-btn>
        <v-btn
          v-if="isNew"
          color="success"
          :disabled="!valid || loading"
          variant="text"
          data-test="dialog-btn-create"
          @click="create()"
        >
          Create
        </v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { EntityType } from "../../store/entityModules/types";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { PropType } from "vue";
import { getEntityStorePath } from "../../store/entityModules/utils";
import { getNounPluralForm } from "../../utils/formatting";
import Confirmation from "../utils/Confirmation.vue";
import { VSkeletonLoader } from "vuetify/labs/components";
const Component = defineComponent({
  name: "EntityDialog",

  components: {
    Confirmation,
    VSkeletonLoader,
  },
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
    thumbnail: {
      type: File,
      default: null,
    },
    title: {
      type: String,
      default: "",
    },
    entityType: {
      type: String as PropType<EntityType>,
      default: "",
    },
    loading: Boolean,
    isNew: Boolean,
    isDeletable: Boolean,
    deleteRules: {
      type: Array,
      default: () => [],
    },
  },

  setup(props) {
    const dialogVisible = true;
    const store = useStore();
    const router = useRouter();
    const valid = ref(true);
    const storePath = computed(() => getEntityStorePath(props.entityType));

    async function create() {
      // Create new item
      const resultItem = await store.dispatch(`${storePath.value}/addItem`, props.item);
      if (resultItem instanceof Error) {
        return;
      }

      // Upload thumbnail
      const resultUpdate = await store.dispatch(`${storePath.value}/uploadThumbnail`, {
        itemId: resultItem.id,
        thumbnailFile: props.thumbnail,
      });
      if (resultUpdate instanceof Error) {
        return;
      }

      close();
    }

    async function save() {
      // Update item
      const resultUpdate = await store.dispatch(`${storePath.value}/updateItem`, props.item);
      if (resultUpdate instanceof Error) {
        return;
      }

      // Update thumbnail
      if (resultUpdate.thumbnail !== props.thumbnail) {
        if (props.thumbnail) {
          const resultUpload = await store.dispatch(`${storePath.value}/uploadThumbnail`, {
            itemId: props.item.id,
            thumbnailFile: props.thumbnail,
          });

          if (resultUpload instanceof Error) {
            return;
          }
        } else {
          const resultDelete = await store.dispatch(`${storePath.value}/deleteThumbnail`, props.item.id);

          if (resultDelete instanceof Error) {
            return;
          }
        }
      }

      close();
    }

    async function deleteItem(confirmed: boolean) {
      if (!confirmed || !props.item) return;

      // Delete item
      const resultDelete = await store.dispatch(`${storePath.value}/deleteItem`, props.item.id);
      if (resultDelete instanceof Error) {
        return;
      }

      close();
    }

    function close() {
      const entityPath = getNounPluralForm(props.entityType);
      router.push(`/${entityPath}`);
    }
    return {
      valid,
      deleteItem,
      close,
      save,
      create,
      dialogVisible,
    };
  },
});

export default Component;
</script>

<style scoped>
.back_btn {
  padding: 0;
  width: 44px;
  height: 44px;
}
</style>
