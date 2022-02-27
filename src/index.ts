import readline from 'readline'
import { youtubeGetID } from './helpers'
import { toSrt } from './toSrt'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('YouTube URL: ', (url) => {
  if (url === '') {
    console.log('Please enter a URL.')
    rl.close()
  } else {
    const videoID = youtubeGetID(url)
    rl.question(`Language(country code | default is "en"): `, (lang) => {
      toSrt(videoID, lang)
      rl.close()
    })
  }
})
