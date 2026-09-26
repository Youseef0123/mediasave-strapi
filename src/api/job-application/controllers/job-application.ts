import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::job-application.job-application', ({ strapi }) => ({
  async create(ctx) {
    try {
      let payload: any = {};
      const requestBody = ctx.request.body;

      // Handle multipart/form-data OR JSON body
      if (requestBody && typeof requestBody === 'object' && 'data' in requestBody) {
        try {
          payload = typeof requestBody.data === 'string' ? JSON.parse(requestBody.data) : requestBody.data;
        } catch {
          payload = requestBody.data;
        }
      } else {
        payload = requestBody || {};
      }

      const fullName = payload.fullName || requestBody.fullName;
      const email = payload.email || requestBody.email;
      const phone = payload.phone || requestBody.phone;
      const coverLetter = payload.coverLetter || requestBody.coverLetter || '';
      const jobId = payload.job || requestBody.job || payload.jobId || requestBody.jobId;

      const errors: Record<string, string> = {};

      if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
        errors.fullName = 'Full name is required';
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
        errors.email = 'A valid email address is required';
      }

      if (!phone || typeof phone !== 'string' || !phone.trim()) {
        errors.phone = 'Phone number is required';
      }

      if (!jobId) {
        errors.job = 'Job position ID is required';
      }

      if (Object.keys(errors).length > 0) {
        ctx.status = 400;
        return {
          success: false,
          message: 'Validation failed. Please check required fields.',
          errors,
        };
      }

      // 1. Verify Job existence and isOpen status in database
      let targetJob: any = null;
      try {
        const allJobs = await strapi.documents('api::job.job').findMany({
          populate: ['applications'],
        });

        if (allJobs && allJobs.length > 0) {
          // Match by documentId, id, slug, or title
          targetJob = allJobs.find(
            (j: any) =>
              String(j.documentId) === String(jobId) ||
              String(j.id) === String(jobId) ||
              j.slug === String(jobId) ||
              j.title?.toLowerCase() === String(jobId).toLowerCase()
          );

          // Fallback: If mock ID (e.g., 'job-1') or unmatched, select first open job
          if (!targetJob) {
            targetJob = allJobs.find((j: any) => j.isOpen !== false) || allJobs[0];
          }
        }
      } catch (err) {
        console.error('Error querying jobs:', err);
      }

      // If no jobs exist at all in database, return clear instructions
      if (!targetJob) {
        ctx.status = 404;
        return {
          success: false,
          message: 'No open job positions available in database.',
          errors: { job: 'No active job positions' },
        };
      }

      if (targetJob.isOpen === false) {
        ctx.status = 400;
        return {
          success: false,
          message: 'This job position is closed and no longer accepting applications.',
          errors: { job: 'Position closed' },
        };
      }

      // 2. Handle CV file upload if files attached
      let cvFileId: any = payload.cv || null;
      const req: any = ctx.request;
      const uploadedFiles = req.files || (ctx as any).files || {};

      let fileToUpload =
        uploadedFiles.cv ||
        uploadedFiles['files.cv'] ||
        uploadedFiles.files ||
        uploadedFiles.file;

      if (fileToUpload) {
        if (Array.isArray(fileToUpload)) {
          fileToUpload = fileToUpload[0];
        }

        // Validate File Size (Max 5MB)
        const maxSizeBytes = 5 * 1024 * 1024;
        if (fileToUpload.size && fileToUpload.size > maxSizeBytes) {
          ctx.status = 400;
          return {
            success: false,
            message: 'File size exceeds 5MB limit.',
            errors: { cv: 'CV file size must be less than 5MB' },
          };
        }

        // Upload file via Strapi Upload Plugin
        try {
          const uploadedMedia = await strapi.plugin('upload').service('upload').upload({
            data: {},
            files: fileToUpload,
          });

          if (uploadedMedia && uploadedMedia.length > 0) {
            cvFileId = uploadedMedia[0].id || uploadedMedia[0].documentId;
          }
        } catch (uploadErr: any) {
          console.error('Error uploading file to Strapi:', uploadErr);
        }
      }

      // 3. Create Job Application Document
      const createData: any = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        coverLetter: coverLetter ? coverLetter.trim() : '',
        status: 'New',
        job: targetJob.documentId || targetJob.id,
      };

      if (cvFileId) {
        createData.cv = cvFileId;
      }

      const entry = await strapi.documents('api::job-application.job-application').create({
        data: createData,
        populate: ['job', 'cv'],
      });

      ctx.status = 201;
      return {
        success: true,
        message: 'Your application has been submitted successfully',
        data: {
          id: entry.id || entry.documentId,
          documentId: entry.documentId,
          fullName: entry.fullName,
          email: entry.email,
          phone: entry.phone,
          status: entry.status,
          job: {
            id: targetJob.id || targetJob.documentId,
            documentId: targetJob.documentId,
            title: targetJob.title,
          },
          createdAt: entry.createdAt,
        },
      };
    } catch (err: any) {
      ctx.status = 500;
      return {
        success: false,
        message: 'An error occurred while submitting your application.',
        errors: { server: err?.message || 'Internal Server Error' },
      };
    }
  },

  // Custom Endpoint: GET /api/jobs/:id/applications (Admin Only)
  async getApplicationsByJob(ctx) {
    try {
      const jobId = ctx.params.id;

      if (!jobId) {
        ctx.status = 400;
        return { success: false, message: 'Job ID parameter is required' };
      }

      // Find Job
      const foundJobs = await strapi.documents('api::job.job').findMany({
        filters: {
          $or: [
            { documentId: String(jobId) },
            { id: Number(jobId) || -1 },
          ],
        },
      });

      const targetJob = foundJobs && foundJobs.length > 0 ? foundJobs[0] : null;

      if (!targetJob) {
        ctx.status = 404;
        return { success: false, message: 'Job position not found' };
      }

      // Fetch Applications for this job
      const applications = await strapi.documents('api::job-application.job-application').findMany({
        filters: {
          job: {
            documentId: targetJob.documentId,
          },
        },
        populate: ['cv'],
        sort: ['createdAt:desc'],
      });

      return {
        success: true,
        job: {
          id: targetJob.id || targetJob.documentId,
          documentId: targetJob.documentId,
          title: targetJob.title,
          department: targetJob.department,
        },
        totalApplications: applications.length,
        applications: applications.map((app: any) => ({
          id: app.id || app.documentId,
          documentId: app.documentId,
          fullName: app.fullName,
          email: app.email,
          phone: app.phone,
          status: app.status,
          coverLetter: app.coverLetter,
          cv: app.cv ? { url: app.cv.url, name: app.cv.name, size: app.cv.size } : null,
          createdAt: app.createdAt,
        })),
      };
    } catch (err: any) {
      ctx.status = 500;
      return {
        success: false,
        message: 'Error fetching applications for job position.',
        errors: { server: err?.message },
      };
    }
  },
}));
