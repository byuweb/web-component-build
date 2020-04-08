export default class TestComponent extends window.HTMLElement {
  connectedCallback () {
    window.alert('Hello from a test component')
  }
}
