"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeFavorites = exports.removeFavorite = exports.addFavorite = exports.getFavorites = void 0;
const favoriteService = __importStar(require("../services/favorite.service"));
const toProductIdStrings = (fav) => (fav?.productIds ?? []).map((p) => p && typeof p === 'object' && '_id' in p ? String(p._id) : String(p)).filter(Boolean);
const getFavorites = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const fav = await favoriteService.getFavorites(userId);
        return res.json({ productIds: toProductIdStrings(fav) });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Internal server error';
        return res.status(500).json({ message: msg });
    }
};
exports.getFavorites = getFavorites;
const addFavorite = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { productId } = req.params;
        const fav = await favoriteService.addFavorite(userId, productId);
        return res.status(201).json({ productIds: toProductIdStrings(fav) });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Internal server error';
        return res.status(500).json({ message: msg });
    }
};
exports.addFavorite = addFavorite;
const removeFavorite = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { productId } = req.params;
        const fav = await favoriteService.removeFavorite(userId, productId);
        return res.json({ productIds: toProductIdStrings(fav) });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Favorites not found') {
            return res.status(404).json({ message: error.message });
        }
        const msg = error instanceof Error ? error.message : 'Internal server error';
        return res.status(500).json({ message: msg });
    }
};
exports.removeFavorite = removeFavorite;
const mergeFavorites = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { productIds = [] } = req.body;
        const fav = await favoriteService.mergeFavorites(userId, Array.isArray(productIds) ? productIds : []);
        return res.json({ productIds: toProductIdStrings(fav) });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Internal server error';
        return res.status(500).json({ message: msg });
    }
};
exports.mergeFavorites = mergeFavorites;
