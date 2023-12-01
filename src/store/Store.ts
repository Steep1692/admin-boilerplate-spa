import { createStore } from 'vuex';

import authModule from './modules/AuthModule';
import categoriesModule from './entityModules/CategoriesModule';
import productsModule from './entityModules/ProductsModule';
import tagsModule from './entityModules/TagsModule';
import uiModule from './modules/UIModule';

import createPersistedState from 'vuex-persistedstate';
import SecureLS from 'secure-ls';
const ls = new SecureLS({ encodingType: 'aes' });

export interface RootState {}

const store = createStore({
  modules: {
    authModule,
    categoriesModule,
    productsModule,
    tagsModule,
    uiModule,
  },
  plugins: [
    createPersistedState({
      key: 'admin-spa-vuex',
      paths: ['authModule.userInfo'],
      storage: {
        getItem: key => ls.get(key),
        setItem: (key, value) => ls.set(key, value),
        removeItem: key => ls.remove(key),
      },
    }),
  ],
});
export default store;
