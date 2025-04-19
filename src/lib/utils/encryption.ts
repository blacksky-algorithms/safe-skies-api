import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { config } from "../../config";

const ENCRYPTION_KEY = config.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
	throw new Error("ENCRYPTION_KEY is not defined.");
}

const ENCRYPTION_KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, "base64");
if (ENCRYPTION_KEY_BUFFER.length !== 32) {
	throw new Error("ENCRYPTION_KEY must be exactly 32 bytes.");
}

export const encrypt = (data: string) => {
	const iv = randomBytes(16);
	const cipher = createCipheriv("aes-256-cbc", ENCRYPTION_KEY_BUFFER, iv);
	return {
		iv: iv.toString("hex"),
		encrypted: cipher.update(data, "utf8", "hex") + cipher.final("hex"),
	};
};

export const decrypt = ({
	iv,
	encrypted,
}: {
	iv: string;
	encrypted: string;
}) => {
	const decipher = createDecipheriv(
		"aes-256-cbc",
		ENCRYPTION_KEY_BUFFER,
		Buffer.from(iv, "hex"),
	);
	return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
};
