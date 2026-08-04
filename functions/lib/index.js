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
exports.createReports = exports.closeReports = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
admin.initializeApp();
const db = (0, firestore_1.getFirestore)();
const GUATEMALA_OFFSET = -6;
function getGuatemalaDateStr(date) {
    const guatemala = new Date(date.getTime() + GUATEMALA_OFFSET * 3600000);
    const year = guatemala.getUTCFullYear();
    const month = String(guatemala.getUTCMonth() + 1).padStart(2, '0');
    const day = String(guatemala.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function getStartOfDayUTC(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - GUATEMALA_OFFSET * 3600000);
}
function getEndOfDayUTC(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - GUATEMALA_OFFSET * 3600000);
}
/**
 * Runs at 23:59 Guatemala time — closes all active reports
 */
exports.closeReports = (0, scheduler_1.onSchedule)({
    schedule: '59 23 * * *',
    timeZone: 'America/Guatemala',
}, async () => {
    console.log('=== Closing daily reports ===');
    const ubicacionesSnap = await db.collection('ubicaciones').get();
    let closedCount = 0;
    for (const ubDoc of ubicacionesSnap.docs) {
        const reportsRef = db.collection(`ubicaciones/${ubDoc.id}/reports`);
        const snapshot = await reportsRef.where('status', '==', 'active').get();
        for (const reportDoc of snapshot.docs) {
            await reportDoc.ref.update({
                status: 'closed',
                endDate: firestore_1.Timestamp.now(),
                updatedAt: firestore_1.Timestamp.now(),
            });
            closedCount++;
            console.log(`Closed report ${reportDoc.id} in ubicacion ${ubDoc.id}`);
        }
    }
    console.log(`=== Closed ${closedCount} reports ===`);
});
/**
 * Runs at 00:00 Guatemala time — creates new reports for the day
 */
exports.createReports = (0, scheduler_1.onSchedule)({
    schedule: '0 0 * * *',
    timeZone: 'America/Guatemala',
}, async () => {
    console.log('=== Creating daily reports ===');
    const now = new Date();
    const todayStr = getGuatemalaDateStr(now);
    const startOfDay = getStartOfDayUTC(todayStr);
    const endOfDay = getEndOfDayUTC(todayStr);
    const ubicacionesSnap = await db.collection('ubicaciones').get();
    let createdCount = 0;
    for (const ubDoc of ubicacionesSnap.docs) {
        const reportsRef = db.collection(`ubicaciones/${ubDoc.id}/reports`);
        const existingSnap = await reportsRef
            .where('startDate', '>=', firestore_1.Timestamp.fromDate(startOfDay))
            .where('startDate', '<=', firestore_1.Timestamp.fromDate(endOfDay))
            .get();
        if (!existingSnap.empty) {
            console.log(`Report already exists for ubicacion ${ubDoc.id} on ${todayStr}, skipping`);
            continue;
        }
        await reportsRef.add({
            startDate: firestore_1.Timestamp.fromDate(startOfDay),
            endDate: firestore_1.Timestamp.fromDate(endOfDay),
            totalSales: 0,
            totalProducts: 0,
            status: 'active',
            createdAt: firestore_1.Timestamp.now(),
            updatedAt: firestore_1.Timestamp.now(),
        });
        createdCount++;
        console.log(`Created report for ubicacion ${ubDoc.id} on ${todayStr}`);
    }
    console.log(`=== Created ${createdCount} reports for ${todayStr} ===`);
});
//# sourceMappingURL=index.js.map