"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.developmentOnly = void 0;
const developmentOnly = (req, res, next) => {
    if (process.env.NODE_ENV !== 'development') {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    next();
};
exports.developmentOnly = developmentOnly;
