"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchReportOptions = fetchReportOptions;
exports.reportToBlacksky = reportToBlacksky;
exports.reportToOzone = reportToOzone;
exports.fetchModerationServices = fetchModerationServices;
const db_1 = require("../config/db");
async function fetchReportOptions() {
    try {
        return await (0, db_1.db)('report_options');
    }
    catch (error) {
        console.error('Error fetching report options:', error);
        throw error;
    }
}
async function reportToBlacksky(uris) {
    try {
        const response = await fetch(`${process.env.RSKY_FEEDGEN}/queue/posts/delete`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-RSKY-KEY': process.env.RSKY_API_KEY,
            },
            body: JSON.stringify(uris),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
async function reportToOzone() {
    // todo
}
async function fetchModerationServices() {
    try {
        const services = await (0, db_1.db)('moderation_services').select('*');
        return services;
    }
    catch (error) {
        console.error('Error fetching moderation services:', error);
        throw error;
    }
}
