import { Request, Response } from 'express';
import {
  fetchReportOptions,
  fetchModerationServices,
  reportToBlacksky,
  reportToOzone,
} from '../repos/moderation';

import { blackskyServiceGate, createModerationLog } from '../repos/permissions';

import { ModerationService } from '../lib/types/moderation';

export const getReportOptions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const options = await fetchReportOptions();
    res.status(200).json({ options });
    return;
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getModerationServices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Ensure the acting user is authenticated.
    const actingUser = req.user;
    if (!actingUser) {
      res.status(401).json({ error: 'Unauthorized: No valid session' });
      return;
    }

    // Fetch all available moderation services.
    const allServices = await fetchModerationServices();

    // Filter services:
    // - If the acting user is mod/admin for the feed and the gate passes, include Blacksky.
    // - Otherwise, only include Ozone.
    const services = allServices.filter((service) => {
      if (service.value === 'blacksky') {
        return blackskyServiceGate();
      }
      if (service.value === 'ozone') {
        return true;
      }
      // If additional services exist, add your logic here.
      return false;
    });

    res.status(200).json({ services });
  } catch (error) {
    console.error('Error in getModerationServices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Processes a bulk array of moderation reports. For each report, we:
 * - Use the authenticated user's DID as performed_by.
 * - Process the report for each service (Blacksky and/or Ozone).
 * - Create a moderation log entry.
 * - Return a summary of successes and failures so one report’s error
 *   doesn’t block processing of the others.
 *
 * Each report object is expected to have:
 * {
 *   targetedPostUri: string;
 *   reason: string;
 *   toServices: { label: string; value: string }[];
 *   targetedUserDid: string;
 *   uri: string;
 *   feedName?: string;
 *   additionalInfo?: string;
 *   action: ModAction;
 * }
 */
export const reportModerationEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Use the authenticated user's DID as performed_by.
    const actingUser = req.user;
    if (!actingUser) {
      console.error('No acting user found in request.');
      res.status(401).json({ error: 'Unauthorized: No valid session' });
      return;
    }

    // Ensure the request body is an array. If not, wrap it.
    let reports = req.body;
    if (!Array.isArray(reports)) {
      console.warn('Request body is not an array. Wrapping in an array.');
      reports = [reports];
    }

    // Process each report individually.
    const summary = await Promise.all(
      reports.map(async (report: any, idx: number) => {
        // Build the payload.
        const payload = {
          targetedPostUri: report.targetedPostUri,
          reason: report.reason,
          toServices: report.toServices, // Expects an array of ModerationService
          targetedUserDid: report.targetedUserDid,
          uri: report.uri,
          feedName: report.feedName,
          additionalInfo: report.additionalInfo || '',
          action: report.action, // ModAction (e.g., 'post_delete')
          targetedPost: report.targetedPost, // Optional extra metadata
          targetedProfile: report.targetedProfile, // Optional extra metadata
          performed_by: actingUser.did, // Override with acting user's DID
        };

        const resultDetails: any[] = [];

        // Process Blacksky if requested.
        if (
          payload.toServices.some(
            (s: ModerationService) => s.value === 'blacksky'
          )
        ) {
          if (blackskyServiceGate()) {
            try {
              const blackskyResult = await reportToBlacksky([
                { uri: payload.targetedPostUri },
              ]);
              resultDetails.push({
                service: 'blacksky',
                result: blackskyResult,
              });
            } catch (bsError: any) {
              console.error(
                `Report ${idx}: Error reporting to Blacksky:`,
                bsError
              );
              resultDetails.push({
                service: 'blacksky',
                error: bsError.message,
              });
            }
          } else {
            console.warn(`Report ${idx}: Blacksky service gate not passed.`);
            resultDetails.push({
              service: 'blacksky',
              error: 'Service gate not passed',
            });
          }
        }

        // Process Ozone if requested.
        if (
          payload.toServices.some((s: ModerationService) => s.value === 'ozone')
        ) {
          try {
            const ozoneResult = await reportToOzone();
            resultDetails.push({ service: 'ozone', result: ozoneResult });
          } catch (ozError: any) {
            console.error(`Report ${idx}: Error reporting to Ozone:`, ozError);
            resultDetails.push({ service: 'ozone', error: ozError.message });
          }
        }

        // Attempt to create a moderation log entry.
        try {
          console.log('PAYLOAD.ACTION ', payload.action, '  PAYLOAD.ACTION');
          await createModerationLog({
            uri: payload.uri,
            performed_by: actingUser.did,
            action: payload.action,
            target_user_did: payload.targetedUserDid,
            metadata: {
              reason: payload.reason,
              feedName: payload.feedName,
              additionalInfo: payload.additionalInfo,
              targetedPost: payload.targetedPost,
              targetedProfile: payload.targetedProfile,
            },
            target_post_uri: payload.targetedPostUri,
          });

          resultDetails.push({ service: 'log', result: 'logged' });
        } catch (logError: any) {
          console.error(
            `Report ${idx}: Error creating moderation log:`,
            logError
          );
          resultDetails.push({ service: 'log', error: logError.message });
        }

        return { report: payload, status: 'success', details: resultDetails };
      })
    );

    res.json({ summary });
  } catch (error: any) {
    console.error('Error reporting moderation events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
