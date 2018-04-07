const http = require('http').createServer().listen(8000)
const octokit = require('@octokit/rest')()

require('dotenv').config()
const updateInfo = {
  email: process.env.EMAIL,
  owner: process.env.OWNER,
  repo: process.env.REPO,
  token: process.env.TOKEN
}

updateDate(updateInfo)

async function updateDate ({email, owner, repo, token}) {
  const date = new Date()
  const delay = (((24 - date.getUTCHours()) * 60) - date.getUTCMinutes()) * 60000

  const display = ':spiral_calendar: ' + date.toUTCString().slice(0, date.toUTCString().lastIndexOf(' ') - 9) + ' (UTC)'

  const content = Buffer.from('# ' + display).toString('base64')
  const message = 'update date'
  const committer = {name: owner, email}

  try {
    octokit.authenticate({type: 'oauth', token})

    const readme = await octokit.repos.getReadme({owner, repo})
    await octokit.repos.updateFile({owner, repo, message, content, committer, sha: readme.data.sha, path: readme.data.path})
    await octokit.repos.edit({owner, name: repo, repo, description: display})
  } catch (e) {
    console.error('IT BROKE! -> ' + e)
    process.exit(1)
  }

  setTimeout(updateDate, delay, updateInfo)
  console.log(delay + ' milliseconds till next update');
}
