import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

admin.initializeApp();

const db = getFirestore();
const GUATEMALA_OFFSET = -6;

function getGuatemalaDateStr(date: Date): string {
  const guatemala = new Date(date.getTime() + GUATEMALA_OFFSET * 3600000);
  const year = guatemala.getUTCFullYear();
  const month = String(guatemala.getUTCMonth() + 1).padStart(2, '0');
  const day = String(guatemala.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStartOfDayUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - GUATEMALA_OFFSET * 3600000);
}

function getEndOfDayUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - GUATEMALA_OFFSET * 3600000);
}

/**
 * Runs at 23:59 Guatemala time — closes all active reports
 */
export const closeReports = onSchedule(
  {
    schedule: '59 23 * * *',
    timeZone: 'America/Guatemala',
  },
  async () => {
    console.log('=== Closing daily reports ===');

    const ubicacionesSnap = await db.collection('ubicaciones').get();
    let closedCount = 0;

    for (const ubDoc of ubicacionesSnap.docs) {
      const reportsRef = db.collection(`ubicaciones/${ubDoc.id}/reports`);
      const snapshot = await reportsRef.where('status', '==', 'active').get();

      for (const reportDoc of snapshot.docs) {
        await reportDoc.ref.update({
          status: 'closed',
          endDate: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        closedCount++;
        console.log(`Closed report ${reportDoc.id} in ubicacion ${ubDoc.id}`);
      }
    }

    console.log(`=== Closed ${closedCount} reports ===`);
  }
);

/**
 * Runs at 00:00 Guatemala time — creates new reports for the day
 */
export const createReports = onSchedule(
  {
    schedule: '0 0 * * *',
    timeZone: 'America/Guatemala',
  },
  async () => {
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
        .where('startDate', '>=', Timestamp.fromDate(startOfDay))
        .where('startDate', '<=', Timestamp.fromDate(endOfDay))
        .get();

      if (!existingSnap.empty) {
        console.log(`Report already exists for ubicacion ${ubDoc.id} on ${todayStr}, skipping`);
        continue;
      }

      await reportsRef.add({
        startDate: Timestamp.fromDate(startOfDay),
        endDate: Timestamp.fromDate(endOfDay),
        totalSales: 0,
        totalProducts: 0,
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      createdCount++;
      console.log(`Created report for ubicacion ${ubDoc.id} on ${todayStr}`);
    }

    console.log(`=== Created ${createdCount} reports for ${todayStr} ===`);
  }
);
