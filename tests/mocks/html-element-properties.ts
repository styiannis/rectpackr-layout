// Mock DOM element dimensions
Object.defineProperties(HTMLElement.prototype, {
  offsetWidth: {
    get: function () {
      return Number.parseFloat(this.style.width) || 0;
    },
  },
  offsetHeight: {
    get: function () {
      return Number.parseFloat(this.style.height) || 0;
    },
  },
  clientWidth: {
    get: function () {
      return Number.parseFloat(this.style.width) || 0;
    },
  },
  clientHeight: {
    get: function () {
      return Number.parseFloat(this.style.height) || 0;
    },
  },
});
