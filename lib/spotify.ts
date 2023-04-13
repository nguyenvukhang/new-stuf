import axios from 'axios'
import type { Store } from './jsonbin'

const spotify = {
  tokenUrl: 'https://accounts.spotify.com/api/token',
  playlistUrl: 'https://api.spotify.com/v1/playlists/',
}

/** Initial authorization */
async function getAccessToken(id: string, secret: string) {
  const body = {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    params: {
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
    },
  }
  return axios
    .post(spotify.tokenUrl, {}, body)
    .then((res) => res.data.access_token)
}

/** grab playlist information with an access token */
async function getPlaylist(token: string, id: string) {
  return axios
    .get(`https://api.spotify.com/v1/playlists/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      const data = res.data
      const snapshotId = data['snapshot_id']
      const tracks = data['tracks']['items'].map((t: any) => ({
        name: t.track.name,
        artists: t.track.artists.map((v: any) => v.name),
        id: t.track.id,
      }))
      return { snapshotId, tracks } as Store
    })
}

export function buildSpotify(props: {
  clientId: string
  clientSecret: string
}) {
  const { clientId: id, clientSecret: sc } = props
  return {
    playlist: async (playlistId: string) =>
      getAccessToken(id, sc).then((t) => getPlaylist(t, playlistId)),
  }
}
