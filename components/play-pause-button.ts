import "@webcomponents/webcomponentsjs/webcomponents-loader"
import "@webcomponents/custom-elements/src/native-shim"
import { LitElement, html, customElement, property, svg, SVGTemplateResult, internalProperty } from 'lit-element'
import * as _ from 'lodash'

export default class PlayPauseButton extends LitElement {
    @property()
    playing: boolean = false;

    @property()
    title: string;

    static register() {
        customElements.define('intuitive-play-pause-button', PlayPauseButton);
    }

    constructor() {
        super();
    }

    play(e) {
        this.playing = true;
        this.onplay(e);
    }

    pause(e) {
        this.playing = false;
        this.onpause(e);
    }

    render() {
        const state = this.playing ? '\u23F9' : '\u25B6\uFE0F';
        const text = this.title ? this.title + " - " + state : state;
        return html`
            <button @click=${this.playing ? this.pause : this.play}>${text}</button>
        `
    }
}