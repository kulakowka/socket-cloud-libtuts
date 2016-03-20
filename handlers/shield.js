'use strict'

const numeral = require('numeral')
var { Project } = require('models')

module.exports = {
  show (req, res, next) {
    const slug = req.params.slug
    console.log('slug', slug)
    Project
    .filter({ slug })
    .getJoin()
    .pluck(
      'id',
      'name',
      'slug',
      'tutorialsCount',
      'createdAt',
      'updatedAt',
      { author: ['id', 'username', 'fullName'] }
    )
    .execute()
    .then((projects) => {
      let project = projects.pop()
      let count = 0
      console.log('project', project)
      if (project && project.tutorialsCount) count = project.tutorialsCount

      res.set({
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'image/svg+xml'
      })

      let data = getShield(count)
      res.send(data)
    })
  }
}

function getShield (count) {
  const countText = numeral(count).format('0a')
  const countLength = countText.length

  if (countLength < 2) return `<svg xmlns="http://www.w3.org/2000/svg" width="73" height="20"><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><mask id="a"><rect width="73" height="20" rx="3" fill="#fff"/></mask><g mask="url(#a)"><path fill="#555" d="M0 0h56v20H0z"/><path fill="#4c1" d="M56 0h17v20H56z"/><path fill="url(#b)" d="M0 0h73v20H0z"/></g><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11"><text x="28" y="15" fill="#010101" fill-opacity=".3">tutorials</text><text x="28" y="14">tutorials</text><text x="63.5" y="15" fill="#010101" fill-opacity=".3">${countText}</text><text x="63.5" y="14">${countText}</text></g></svg>`
  else if (countLength < 3) return `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="20"><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><mask id="a"><rect width="84" height="20" rx="3" fill="#fff"/></mask><g mask="url(#a)"><path fill="#555" d="M0 0h56v20H0z"/><path fill="#4c1" d="M56 0h28v20H56z"/><path fill="url(#b)" d="M0 0h84v20H0z"/></g><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11"><text x="28" y="15" fill="#010101" fill-opacity=".3">tutorials</text><text x="28" y="14">tutorials</text><text x="69" y="15" fill="#010101" fill-opacity=".3">${countText}</text><text x="69" y="14">${countText}</text></g></svg>`
  else if (countLength < 4) return `<svg xmlns="http://www.w3.org/2000/svg" width="87" height="20"><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><mask id="a"><rect width="87" height="20" rx="3" fill="#fff"/></mask><g mask="url(#a)"><path fill="#555" d="M0 0h56v20H0z"/><path fill="#4c1" d="M56 0h31v20H56z"/><path fill="url(#b)" d="M0 0h87v20H0z"/></g><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11"><text x="28" y="15" fill="#010101" fill-opacity=".3">tutorials</text><text x="28" y="14">tutorials</text><text x="70.5" y="15" fill="#010101" fill-opacity=".3">${countText}</text><text x="70.5" y="14">${countText}</text></g></svg>`
  else return `<svg xmlns="http://www.w3.org/2000/svg" width="94" height="20"><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><mask id="a"><rect width="94" height="20" rx="3" fill="#fff"/></mask><g mask="url(#a)"><path fill="#555" d="M0 0h56v20H0z"/><path fill="#4c1" d="M56 0h38v20H56z"/><path fill="url(#b)" d="M0 0h94v20H0z"/></g><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11"><text x="28" y="15" fill="#010101" fill-opacity=".3">tutorials</text><text x="28" y="14">tutorials</text><text x="74" y="15" fill="#010101" fill-opacity=".3">${countText}</text><text x="74" y="14">${countText}</text></g></svg>`
}
