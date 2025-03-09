import { db } from '../config/db';
import { ReportOption, ModerationService } from '../lib/types/moderation';
import NodeCache from 'node-cache';

// Create a cache instance with a TTL of 5 minutes (300 seconds)
const configCache = new NodeCache({ stdTTL: 300 });

/**
 * Retrieves and caches the moderation services configuration.
 * The configuration includes custom fields like admin_did.
 */
export async function getModerationServicesConfig(): Promise<
  ModerationService[]
> {
  // Check if the config is already cached.
  const cached = configCache.get<ModerationService[]>('moderationServices');
  if (cached) {
    return cached;
  }

  // Otherwise, query the database.
  try {
    const services: ModerationService[] = await db(
      'moderation_services'
    ).select('*');
    // Cache the result.
    configCache.set('moderationServices', services);
    return services;
  } catch (error) {
    console.error('Error fetching moderation services config:', error);
    throw error;
  }
}

export async function fetchReportOptions(): Promise<ReportOption[]> {
  try {
    return await db('report_options');
  } catch (error) {
    console.error('Error fetching report options:', error);
    throw error;
  }
}

export async function reportToBlacksky(uris: { uri: string }[]) {
  try {
    const response = await fetch(
      `${process.env.RSKY_FEEDGEN}/queue/posts/delete`!,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-RSKY-KEY': process.env.RSKY_API_KEY!,
        },
        body: JSON.stringify(uris),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function reportToOzone() {
  // todo
}

/**
 * Fetches all moderation services from the database.
 * If a feedUri is provided, it fetches the allowed_services from the feed_permissions table
 * and returns only the services whose value is present in that array.
 *
 * @param feedUri Optional feed URI to filter services.
 * @returns An array of ModerationService objects.
 */
export async function fetchModerationServices(
  feedUri: string
): Promise<ModerationService[]> {
  try {
    // Retrieve all services from the moderation_services table.

    const services: ModerationService[] = await db(
      'moderation_services'
    ).select('*');
    // Assuming that the feed_permissions table stores allowed_services as a text array.
    const feed = await db('feed_permissions')
      .select('allowed_services')
      .where({ uri: feedUri })
      .first();

    // Filter the services to include only those allowed for the given feed.
    return services.filter((service) =>
      feed.allowed_services.includes(service.value)
    );

    // If no feedUri is provided or if allowed_services is not set, return all services.
    // return services;
  } catch (error) {
    console.error('Error fetching moderation services:', error);
    throw error;
  }
}
