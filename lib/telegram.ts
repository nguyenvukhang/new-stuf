import axios from 'axios'

export function buildTelegram(token: string, chatId: string) {
  const telegram = axios.create({
    baseURL: `https://api.telegram.org/bot${token}`,
  })
  return {
    send: (text: string) =>
      telegram.get('/sendMessage', {
        params: { parse_mode: 'HTML', chat_id: chatId, text },
      }),
  }
}
