"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersSummary = exports.getTopProducts = exports.getRevenueOverTime = exports.getOverview = exports.parseDateRange = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
const PERIOD_DAYS = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
};
const parseDateRange = (period, customFrom, customTo) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    let startDate;
    if (period === "custom" && customFrom) {
        startDate = new Date(customFrom);
    }
    else {
        const days = PERIOD_DAYS[period] ?? 30;
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
    }
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
};
exports.parseDateRange = parseDateRange;
const formatDateStr = (date) => date.toISOString().split("T")[0];
const baseMatch = (startDate, endDate) => ({
    created_at: { $gte: startDate, $lte: endDate },
    payment_status: { $in: ["paid", "delivered"] },
    status: { $ne: "cancelled" },
});
const getOverview = async (startDate, endDate) => {
    const match = baseMatch(startDate, endDate);
    const deliveredMatch = {
        created_at: { $gte: startDate, $lte: endDate },
        payment_status: { $in: ['paid', 'delivered'] },
        status: 'delivered',
    };
    const result = await Order_1.default.aggregate([
        { $match: match },
        {
            $facet: {
                totals: [
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$total_amount' },
                            totalOrders: { $sum: 1 },
                            totalCustomers: {
                                $addToSet: {
                                    $cond: [
                                        { $ne: ['$customerId', null] },
                                        { $toString: '$customerId' },
                                        null,
                                    ],
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            totalRevenue: 1,
                            totalOrders: 1,
                            totalCustomers: {
                                $size: {
                                    $filter: {
                                        input: '$totalCustomers',
                                        cond: { $ne: ['$$this', null] },
                                    },
                                },
                            },
                        },
                    },
                ],
                totalItems: [
                    { $match: deliveredMatch },
                    {
                        $lookup: {
                            from: 'orderItems',
                            localField: '_id',
                            foreignField: 'orderId',
                            as: 'items',
                        },
                    },
                    { $unwind: '$items' },
                    { $group: { _id: null, total: { $sum: '$items.quantity' } } },
                ],
            },
        },
    ]);
    const totals = result[0]?.totals[0] ?? {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
    };
    const totalItemsSold = result[0]?.totalItems[0]?.total ?? 0;
    return {
        totalRevenue: totals.totalRevenue ?? 0,
        totalOrders: totals.totalOrders ?? 0,
        totalItemsSold: totalItemsSold,
        totalCustomers: totals.totalCustomers ?? 0,
        period: { from: formatDateStr(startDate), to: formatDateStr(endDate) },
    };
};
exports.getOverview = getOverview;
const getDateFormat = (groupBy) => {
    switch (groupBy) {
        case "week":
            return "%Y-W%V";
        case "month":
            return "%Y-%m";
        default:
            return "%Y-%m-%d";
    }
};
const getRevenueOverTime = async (startDate, endDate, groupBy = "day") => {
    const match = baseMatch(startDate, endDate);
    const dateFormat = getDateFormat(groupBy);
    const result = await Order_1.default.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $dateToString: { format: dateFormat, date: "$created_at" } },
                revenue: { $sum: "$total_amount" },
                orders: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date: "$_id",
                revenue: 1,
                orders: 1,
            },
        },
    ]);
    return {
        data: result,
        period: { from: formatDateStr(startDate), to: formatDateStr(endDate) },
    };
};
exports.getRevenueOverTime = getRevenueOverTime;
const getTopProducts = async (startDate, endDate, limit = 10) => {
    const deliveredMatch = {
        created_at: { $gte: startDate, $lte: endDate },
        payment_status: { $in: ['paid', 'delivered'] },
        status: 'delivered',
    };
    const orderIds = await Order_1.default.find(deliveredMatch).select('_id').lean();
    const orderIdList = orderIds.map((o) => o._id);
    if (orderIdList.length === 0) {
        return {
            data: [],
            period: { from: formatDateStr(startDate), to: formatDateStr(endDate) },
        };
    }
    const result = await OrderItem_1.default.aggregate([
        { $match: { orderId: { $in: orderIdList } } },
        {
            $group: {
                _id: "$productId",
                totalQuantity: { $sum: "$quantity" },
                totalRevenue: { $sum: { $multiply: ["$quantity", "$unit_price"] } },
            },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product",
            },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                productId: { $toString: "$_id" },
                name: { $ifNull: ["$product.name", "Unknown Product"] },
                img_url: { $ifNull: ["$product.img_url", ""] },
                totalQuantity: 1,
                totalRevenue: 1,
            },
        },
    ]);
    return {
        data: result,
        period: { from: formatDateStr(startDate), to: formatDateStr(endDate) },
    };
};
exports.getTopProducts = getTopProducts;
const getOrdersSummary = async (startDate, endDate) => {
    const match = {
        created_at: { $gte: startDate, $lte: endDate },
    };
    const result = await Order_1.default.aggregate([
        { $match: match },
        {
            $facet: {
                byStatus: [
                    { $group: { _id: "$status", count: { $sum: 1 } } },
                    {
                        $project: {
                            _id: 0,
                            key: "$_id",
                            value: "$count",
                        },
                    },
                ],
                byPaymentStatus: [
                    { $group: { _id: "$payment_status", count: { $sum: 1 } } },
                    {
                        $project: {
                            _id: 0,
                            key: "$_id",
                            value: "$count",
                        },
                    },
                ],
                avgOrderValue: [
                    { $match: { payment_status: { $in: ["paid", "delivered"] } } },
                    { $group: { _id: null, avg: { $avg: "$total_amount" } } },
                ],
            },
        },
    ]);
    const byStatusArr = result[0]?.byStatus ?? [];
    const byPaymentStatusArr = result[0]?.byPaymentStatus ?? [];
    const avg = result[0]?.avgOrderValue?.[0]?.avg ?? 0;
    const toRecord = (arr) => arr.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {});
    return {
        byStatus: toRecord(byStatusArr),
        byPaymentStatus: toRecord(byPaymentStatusArr),
        averageOrderValue: Math.round(avg),
        period: { from: formatDateStr(startDate), to: formatDateStr(endDate) },
    };
};
exports.getOrdersSummary = getOrdersSummary;
