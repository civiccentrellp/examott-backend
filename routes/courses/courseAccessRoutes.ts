// // 📁 routes/courseAccessRoutes.ts
// import express from 'express';
// import {
//   createPaymentRequest,
//   getAllPaymentRequests,
//   getMyPaymentRequests,
//   cancelPaymentRequest,
//   rejectPaymentRequest,
//   verifyPaymentAndEnroll,
//   getUserEnrollments,
//   getAllEnrollments,
// } from '../../controllers/courses/courseAccessController.ts';

// // Optional: middleware placeholders (you can implement these)
// // import { requireAuth, isAdmin } from '../../middlewares/auth';

// const router = express.Router();

// // Student routes
// router.post('/payments', /* requireAuth, */ createPaymentRequest);
// router.get('/payments/my', /* requireAuth, */ getMyPaymentRequests);
// router.delete('/payments/:id', /* requireAuth, */ cancelPaymentRequest);
// router.get('/enrollments/my', /* requireAuth, */ getUserEnrollments);

// // Admin routes
// router.get('/payments', /* requireAuth, isAdmin, */ getAllPaymentRequests);
// router.put('/payments/:id/verify', /* requireAuth, isAdmin, */ verifyPaymentAndEnroll);
// router.put('/payments/:id/reject', /* requireAuth, isAdmin, */ rejectPaymentRequest);
// router.get('/enrollments', /* requireAuth, isAdmin, */ getAllEnrollments);

// export default router;

import express from 'express';
import { authenticate } from '../../middlewares/auth.ts';
import { checkPermission } from '../../middlewares/checkPermission.js';

import {
  createPaymentRequest,
  verifyPaymentAndEnroll,
  rejectPaymentRequest,
  cancelPaymentRequest,
  getAllPaymentRequests,
  getMyPaymentRequests,
  getUserEnrollments,
  getAllEnrollments,
} from '../../controllers/courses/courseAccessController.ts';

const router = express.Router();

// ---------- Student Routes ----------
router.post('/request', authenticate, createPaymentRequest);        // Student creates payment request
router.get('/my', authenticate, getMyPaymentRequests);              // Student views own payment requests
router.delete('/request/:id', authenticate, cancelPaymentRequest);  // Student cancels pending request
router.get('/enrollments', authenticate, getUserEnrollments);       // Student views enrollments

// ---------- Admin Routes (Protected by Permissions) ----------
router.get('/requests', authenticate, checkPermission('payment.view'), getAllPaymentRequests);
router.put('/request/:id/verify', authenticate, checkPermission('payment.verify'), verifyPaymentAndEnroll);
router.put('/request/:id/reject', authenticate, checkPermission('payment.reject'), rejectPaymentRequest);
router.get('/enrollments/all', authenticate, getAllEnrollments); // optional: can also add checkPermission if needed

export default router;
