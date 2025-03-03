// src/repos/logs.ts
import { db } from '../config/db';
import { LogFilters } from '../lib/types/logs';
import { ModAction } from '../lib/types/moderation';

export interface LogEntry {
  id: string;
  uri: string;
  performed_by: string;
  action: string;
  target_post_uri?: string;
  target_user_did?: string;
  metadata?: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  reason?: string;
  to_services?: string[];
  // Additional fields for joined profile data:
  performed_by_profile?: {
    did: string;
    handle: string;
    display_name?: string;
    avatar?: string;
  };
  target_user_profile?: {
    did: string;
    handle: string;
    display_name?: string;
    avatar?: string;
  };
}

export async function getLogs(filters: LogFilters): Promise<LogEntry[]> {
  const query = db('logs')
    .select(
      'logs.*',
      'p1.did as performed_by_did',
      'p1.handle as performed_by_handle',
      'p1.display_name as performed_by_display_name',
      'p1.avatar as performed_by_avatar',
      'p2.did as target_user_did_joined',
      'p2.handle as target_user_handle',
      'p2.display_name as target_user_display_name',
      'p2.avatar as target_user_avatar'
    )
    .leftJoin('profiles as p1', 'logs.performed_by', 'p1.did')
    .leftJoin('profiles as p2', 'logs.target_user_did', 'p2.did');

  if (filters.uri) {
    query.where('logs.uri', filters.uri);
  }
  if (filters.action) {
    query.where('logs.action', filters.action);
  }
  if (filters.performedBy) {
    query.where('logs.performed_by', filters.performedBy);
  }
  if (filters.targetUser) {
    query.where('logs.target_user_did', filters.targetUser);
  }
  if (filters.targetPost) {
    query.where('logs.target_post_uri', filters.targetPost);
  }
  if (filters.dateRange) {
    query.where('logs.created_at', '>=', filters.dateRange.fromDate);
    query.where('logs.created_at', '<=', filters.dateRange.toDate);
  }
  query.orderBy(
    'logs.created_at',
    filters.sortBy === 'ascending' ? 'asc' : 'desc'
  );

  const rows = await query;
  // Map rows to include joined profile data.
  const logs: LogEntry[] = rows.map((row: any) => ({
    id: row.id,
    uri: row.uri,
    performed_by: row.performed_by,
    action: row.action as ModAction,
    target_post_uri: row.target_post_uri,
    target_user_did: row.target_user_did,
    metadata: row.metadata,
    created_at: row.created_at,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    reason: row.reason,
    to_services: row.to_services,
    performed_by_profile: row.performed_by_did
      ? {
          did: row.performed_by_did,
          handle: row.performed_by_handle,
          display_name: row.performed_by_display_name,
          avatar: row.performed_by_avatar,
        }
      : undefined,
    target_user_profile: row.target_user_did_joined
      ? {
          did: row.target_user_did_joined,
          handle: row.target_user_handle,
          display_name: row.target_user_display_name,
          avatar: row.target_user_avatar,
        }
      : undefined,
  }));

  return logs;
}
