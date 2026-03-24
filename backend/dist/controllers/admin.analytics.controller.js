"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderSummary = exports.getTopProductsAnalytics = exports.getRevenue = exports.getAnalyticsOverview = void 0;
const admin_analytics_service_1 = require("../services/admin.analytics.service");
const VALID_PERIODS = ['7d', '30d', '90d', '1y', 'custom'];
const VALID_GROUP_BY = ['day', 'week', 'month'];
const getAnalyticsOverview = async (req, res) => {
    try {
        const period = req.query.period || '30d';
        const customFrom = req.query.from;
        const customTo = req.query.to;
        if (!VALID_PERIODS.includes(period)) {
            return res.status(400).json({ message: `Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}` });
        }
        const { startDate, endDate } = (0, admin_analytics_service_1.parseDateRange)(period, customFrom, customTo);
        const data = await (0, admin_analytics_service_1.getOverview)(startDate, endDate);
        return res.status(200).json(data);
    }
    catch (error) {
        console.error('Analytics overview error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAnalyticsOverview = getAnalyticsOverview;
const getRevenue = async (req, res) => {
    try {
        const period = req.query.period || '30d';
        const groupBy = req.query.groupBy || 'day';
        const customFrom = req.query.from;
        const customTo = req.query.to;
        if (!VALID_PERIODS.includes(period)) {
            return res.status(400).json({ message: `Invalid period` });
        }
        if (!VALID_GROUP_BY.includes(groupBy)) {
            return res.status(400).json({ message: `Invalid groupBy. Must be one of: ${VALID_GROUP_BY.join(', ')}` });
        }
        const { startDate, endDate } = (0, admin_analytics_service_1.parseDateRange)(period, customFrom, customTo);
        const data = await (0, admin_analytics_service_1.getRevenueOverTime)(startDate, endDate, groupBy);
        return res.status(200).json(data);
    }
    catch (error) {
        console.error('Revenue analytics error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getRevenue = getRevenue;
const getTopProductsAnalytics = async (req, res) => {
    try {
        const period = req.query.period || '30d';
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const customFrom = req.query.from;
        const customTo = req.query.to;
        if (!VALID_PERIODS.includes(period)) {
            return res.status(400).json({ message: `Invalid period` });
        }
        const { startDate, endDate } = (0, admin_analytics_service_1.parseDateRange)(period, customFrom, customTo);
        const data = await (0, admin_analytics_service_1.getTopProducts)(startDate, endDate, limit);
        return res.status(200).json(data);
    }
    catch (error) {
        console.error('Top products analytics error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTopProductsAnalytics = getTopProductsAnalytics;
const getOrderSummary = async (req, res) => {
    try {
        const period = req.query.period || '30d';
        const customFrom = req.query.from;
        const customTo = req.query.to;
        if (!VALID_PERIODS.includes(period)) {
            return res.status(400).json({ message: `Invalid period` });
        }
        const { startDate, endDate } = (0, admin_analytics_service_1.parseDateRange)(period, customFrom, customTo);
        const data = await (0, admin_analytics_service_1.getOrdersSummary)(startDate, endDate);
        return res.status(200).json(data);
    }
    catch (error) {
        console.error('Orders summary analytics error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getOrderSummary = getOrderSummary;
