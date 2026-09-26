import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  async find(ctx) {
    // Automatically filter active products for public API requests
    ctx.query = {
      ...ctx.query,
      filters: {
        ...(ctx.query.filters as object),
        isActive: { $eq: true },
      },
      populate: ctx.query.populate || '*',
      sort: ctx.query.sort || ['displayOrder:asc', 'createdAt:desc'],
    };

    return await super.find(ctx);
  },

  async findOne(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: ctx.query.populate || '*',
    };

    return await super.findOne(ctx);
  },
}));
