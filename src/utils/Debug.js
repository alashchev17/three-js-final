import Stats from 'stats.js'
import { GUI } from 'lil-gui'

export class Debug {
  #stats
  #gui
  params = {}           // Current parameter values
  controllers = {}      // Map property -> controller
  folders = {}          // Map folderName -> GUI folder

  constructor({ enableStats = true } = {}) {
    if (enableStats) this.#setupStats()
    this.#setupGUI()
  }

  #setupStats() {
    this.#stats = new Stats()
    this.#stats.showPanel(0) // 0: fps, 1: ms, 2: mb
    this.#stats.dom.style.position = 'fixed'
    this.#stats.dom.style.top = '0px'
    this.#stats.dom.style.left = '0px'
    this.#stats.dom.style.zIndex = '100'
    document.body.appendChild(this.#stats.dom)
  }

  #setupGUI() {
    this.#gui = new GUI({ width: 260 })
    this.#gui.domElement.style.position = 'fixed'
    this.#gui.domElement.style.top = '0px'
    this.#gui.domElement.style.right = '0px'
    this.#gui.domElement.style.zIndex = '100'
  }

  /**
   * Add debug controls from definitions array
   * @param {Array} definitions - Control definitions
   * Each definition: { name, property, type:'boolean'|'range', range?:[min,max,step], 
   *                   folder?: 'Folder Name', initialValue?, onChange: value => {} }
   */
  add(definitions = []) {
    definitions.forEach(def => {
      // Initialize parameter with provided initial value or sensible defaults
      this.params[def.property] = def.initialValue !== undefined 
        ? def.initialValue 
        : (def.type === 'boolean' ? false : (def.range ? def.range[0] : 0))

      // Get or create folder
      const parent = def.folder
        ? (this.folders[def.folder] ||= this.#gui.addFolder(def.folder))
        : this.#gui

      // Create controller based on type
      let controller
      if (def.type === 'boolean') {
        controller = parent.add(this.params, def.property).name(def.name)
      } else if (def.type === 'range' && def.range) {
        const [min, max, step] = def.range
        controller = parent.add(this.params, def.property, min, max, step).name(def.name)
      } else {
        controller = parent.add(this.params, def.property).name(def.name)
      }

      // Wire onChange callback
      if (typeof def.onChange === 'function') {
        controller.onChange(def.onChange)
      }

      // Store controller reference
      this.controllers[def.property] = controller
    })
  }

  update() {
    this.#stats?.update()
  }

  get gui() {
    return this.#gui
  }
}
