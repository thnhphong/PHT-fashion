"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginationResult = exports.parsePaginationParams = void 0;
const parsePaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const sort = query.sort || 'created_at';
    const order = query.order === 'asc' ? 'asc' : 'desc';
    return { page, limit, sort, order };
};
exports.parsePaginationParams = parsePaginationParams;
const buildPaginationResult = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};
exports.buildPaginationResult = buildPaginationResult;
