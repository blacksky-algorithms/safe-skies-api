import { Request, Response } from "express";
import { getEnrichedProfile } from "../repos/profile";

export const getProfile = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const userDid = req.user?.did;
		if (!userDid) {
			res.status(401).json({ error: "User not authenticated" });
			return;
		}
		const enrichedProfile = await getEnrichedProfile(userDid);
		res.status(200).json({ profile: enrichedProfile });
	} catch (error) {
		console.error("Error fetching enriched profile:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
