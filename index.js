require('dotenv').config()

const http = require('http')
const axios = require('axios')
const octokit = require('@octokit/rest')()

const ghInfo = {
  email: process.env.EMAIL,
  owner: process.env.OWNER,
  token: process.env.TOKEN
}

// This allows to add new sources (with same API resp format) and randomize them
const QT_SRC = [
  'https://talaikis.com/api/quotes/random/',
  'http://quotes.stormconsultancy.co.uk/random.json'
]


// Necessary server for NOW deployment
http.createServer().listen(8000)

// Work initializer
dailyTasks()


// Tasks index
async function dailyTasks () {
  const date = new Date()
  const delay = (((24 - date.getUTCHours()) * 60) - date.getUTCMinutes()) * 60000

  await updateDate(date)
  await updateQuote()

  setTimeout(dailyTasks, delay)
  console.log(`${delay} milliseconds till next update`)
}


// Updates today-is repo
async function updateDate (date) {
  const description = `:spiral_calendar: ${date.toUTCString().slice(0, date.toUTCString().lastIndexOf(' ') - 9)} (UTC)`
  const content = Buffer.from(`# ${description}`).toString('base64')

  await updateRepo('today-is', description, content, 'calendar auto-update: by daily-worker')
  console.log(`Today is: ${description}`)
}
// Updates quote42day repo
async function updateQuote () {
  const quote = await getRandomQuote()

  const description = `:scroll: —${quote.author}`
  const content = Buffer.from(`> ${quote.quote}
  #### —${quote.author} [:scroll:](${quote.permalink})`).toString('base64')

  await updateRepo('quote42day', description, content, 'quote auto-update: by daily-worker')
  console.log(`"${quote.quote}" [${quote.author}]`)
}


// --- APIs methods --- //


async function updateRepo(repo, description, content, message) {
  const committer = {name: ghInfo.owner, email: ghInfo.email}

  try {
    await octokit.authenticate({type: 'oauth', token: ghInfo.token})

    // Updates the repo description, if not null
    if (description)
      octokit.repos.edit({owner: ghInfo.owner, name: repo, repo, description})

    const readme = await octokit.repos.getReadme({owner: ghInfo.owner, repo: repo})
    octokit.repos.updateFile({
      owner: ghInfo.owner, repo, message, content, committer,
      sha: readme.data.sha, path: readme.data.path
    })
  } catch (e) {
    console.error('IT BROKE! -> ' + e)
    process.exit(1)
  }
}

async function getRandomQuote() {
  let srcIndex = Math.floor(Math.random() * Math.floor(QT_SRC.length))

  try {
    const resp = await axios.get(QT_SRC[srcIndex])
    return resp.data
  } catch (error) {
    console.error(error);
  }
}
