import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::contact-us.contact-us', ({ strapi }) => ({
  async create(ctx) {
    try {
      const requestBody = ctx.request.body;

      // Support both flat JSON body AND standard Strapi wrapper { data: { ... } }
      const payload =
        requestBody && typeof requestBody === 'object' && 'data' in requestBody && requestBody.data
          ? requestBody.data
          : requestBody || {};

      const { fullName, email, phone, subject, message } = payload;

      const errors: Record<string, string> = {};

      if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
        errors.fullName = 'Full name is required';
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
        errors.email = 'A valid email address is required';
      }

      if (!subject || typeof subject !== 'string' || !subject.trim()) {
        errors.subject = 'Subject is required';
      }

      if (!message || typeof message !== 'string' || !message.trim()) {
        errors.message = 'Message details are required';
      }

      if (Object.keys(errors).length > 0) {
        ctx.status = 400;
        return {
          success: false,
          message: 'Validation failed. Please check the required fields.',
          errors,
        };
      }

      // Save to Strapi v5 database using Documents API
      const entry = await strapi.documents('api::contact-us.contact-us').create({
        data: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? String(phone).trim() : '',
          subject: subject.trim(),
          message: message.trim(),
          isRead: false,
        },
      });

      ctx.status = 201;
      return {
        success: true,
        message: 'Your message has been sent successfully',
        data: {
          id: entry.id || entry.documentId,
          documentId: entry.documentId,
          fullName: entry.fullName,
          email: entry.email,
          phone: entry.phone || '',
          subject: entry.subject,
          message: entry.message,
          isRead: entry.isRead,
          createdAt: entry.createdAt,
        },
      };
    } catch (err: any) {
      ctx.status = 500;
      return {
        success: false,
        message: 'An internal server error occurred while processing your request.',
        errors: { server: err?.message || 'Internal Error' },
      };
    }
  },
}));
