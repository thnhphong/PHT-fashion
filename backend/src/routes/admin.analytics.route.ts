import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getAnalyticsOverview,
  getRevenue,
  getTopProductsAnalytics,
  getOrderSummary,
} from '../controllers/admin.analytics.controller';

const adminAnalyticsRouter = Router();

adminAnalyticsRouter.use(authenticate, authorize(['admin']));

adminAnalyticsRouter.get('/overview', getAnalyticsOverview);
adminAnalyticsRouter.get('/revenue', getRevenue);
adminAnalyticsRouter.get('/top-products', getTopProductsAnalytics);
adminAnalyticsRouter.get('/orders-summary', getOrderSummary);

export default adminAnalyticsRouter;
