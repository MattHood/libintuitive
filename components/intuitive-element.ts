import { LitElement } from 'lit-element'

/*
* Wrapper over LitElement, that sets the stylesheet to the Bulma styles created in components.ts
*/
export default abstract class IntuitiveElement extends LitElement {
    constructor() {
        super();

        (this.shadowRoot as any).adoptedStyleSheets = [(window as any).BulmaStyle];

    }


}