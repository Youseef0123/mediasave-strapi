import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::job.job', {
  config: {
    find: {
      auth: false, // Allow public fetching of job listings
    },
    findOne: {
      auth: false, // Allow public fetching of single job details
    },
  },
});
