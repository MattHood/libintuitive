import { css, html, LitElement } from "lit-element";
import IntuitiveElement from "./intuitive-element";

export default class Encircle extends IntuitiveElement {
    tokens: string[];

    static register() {
        customElements.define('intuitive-encircle', Encircle);
    }

    constructor() {
        super();
        this.tokens = [""];
    }

    connectedCallback() {
        super.connectedCallback();
        this.tokens = this.textContent.split(" ").map(s => s.trim());
    }

    render() {
        const colour = (t: string) => t == "T" ? `is-info is-medium` : t == "S" ? `is-success is-medium` : `is-large`;
        const style = (t: string) => `tag is-rounded ${colour(t)}`
        const tag = (t: string) => html`<span class="${style(t)}">${t}</span>&nbsp;`
        const circles = this.tokens.map(tag);
        //const circles = tag("T");
        return html`${circles}`;
        //  return html`
        //     ${this.tokens.map( t => `
        //         <span class="tag 
        //                      is-rounded 
        //                      is-large
        //                      ${t == "T" ? `is-info` : 
        //                         t == "S" ? `is-success` : 
        //                             ``}
        //     `)}
        // `;
    }
}