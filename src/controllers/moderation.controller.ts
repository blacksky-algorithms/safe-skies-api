import { Request, Response } from 'express';
import {
  fetchReportOptions,
  fetchModerationServices,
  reportToBlacksky,
  reportToOzone,
} from '../repos/moderation';

import { createModerationLog, customServiceGate } from '../repos/permissions';

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
    const actingUser = req.user;
    if (!actingUser) {
      res.status(401).json({ error: 'Unauthorized: No valid session' });
      return;
    }

    const { uri } = req.query;
    if (!uri) {
      res.status(400).json({ error: 'Uri is required' });
      return;
    }
    const services = await fetchModerationServices(uri.toString());

    res.status(200).json({ services });
  } catch (error) {
    console.error('Error in getModerationServices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// /**
//  * Processes a bulk array of moderation reports. For each report, we:
//  */
// export const reportModerationEvents = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     // Use the authenticated user's DID as performed_by.
//     const actingUser = req.user;
//     if (!actingUser) {
//       console.error('No acting user found in request.');
//       res.status(401).json({ error: 'Unauthorized: No valid session' });
//       return;
//     }

//     // Ensure the request body is an array. If not, wrap it.
//     let reports = req.body;
//     if (!Array.isArray(reports)) {
//       reports = [reports];
//     }

//     const summary = await Promise.all(
//       reports.map(async (report: any, idx: number) => {
//         const payload = {
//           targetedPostUri: report.targetedPostUri,
//           reason: report.reason,
//           toServices: report.toServices,
//           targetedUserDid: report.targetedUserDid,
//           uri: report.uri,
//           feedName: report.feedName,
//           additionalInfo: report.additionalInfo || '',
//           action: report.action,
//           targetedPost: report.targetedPost,
//           targetedProfile: report.targetedProfile,
//           performed_by: actingUser.did,
//         };

//         const resultDetails: any[] = [];

//         if (
//           payload.toServices.some(
//             (s: ModerationService) => s.value === 'blacksky'
//           )
//         ) {
//           if (blackskyServiceGate()) {
//             try {
//               const blackskyResult = await reportToBlacksky([
//                 { uri: payload.targetedPostUri },
//               ]);
//               resultDetails.push({
//                 service: 'blacksky',
//                 result: blackskyResult,
//               });
//             } catch (bsError: any) {
//               console.error(
//                 `Report ${idx}: Error reporting to Blacksky:`,
//                 bsError
//               );
//               resultDetails.push({
//                 service: 'blacksky',
//                 error: bsError.message,
//               });
//             }
//           } else {
//             console.warn(`Report ${idx}: Blacksky service gate not passed.`);
//             resultDetails.push({
//               service: 'blacksky',
//               error: 'Service gate not passed',
//             });
//           }
//         }

//         if (
//           payload.toServices.some((s: ModerationService) => s.value === 'ozone')
//         ) {
//           try {
//             const ozoneResult = await reportToOzone();
//             resultDetails.push({ service: 'ozone', result: ozoneResult });
//           } catch (ozError: any) {
//             console.error(`Report ${idx}: Error reporting to Ozone:`, ozError);
//             resultDetails.push({ service: 'ozone', error: ozError.message });
//           }
//         }

//         try {
//           await createModerationLog({
//             uri: payload.uri,
//             performed_by: actingUser.did,
//             action: payload.action,
//             target_user_did: payload.targetedUserDid,
//             metadata: {
//               reason: payload.reason,
//               feedName: payload.feedName,
//               additionalInfo: payload.additionalInfo,
//               targetedPost: payload.targetedPost,
//               targetedProfile: payload.targetedProfile,
//             },
//             target_post_uri: payload.targetedPostUri,
//           });

//           resultDetails.push({ service: 'log', result: 'logged' });
//         } catch (logError: any) {
//           console.error(
//             `Report ${idx}: Error creating moderation log:`,
//             logError
//           );
//           resultDetails.push({ service: 'log', error: logError.message });
//         }

//         return { report: payload, status: 'success', details: resultDetails };
//       })
//     );

//     res.json({ summary });
//   } catch (error: any) {
//     console.error('Error reporting moderation events:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };
/**
 * Processes a single moderation report.
 * Returns an object containing the report payload, status, and details from processing each service and logging.
 */
async function processReport(
  report: any,
  idx: number,
  actingUser: { did: string }
): Promise<any> {
  // Build the payload and override performed_by with actingUser.did
  const payload = {
    targetedPostUri: report.targetedPostUri,
    reason: report.reason,
    toServices: report.toServices,
    targetedUserDid: report.targetedUserDid,
    uri: report.uri,
    feedName: report.feedName,
    additionalInfo: report.additionalInfo || '',
    action: report.action, // expected to be a valid ModAction
    targetedPost: report.targetedPost,
    targetedProfile: report.targetedProfile,
    performed_by: actingUser.did,
  };

  const resultDetails: any[] = [];

  // Helper to process a service
  async function processService(serviceValue: string) {
    if (serviceValue === 'blacksky') {
      // Only process Blacksky if the gate passes
      const allowed = await customServiceGate('blacksky', payload.uri);
      if (allowed) {
        try {
          const blackskyResult = await reportToBlacksky([
            { uri: payload.targetedPostUri },
          ]);
          resultDetails.push({
            service: 'blacksky',
            result: blackskyResult,
          });
        } catch (bsError: any) {
          console.error(`Report ${idx}: Error reporting to Blacksky:`, bsError);
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
    } else if (serviceValue === 'ozone') {
      // Process Ozone unconditionally
      try {
        console.log('reporting to ozone, not blacksky');
        const ozoneResult = await reportToOzone();
        resultDetails.push({ service: 'ozone', result: ozoneResult });
      } catch (ozError: any) {
        console.error(`Report ${idx}: Error reporting to Ozone:`, ozError);
        resultDetails.push({ service: 'ozone', error: ozError.message });
      }
    } else {
      // For any future services, default behavior (or add extra logic as needed)
      resultDetails.push({
        service: serviceValue,
        error: 'Service not implemented',
      });
    }
  }

  // Process each requested service.
  // Assume payload.toServices is an array of ModerationService objects having a "value" property.
  for (const service of payload.toServices) {
    await processService(service.value);
  }

  // Attempt to create a moderation log entry.
  try {
    console.log(
      `Report ${idx}: Creating moderation log with payload:`,
      payload
    );
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
        toServices: payload.toServices,
      },
      target_post_uri: payload.targetedPostUri,
    });
    console.log(`Report ${idx}: Moderation log created.`);
    resultDetails.push({ service: 'log', result: 'logged' });
  } catch (logError: any) {
    console.error(`Report ${idx}: Error creating moderation log:`, logError);
    resultDetails.push({ service: 'log', error: logError.message });
  }

  return { report: payload, status: 'success', details: resultDetails };
}

/**
 * Processes a bulk array of moderation reports. For each report, the function:
 * - Validates and builds the payload (using actingUser.did for performed_by)
 * - Processes each requested moderation service (e.g., Blacksky, Ozone)
 * - Creates a moderation log entry
 * - Returns a summary of processing for each report.
 */
export const reportModerationEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Ensure the authenticated user is present.
    const actingUser = req.user;
    if (!actingUser) {
      console.error('No acting user found in request.');
      res.status(401).json({ error: 'Unauthorized: No valid session' });
      return;
    }

    // Ensure the request body is an array; if not, wrap it.
    let reports = req.body;
    if (!Array.isArray(reports)) {
      console.warn('Request body is not an array. Wrapping in an array.');
      reports = [reports];
    }

    // Debug log the incoming reports.
    console.log('Received reports:', reports);

    // Process each report individually using the helper.
    const summary = await Promise.all(
      reports.map((report: any, idx: number) =>
        processReport(report, idx, actingUser)
      )
    );

    res.json({ summary });
  } catch (error: any) {
    console.error('Error reporting moderation events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
