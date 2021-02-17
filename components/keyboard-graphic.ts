import "@webcomponents/webcomponentsjs/webcomponents-loader"
import "@webcomponents/custom-elements/src/native-shim"
import { LitElement, html, customElement, property, svg, SVGTemplateResult } from 'lit-element'
import * as _ from 'lodash'



export default class KeyboardGraphic extends LitElement {
    
    @property({type: Number})
    octaves: number = 1;

    @property({type: Number})
    scale: number = 1;

    @property({type: Array})
    select: number[] = [];


    constructor() {
        super();
    }

    render() {
        type KeyColour = "black" | "white";
        type KeyProps = {x: number; y: number; selected: boolean, colour: KeyColour };

        const keyRadius = 30 * this.scale;
        const keyBorder = 5 * this.scale;
        const keyDiameter = 2 * (keyRadius + keyBorder);
        const keySpacing = 15 * this.scale;
        const octaveWidth = keyDiameter * 7 + keySpacing * 7;
        const frameWidth = 2 * keySpacing + octaveWidth * this.octaves;
        const frameHeight = keyDiameter * 2;
        const blackKeyY = keyDiameter / 2;
        const whiteKeyY = keyDiameter * 3 / 2;

        const keyType: KeyColour[] = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]
            .map( (k) => k == 1 ? "black" : "white");
        const spacingUnits = [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1];


        function blackKey(x: number, y: number, selected: boolean = false) {
            const colour = selected ? "royalBlue" : "black";
            return svg`
            <circle cx="${x}" cy="${y}" r="${keyRadius}" 
                stroke="grey" fill="${colour}" stroke-width="${keyBorder}" />
            `
        }

        function whiteKey(x: number, y: number, selected: boolean = false) {
            const colour = selected ? "cornflowerBlue" : "white"
            return svg`
            <circle cx="${x}" cy="${y}" r="${keyRadius}" 
                stroke="grey" fill="${colour}" stroke-width="${keyBorder}" />
            `
        }

        function keyIndexToProps(n: number): KeyProps {
            let colour = keyType[n % 12];
            let selected = this.select.includes(n + 1); // Attribute array is 1-based
            let y = colour == "black" ? blackKeyY : whiteKeyY;
            let x = _.chain(spacingUnits)
                .take((n % 12)+1)
                .sum()
                .add(Math.floor(n / 12) * _.sum(spacingUnits))
                .multiply((keyDiameter + keySpacing) / 2)
                .value();
            
            return {x: x, y: y, selected: selected, colour: colour};
        }

        function propsToTemplate(k: KeyProps): SVGTemplateResult {
            return k.colour == "black" ? 
                blackKey(k.x, k.y, k.selected) : 
                whiteKey(k.x, k.y, k.selected);
        }

        const keys: SVGTemplateResult[] = 
            _.range(12 * this.octaves)
            .map(keyIndexToProps.bind(this))
            .map(propsToTemplate);

        return html`
        <svg width="${frameWidth}" height="${frameHeight}" 
            version="1.1" xmlns="http://www.w3.org/2000/svg" 
            xmlns:xlink="http://www.w3.org/1999/xlink">
            ${keys}
        </svg>
        `
    }

    static register(): void {
        customElements.define('intuitive-keyboard-graphic', KeyboardGraphic);
    }

}