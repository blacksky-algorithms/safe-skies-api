import { Request, Response } from 'express';
import {
  canPerformAction,
  fetchModsForAdminFeeds,
  fetchFeedModsWithProfiles,
  setFeedRole,
  getFeedRole,
} from '../repos/permissions';

export const promoteModerator = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const actingUser = req.user;
    if (!actingUser) {
      res.status(401).json({ error: 'Unauthorized: No valid session' });
      return;
    }

    const { targetUserDid, uri, feedName, metadata } = req.body;
    if (!targetUserDid || !uri || !feedName) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const hasPermission = await canPerformAction(
      actingUser.did,
      'mod_promote',
      uri
    );

    if (!hasPermission) {
      res
        .status(403)
        .json({ error: 'Insufficient permissions to promote moderator' });
      return;
    }

    const success = await setFeedRole(
      targetUserDid,
      uri,
      'mod',
      actingUser.did,
      feedName
    );
    if (!success) {
      res.status(500).json({ error: 'Failed to promote moderator' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in promoteModerator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const demoteModerator = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const actingUser = req.user;
    if (!actingUser) {
      res.status(401).json({ error: 'Unauthorized: No valid session' });
      return;
    }

    const { modDid, uri, feedName } = req.body;
    if (!modDid || !uri || !feedName) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const hasPermission = await canPerformAction(
      actingUser.did,
      'mod_demote',
      uri
    );
    if (!hasPermission) {
      res
        .status(403)
        .json({ error: 'Insufficient permissions to demote moderator' });
      return;
    }

    const success = await setFeedRole(
      modDid,
      uri,
      'user',
      actingUser.did,
      feedName
    );

    if (!success) {
      res.status(500).json({ error: 'Failed to demote moderator' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in demoteModerator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * - If a "feed" query parameter is provided (as a string feed URI), then the function
 *   first checks that the acting user has admin privileges on that feed. If so, it returns
 *   the moderators for that specific feed.
 * - If no "feed" parameter is provided, then it returns all moderator profiles for feeds
 *   where the acting admin (from the JWT) has admin privileges.
 */
export const listModerators = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const actingUser = req.user;
    if (!actingUser) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const feedParam = req.query.feed;
    if (feedParam && typeof feedParam === 'string') {
      const actingUserRole = await getFeedRole(actingUser.did, feedParam);
      if (actingUserRole !== 'admin') {
        res.status(403).json({
          error:
            'Insufficient permissions: Only admins can view moderators for this feed.',
        });
        return;
      }

      const result = await fetchFeedModsWithProfiles([{ uri: feedParam }]);
      const moderators = result.length ? result[0].moderators : [];
      res.json({ moderators });
    } else {
      const moderators = await fetchModsForAdminFeeds(actingUser.did);
      res.json({ moderators });
    }
  } catch (error) {
    console.error('Error in listModerators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkFeedRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const actingUser = req.user;
    if (!actingUser) {
      res.status(401).json({ error: 'Unauthorized: No valid session' });
      return;
    }

    const { targetDid, uri } = req.query;
    if (
      !targetDid ||
      typeof targetDid !== 'string' ||
      !uri ||
      typeof uri !== 'string'
    ) {
      res.status(400).json({
        error: 'Missing or invalid parameters: targetDid and uri are required.',
      });
      return;
    }

    const actingUserRole = await getFeedRole(actingUser.did, uri);
    if (actingUserRole !== 'admin') {
      res.status(403).json({
        error: 'Insufficient permissions: Only admins can check feed roles.',
      });
      return;
    }

    const targetUserRole = await getFeedRole(targetDid, uri);
    res.json({ role: targetUserRole });
  } catch (error) {
    console.error('Error checking feed role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
