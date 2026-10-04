import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::event.event', ({ strapi }) => ({
  async find(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: ctx.query.populate || '*',
      sort: ctx.query.sort || ['displayOrder:asc', 'eventDate:desc', 'createdAt:desc'],
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
