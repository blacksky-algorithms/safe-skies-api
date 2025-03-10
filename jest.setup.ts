import mockKnex, { Tracker } from 'mock-knex';
import { db } from './src/config/db';

mockKnex.mock(db);

const tracker: Tracker = mockKnex.getTracker();
tracker.install();

export { tracker };
