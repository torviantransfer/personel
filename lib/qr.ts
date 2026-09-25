import "server-only";
import QRCode from "qrcode";

/** QR içeriği: yalnızca işletmenin token'ı. Kullanıcı bilgisi veya anahtar içermez. */
export const qrContent = (token: string) => `WORKPLACE:${token}`;

export function qrSvg(token: string): Promise<string> {
  return QRCode.toString(qrContent(token), { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#111827", light: "#ffffff" } });
}
