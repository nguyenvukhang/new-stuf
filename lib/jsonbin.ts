import axios from "axios";

export type Track = { id: string; name: string; artists: string[] };
export type Store = {
  snapshotId: string;
  tracks: Track[];
};

export type Serializeable =
  | string
  | number
  | Serializeable[]
  | { [key: string]: Serializeable };

export function buildApi(key: string, binId: string) {
  const jsonbin = axios.create({
    baseURL: `https://api.jsonbin.io/v3`,
    headers: { "X-Access-Key": key },
  });
  return {
    get: () => jsonbin.get(`/b/${binId}`).then((r) => r.data.record as Store),
    update: (data: Store) => jsonbin.put(`/b/${binId}`, data),
  };
}
