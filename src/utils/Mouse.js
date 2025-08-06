export class Mouse {
  #callbacks = [];
  #normalized = { x: 0, y: 0 };

  constructor() {
    this.#setupListeners();
  }

  #setupListeners() {
    window.addEventListener('mousemove', (e) => this.#handleMove(e));
    window.addEventListener('touchmove', (e) => this.#handleTouchMove(e), { passive: false });
  }

  #handleMove(event) {
    this.#normalized.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.#normalized.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.#notifyCallbacks();
  }

  #handleTouchMove(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.#normalized.x = (touch.clientX / window.innerWidth) * 2 - 1;
      this.#normalized.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      this.#notifyCallbacks();
    }
  }

  #notifyCallbacks() {
    this.#callbacks.forEach(callback => callback(this.#normalized));
  }

  onMove(callback) {
    this.#callbacks.push(callback);
  }

  get normalized() {
    return { ...this.#normalized };
  }
}
