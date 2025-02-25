import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(":::Headers:::", req.headers);

  const forwarded = req.headers["x-forwarded-for"];
  let ip = forwarded ? forwarded.toString().split(",")[0] : req.socket?.remoteAddress;

  // IPv6 の ::1 を 127.0.0.1 に変換 (ローカル環境対策)
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  // ポート番号を削除 (ポートが含まれている場合のみ)
  ip = ip?.includes(":") ? ip.split(":")[0] : ip;

  console.log(":::Client IP:::", ip);
  res.status(200).json({ ip });
}
