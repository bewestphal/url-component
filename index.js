import React, {PureComponent} from 'react';
import PropTypes from 'prop-types'
import {newScript, noop, series} from "./utils";


let loadedScripts = []
let pendingScripts = {}
let failedScripts = []
let scriptToWindowProps = {}

class URLComponent extends PureComponent {
  static propTypes = {
    url: PropTypes.string.isRequired,
    componentName: PropTypes.string.isRequired,
    onComponentLoaded: PropTypes.func,
    componentProps: PropTypes.object,
    children: PropTypes.oneOfType([
      React.PropTypes.arrayOf(React.PropTypes.node),
      React.PropTypes.node
    ]),
  }

  constructor(props) {
    super(props)
    this.state = {
      isLoaded: false,
      isLoadError: false,
    };

    this.ComponentClass = null
    this._isMounted = false;
    this.libName = null
  }

  componentWillMount() {
    this._isMounted = true;

    const {componentName, url, onComponentLoaded} = this.props

    this.startLoadingScripts([url], err => {
      if (!this._isMounted) { return; }

      this.setState({isLoaded: true, isLoadError: err}, () => {
        if (!err) {
          this.ComponentClass = window[this.libName] && window[this.libName][componentName]
          onComponentLoaded && onComponentLoaded(this.ComponentClass)
          this.forceUpdate()
        }
      })
    })
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  loadNewScript(script) {
    const src = typeof script === 'object' ? script.src : script
    if (loadedScripts.indexOf(src) < 0) {
      return taskComplete => {
        const callbacks = pendingScripts[src] || []
        callbacks.push(taskComplete)
        pendingScripts[src] = callbacks
        if (callbacks.length === 1) {
          return newScript(script)(err => {
            pendingScripts[src].forEach(cb => cb(err, src))
            delete pendingScripts[src]
          })
        }
      }
    }
  }

  addToCache(entry) {
    if (loadedScripts.indexOf(entry) < 0) {
      loadedScripts.push(entry)
    }
  }

  removeFailedScripts() {
    if (failedScripts.length > 0) {
      failedScripts.forEach((script) => {
        const node = document.querySelector(`script[src='${script}']`)
        if (node != null) {
          node.parentNode.removeChild(node)
        }
      })

      failedScripts = []
    }
  }

  startLoadingScripts(scripts, onComplete = noop) {
    // sequence load
    const tasks = scripts.map(src => {
      if (Array.isArray(src)) {
        return src.map(this.loadNewScript)
      }
      else return this.loadNewScript(src)
    })

    // If not a new script get window property
    if (tasks[0] === undefined) {
      this.libName = scriptToWindowProps[scripts[0]]
    }

    // For Newly Loaded Scripts, save get window property to access
    const windowPropsBefore = Object.getOwnPropertyNames(window)

    series(...tasks)((err, src) => {
      const windowPropsAfter = Object.getOwnPropertyNames(window)
      const newProperties = windowPropsAfter.filter(x => !windowPropsBefore.includes(x));

      this.libName = newProperties[0]
      scriptToWindowProps[src] = this.libName

      if (err) {
        failedScripts.push(src)
      }
      else {
        if (Array.isArray(src)) {
          src.forEach(this.addToCache)
        }
        else this.addToCache(src)
      }
    })(err => {
      this.removeFailedScripts()
      onComplete(err)
    })
  }

  render() {
    if (!this.state.isLoaded || !this.ComponentClass) {
      return "Loading..."
    }

    const ComponentClass = this.ComponentClass

    const {componentProps} = this.props

    return (
      <ComponentClass {...componentProps}>
        {this.props.children}
      </ComponentClass>
    )
  }
}

export default URLComponent