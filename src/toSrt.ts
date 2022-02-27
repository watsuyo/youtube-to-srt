// @ts-ignore
import fs from 'fs'
import { convertToSrt, getSubtitles } from './helpers'

/**
 * Returns srt file from YouTube video by video ID and language code.
 * @param {string} videoID
 * @param {string} lang country code
 */
export const toSrt = (videoID: string, lang?: string) =>
  getSubtitles({
    videoID,
    lang: lang || 'en',
  })
    .then((subtitles) => {
      fs.writeFile('output.srt', convertToSrt(subtitles), (err) => {
        if (err) {
          throw err
        }
        console.log('Created Success! output.srt.')
      })
    })
    .catch((err: Error) => {
      console.error(err)
    })
