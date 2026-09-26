import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::product.product', {
  config: {
    find: {
      auth: false, // Allow public fetching of products catalog
    },
    findOne: {
      auth: false, // Allow public fetching of single product details
    },
  },
});
