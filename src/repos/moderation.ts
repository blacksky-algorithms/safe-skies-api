import { db } from '../config/db';
import { ReportOption } from '../lib/types/moderation';

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
