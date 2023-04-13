// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { buildApi, Store, Track } from "@/lib/jsonbin";
import { buildSpotify } from "@/lib/spotify";
import { buildTelegram } from "@/lib/telegram";

type Diff = { added: Track[]; removed: Track[] };

const JSONBIN_ID = process.env["JSONBIN_ID"] || "";
const JSONBIN_KEY = process.env["JSONBIN_KEY"] || "";
const PLAYLIST_ID = process.env["PLAYLIST_ID"] || "";
const SPOTIFY_CLIENT_ID = process.env["SPOTIFY_CLIENT_ID"] || "";
const SPOTIFY_CLIENT_SECRET = process.env["SPOTIFY_CLIENT_SECRET"] || "";
const TELEGRAM_TOKEN = process.env["TELEGRAM_TOKEN"] || "";
const TELEGRAM_CHAT_ID = process.env["TELEGRAM_CHAT_ID"] || "";

const database = buildApi(JSONBIN_KEY, JSONBIN_ID);
const spotify = buildSpotify({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
});
const telegram = buildTelegram(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID);

function trackDiff(prev: Track[], curr: Track[]): Diff {
  const p = new Set(prev.map((v) => v.id));
  const c = new Set(curr.map((v) => v.id));
  return {
    added: curr.filter((v) => !p.has(v.id)),
    removed: prev.filter((v) => !c.has(v.id)),
  };
}

function trackToString(t: Track) {
  return `\
<code>* </code>${t.name}
<code>  </code><i>${t.artists.join(", ")}</i>
`.trim();
}

export const report = {
  added: (tracks: Track[]): string => {
    const n = tracks.length;
    const t = `<b>Added ${n} new song${n == 1 ? "" : "s"}:</b>\n`;
    return t + tracks.map(trackToString).join("\n");
  },
  removed: (tracks: Track[]): string => {
    const n = tracks.length;
    const t = `<b>Removed ${n} song${n == 1 ? "" : "s"}:</b>\n`;
    return t + tracks.map(trackToString).join("\n");
  },
};

export function main() {}

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  return Promise.all([database.get(), spotify.playlist(PLAYLIST_ID)])
    .then(async ([prev, curr]) => {
      // skip processing if snapshot is identical
      if (prev.snapshotId === curr.snapshotId)
        return { added: [], removed: [] };
      const tasks: Promise<any>[] = [];
      tasks.push(database.update(curr));
      const { added, removed } = trackDiff(prev.tracks, curr.tracks);
      const msg = [] as string[];
      if (added.length > 0) msg.push(report.added(added));
      if (removed.length > 0) msg.push(report.removed(removed));
      if (msg.length > 0) tasks.push(telegram.send(msg.join("\n")));
      return Promise.allSettled(tasks).then(() => ({ added, removed }));
    })
    .then((data) => res.status(200).json(data));
}
