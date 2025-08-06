/**
 * Common utilities for working with Three.js scene objects
 */

/**
 * Traverse all mesh children of a root object and apply callback
 * @param {THREE.Object3D} root - Root object to traverse
 * @param {Function} callback - Function to call for each mesh
 */
export function traverseMeshes(root, callback) {
  root.traverse((child) => {
    if (child.isMesh) {
      callback(child)
    }
  })
}

/**
 * Set wireframe mode for all meshes in an object
 * @param {THREE.Object3D} root - Root object
 * @param {boolean} wireframe - Wireframe mode
 */
export function setWireframeMode(root, wireframe) {
  traverseMeshes(root, (mesh) => {
    if (mesh.material) {
      mesh.material.wireframe = wireframe
    }
  })
}

/**
 * Set visibility for an object and all its children
 * @param {THREE.Object3D} object - Object to set visibility
 * @param {boolean} visible - Visibility state
 */
export function setVisibility(object, visible) {
  if (object) {
    object.visible = visible
  }
}
