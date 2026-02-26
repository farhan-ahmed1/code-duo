import { roomStore } from "../api/routes";
import { documentStore } from "../ws-server";
import { ROOM_EXPIRY_DAYS } from "@code-duo/shared";
import { logger } from "../utils/logger";

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Purge rooms (and their documents) not accessed within
 * ROOM_EXPIRY_DAYS (default 7).  Runs once on startup and then
 * every hour via `setInterval`.
 */
function runCleanup() {
  try {
    // Collect stale room IDs first so we can delete their documents
    const staleIds = roomStore.getStaleRoomIds(ROOM_EXPIRY_DAYS);

    if (staleIds.length === 0) {
      logger.info("Room cleanup: no stale rooms found");
      return;
    }

    // Delete persisted documents for each stale room
    for (const id of staleIds) {
      documentStore.deleteDocument(id);
    }

    // Delete the room rows themselves
    const purged = roomStore.purgeStaleRooms(ROOM_EXPIRY_DAYS);

    logger.info(
      {
        purgedRooms: purged,
        purgedDocuments: staleIds.length,
        expiryDays: ROOM_EXPIRY_DAYS,
      },
      "Room cleanup completed",
    );
  } catch (err) {
    logger.error({ err }, "Room cleanup failed");
  }
}

/**
 * Start the periodic room cleanup job.
 * Runs an initial cleanup immediately, then every hour.
 */
export function startRoomCleanupJob() {
  logger.info(
    { intervalMs: CLEANUP_INTERVAL_MS, expiryDays: ROOM_EXPIRY_DAYS },
    "Starting room cleanup job",
  );

  // Run once immediately on startup
  runCleanup();

  // Then every hour
  const timer = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
  timer.unref(); // don't prevent process exit
}
