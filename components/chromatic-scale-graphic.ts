import "@webcomponents/webcomponentsjs/webcomponents-loader"
import "@webcomponents/custom-elements/src/native-shim"
import { LitElement, html, customElement, property, svg, SVGTemplateResult } from 'lit-element'
import * as _ from 'lodash'

type SVG = SVGTemplateResult;

export default class ChromaticScaleGraphic extends LitElement {
    static register() {
        customElements.define('intuitive-chromatic-scale-graphic', ChromaticScaleGraphic);
    }
    @property({type: Number})
    scale: number = 1;

    @property({type: Number})
    steps: number = 12;

    @property({type: Number})
    horizontalOffset: number = 0;

    @property({type: Number})
    verticalOffset: number = 1.2;

    @property({type: Array})
    select: number[] = [];

    render() {
        const boxSize = 20 * this.scale;
        const frameWidth = boxSize + this.horizontalOffset * (this.steps - 1) * boxSize;
        const frameHeight = boxSize + this.verticalOffset * (this.steps - 1) * boxSize;
        const saturation = 80;
        const lightness = 50;
        const dotStrokeWidth = 4 * this.scale;
        const dotRadius = boxSize / 2 - dotStrokeWidth;

        const xValues = _.range(this.steps)
            .map( s => s * boxSize * this.horizontalOffset );

        const yValues = _.range(this.steps)
            .map( s => s * boxSize * this.verticalOffset )
            .map( y => frameHeight - y - boxSize ); // Ascend from bottom

        const colours: string[] = _.range(0, this.steps)
            .map( s => (s % 12) * (360 / 12) )
            .map( h => `hsl(${h}, ${saturation}%, ${lightness}%)`);

        function box(x: number, y: number, colour: string) {
            return svg`
                <rect x="${x}" y="${y}" 
                    width="${boxSize}" height="${boxSize}" 
                    rx="5" ry="5" 
                    stroke="${colour}" fill="${colour}">
            `
        }

        const boxes: SVG[] = _.zip(xValues, yValues, colours)
            .map(_.spread(box));

        function dot(step: number) {
            let x = xValues[step] + boxSize / 2;
            let y = yValues[step] + boxSize / 2;

            return svg`
            <circle cx="${x}" cy="${y}" r="${dotRadius}"
                stroke="black" fill-opacity="0" stroke-width="${dotStrokeWidth}">
            `
        }

        const dots: SVG[] = this.select.map(dot);

        return html`
        <svg width="${frameWidth}" height="${frameHeight}">
            ${boxes}
            ${dots}
        </svg>
        `

    }
}