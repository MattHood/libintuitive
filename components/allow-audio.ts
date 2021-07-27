import { html, css, internalProperty } from 'lit-element'
import IntuitiveElement from './intuitive-element'
import * as Tone from 'tone'

export default class AllowAudio extends IntuitiveElement {
  @internalProperty()
  audioAllowed: boolean = false;
  
  static register() {
    customElements.define('intuitive-allow-audio', AllowAudio);
  }

  clickHandler() {
    Tone.start();
    this.audioAllowed = true;
  }
    
  render() {
    const style = this.audioAllowed ? "button is-success" : "button is-warning";
    const text = this.audioAllowed ? '\u2713' : "Allow Sound";
    return html`
<button class="button ${style}" @click=${this.clickHandler}>${text}</button>
`;
  }
}
