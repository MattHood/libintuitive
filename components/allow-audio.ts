import { LitElement, html } from 'lit-element'
import * as Tone from 'tone'

export default class AllowAudio extends LitElement {
  static register() {
    customElements.define('intuitive-allow-audio', AllowAudio);
  }

  clickHandler() {
    Tone.start();
    this.remove();
  }
    
  render() {
    return html`
<button @click=${this.clickHandler}>Allow Sound</button>
`;
  }
}
