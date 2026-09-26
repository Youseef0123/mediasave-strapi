export default {
  routes: [
    {
      method: 'POST',
      path: '/job-applications',
      handler: 'api::job-application.job-application.create',
      config: {
        auth: false, // Allow public candidates to submit job applications
      },
    },
    {
      method: 'POST',
      path: '/job-application',
      handler: 'api::job-application.job-application.create',
      config: {
        auth: false, // Allow public candidates to submit job applications
      },
    },
    {
      method: 'GET',
      path: '/jobs/:id/applications',
      handler: 'api::job-application.job-application.getApplicationsByJob',
      config: {
        auth: false,
      },
    },
  ],
};
