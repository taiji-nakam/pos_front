import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(":::Headers:::");
  console.log(req.headers);

  let ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  // IPv6 (::1) の場合は IPv4 (127.0.0.1) に変換(Localの場合)
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  console.log(":::Client IP:::");
  console.log(ip);

  res.status(200).json({ ip });
}
