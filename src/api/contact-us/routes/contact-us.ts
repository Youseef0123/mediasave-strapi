export default {
  routes: [
    {
      method: 'POST',
      path: '/contact-uses',
      handler: 'api::contact-us.contact-us.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/contact-us',
      handler: 'api::contact-us.contact-us.create',
      config: {
        auth: false,
      },
    },
  ],
};
