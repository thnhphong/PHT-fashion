import { Request, Response } from 'express';
import {
  parseDateRange,
  getOverview,
  getRevenueOverTime,
  getTopProducts,
  getOrdersSummary,
  type Period,
} from '../services/admin.analytics.service';

type GroupBy = 'day' | 'week' | 'month';

const VALID_PERIODS = ['1d', '7d', '30d', '90d', '1y', 'custom'];
const VALID_GROUP_BY = ['day', 'week', 'month'];

export const getAnalyticsOverview = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as Period) || '30d';
    const customFrom = req.query.from as string | undefined;
    const customTo = req.query.to as string | undefined;

    if (!VALID_PERIODS.includes(period)) {
      return res.status(400).json({ message: `Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}` });
    }

    const { startDate, endDate } = parseDateRange(period, customFrom, customTo);
    const data = await getOverview(startDate, endDate);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Analytics overview error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRevenue = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as Period) || '30d';
    const groupBy = (req.query.groupBy as GroupBy) || 'day';
    const customFrom = req.query.from as string | undefined;
    const customTo = req.query.to as string | undefined;

    if (!VALID_PERIODS.includes(period)) {
      return res.status(400).json({ message: `Invalid period` });
    }
    if (!VALID_GROUP_BY.includes(groupBy)) {
      return res.status(400).json({ message: `Invalid groupBy. Must be one of: ${VALID_GROUP_BY.join(', ')}` });
    }

    const { startDate, endDate } = parseDateRange(period, customFrom, customTo);
    const data = await getRevenueOverTime(startDate, endDate, groupBy);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Revenue analytics error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTopProductsAnalytics = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as Period) || '30d';
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const customFrom = req.query.from as string | undefined;
    const customTo = req.query.to as string | undefined;

    if (!VALID_PERIODS.includes(period)) {
      return res.status(400).json({ message: `Invalid period` });
    }

    const { startDate, endDate } = parseDateRange(period, customFrom, customTo);
    const data = await getTopProducts(startDate, endDate, limit);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Top products analytics error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOrderSummary = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as Period) || '30d';
    const customFrom = req.query.from as string | undefined;
    const customTo = req.query.to as string | undefined;

    if (!VALID_PERIODS.includes(period)) {
      return res.status(400).json({ message: `Invalid period` });
    }

    const { startDate, endDate } = parseDateRange(period, customFrom, customTo);
    const data = await getOrdersSummary(startDate, endDate);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Orders summary analytics error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
