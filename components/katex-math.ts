import katex from "katex"

// Doesn't work very well, at least not with hats. Spacing is a bit off.

export default class KatexMath extends HTMLElement {
    static register() {
        customElements.define('katex-math', KatexMath);
    }
    constructor() {
        super();
        this.attachShadow({mode: 'open'});

        (this.shadowRoot as any).adoptedStyleSheets = [(window as any).KatexStyle];

        const link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", "https://cdn.jsdelivr.net/npm/katex@0.13.13/dist/katex.min.css")
        const div = document.createElement("div");
        const math: unknown = katex.render(this.textContent, div, { throwOnError: false } );
        this.shadowRoot.appendChild(link);
        this.shadowRoot.appendChild(div);

    }
}