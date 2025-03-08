import { Request, Response } from 'express';
import { fetchReportOptions } from '../repos/moderation';

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
