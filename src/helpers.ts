import he from 'he'
import axios from 'axios'
import { find } from 'lodash'
import striptags from 'striptags'
import { Subtitle } from './types'

export const youtubeGetID = (url: string): string => {
  let ID = ''
  const replacedUrl = url
    .replace(/(>|<)/gi, '')
    .split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/)
  if (replacedUrl[2] !== undefined) {
    ID = replacedUrl[2].split(/[^0-9a-z_\-]/i)[0]
  }
  return ID
}

export const getSubtitles = async ({
  videoID,
  lang,
}: {
  videoID: string
  lang: string
}): Promise<Subtitle[]> => {
  const { data } = await axios.get(`https://youtube.com/watch?v=${videoID}`)

  if (!data.includes('captionTracks'))
    throw new Error(`Could not find captions for video: ${videoID}`)

  const regex = /({"captionTracks":.*isTranslatable":(true|false)}])/
  const [match] = regex.exec(data) || []
  const { captionTracks } = JSON.parse(`${match}}`)

  const subtitle =
    find(captionTracks, {
      vssId: `.${lang}`,
    }) ||
    find(captionTracks, {
      vssId: `a.${lang}`,
    }) ||
    find(captionTracks, ({ vssId }) => vssId && vssId.match(`.${lang} `)) ||
    null

  if (!subtitle || (subtitle && !subtitle.baseUrl))
    throw new Error(`Could not find ${lang} captions for ${videoID}`)

  const { data: transcript } = await axios.get(subtitle.baseUrl)

  let count = 0
  const lines = transcript
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
    .replace('</transcript>', '')
    .split('</text>')
    .filter((line: string) => line && line.trim())
    .map((line: string) => {
      const startRegex = /start="([\d.]+)"/
      const durRegex = /dur="([\d.]+)"/
      const [, startTime] = startRegex.exec(line) || []
      const [, dur] = durRegex.exec(line) || []

      const htmlText = line
        .replace(/<text.+>/, '')
        .replace(/&amp;/gi, '&')
        .replace(/<\/?[^>]+(>|$)/g, '')

      const decodedText = he.decode(htmlText)
      const endTime = startTime + dur
      const text = striptags(decodedText)

      return {
        id: count++,
        startTime,
        dur,
        endTime,
        text,
      }
    })

  return lines
}

export const convertToSrt = (content: Subtitle[]): string => {
  let res = ''
  content.forEach((value) => {
    res += value.id + '\r\n'
    res += value.startTime + ' --> ' + value.endTime + '\r\n'
    res += value.text.replace('\n', '\r\n') + '\r\n\r\n'
  })
  return res
}
