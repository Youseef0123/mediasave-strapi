import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::event.event', {
  config: {
    find: {
      auth: false, // Allow public fetching of events & news
    },
    findOne: {
      auth: false, // Allow public fetching of single event details
    },
  },
});
