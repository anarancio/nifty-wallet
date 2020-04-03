const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../ui/app/actions')

module.exports = connect(mapStateToProps)(DomainsScreen)

function mapStateToProps (state) {
  return {}
}

inherits(DomainsScreen, Component)
function DomainsScreen () {
  Component.call(this)
}

DomainsScreen.prototype.render = function () {
  const state = this.props
  const version = global.platform.getVersion()

  return (
    h('.flex-column.flex-grow', {
      style: {
        maxWidth: '400px',
      },
    }, [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: (event) => {
            state.dispatch(actions.goHome())
          },
          style: {
            position: 'absolute',
            left: '30px',
          },
        }),
        h('h2', 'Domains Screen'),
      ]),

      // main view
      h('.flex-column.flex-justify-center.flex-grow.select-none', [
        h('.flex-space-around', {
          style: {
            padding: '0 30px',
          },
        }, [

          h('.info', [
            h('div', 'RNS Domains'),
          ]),
        ]),
      ]),
    ])
  )
}

DomainsScreen.prototype.navigateTo = function (url) {
  global.platform.openWindow({ url })
}

