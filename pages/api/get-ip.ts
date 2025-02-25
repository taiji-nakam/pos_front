import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(":::Headers:::", req.headers);

  const forwarded = req.headers["x-forwarded-for"];
  let ip = forwarded ? forwarded.toString().split(",")[0] : req.socket?.remoteAddress;

  // ✅ ログを追加して取得IPを確認
  console.log(":::Raw Client IP:::", ip);

  // IPv6 の ::1 を 127.0.0.1 に変換 (ローカル環境対策)
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  // ポート番号を削除 (ポートが含まれている場合のみ)
  if (ip && ip.includes(":")) {
    ip = ip.split(":")[0];  // `:` で分割し、最初の部分だけ取得
  }

  console.log(":::Processed Client IP:::", ip); // 最終的に FastAPI に送る IP

  res.status(200).json({ ip });
}
