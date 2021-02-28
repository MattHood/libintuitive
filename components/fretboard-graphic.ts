import "@webcomponents/webcomponentsjs/webcomponents-loader"
import "@webcomponents/custom-elements/src/native-shim"
import { LitElement, html, customElement, property, svg, SVGTemplateResult } from 'lit-element'
import * as _ from 'lodash'
import IntuitiveElement from './intuitive-element'

type SVG = SVGTemplateResult;
type FretSelect = [number, number];

export default class BasicFretboardGraphic extends IntuitiveElement {
    @property({type: Number})
    frets: number = 3;

    @property({type: Number})
    scale: number = 1;

    @property({type: Array})
    select: FretSelect[] = [];

    static register() {
        customElements.define("intuitive-basic-fretboard-graphic", BasicFretboardGraphic);
    }

    render() {
        const unitStringWidth = 2 * this.scale;
        const fretWidth = 60 * this.scale;
        const fretwireWidth = 5 * this.scale;
        const stringSpacing = 30 * this.scale;
        const topMargin = fretwireWidth;
        const dotRadius = fretWidth / 4;
        const dotColour = "royalBlue";
        const sideMargin = (dotRadius + fretwireWidth) * 2;

        const fretboardWidth = this.frets * fretWidth;
        const fretboardHeight = 6 * stringSpacing;
        const frameWidth = sideMargin * 2 + fretboardWidth;
        const frameHeight = topMargin * 2 + fretboardHeight
        const stringGuages = [0.010, 0.013, 0.017, 0.026, 0.030, 0.036];
        const stringWidths: number[] = 
            stringGuages
            .map( (g) => g * (unitStringWidth / 0.010) );

        const fretboard = svg`
        <rect x="${sideMargin}" y="${topMargin}" 
            rx="15" ry="5"
            width="${fretboardWidth}" height="${fretboardHeight}"
            stroke="SaddleBrown" stroke-width="${fretwireWidth}"
            fill="GoldenRod">
        `

        function fretwire(x: number) {
            return svg`
                <rect x="${x + sideMargin}" y="${topMargin}" width="${fretwireWidth}" height="${fretboardHeight}"
                    stroke="SaddleBrown" fill="SaddleBrown">
            `
        }

        const frets: SVG[] = 
            _.range(1, this.frets)
            .map( (f: number): number => f * fretWidth - fretwireWidth / 2 )
            .map( fretwire );


        type StringColour = "gold" | "silver";
        const colours: StringColour[] = ["silver", "silver", "silver", "gold", "gold", "gold"];

        function string(index: number, stringWidth: number, coating: StringColour): SVG {
            const y = (index * stringSpacing) + (stringSpacing / 2) - (stringWidth / 2);
            return svg`
                <rect x="0" y="${y + topMargin}" 
                    width="${frameWidth}" height="${stringWidth}"
                    stroke="${coating}" fill="${coating}">
            `
        }

        const strings: SVG[] = 
           _.zip(_.range(6), stringWidths, colours)
           .map(_.spread(string));

        function dot(stringIndex: number, fret: number) {
            const y = topMargin + ((stringIndex - 1) * stringSpacing) + (stringSpacing / 2);
            let x: number;
            if(fret == 0) {
                x = sideMargin - (dotRadius + fretwireWidth);
            }
            else {
                x = sideMargin + (fret * fretWidth) - (fretWidth / 2);
            }

            return svg`
                <circle cx=${x} cy="${y}" r="${dotRadius}"
                    stroke="grey" fill="${dotColour}" stroke-width="${fretwireWidth}"
                    opacity="0.7">
            `
        }

        const dots: SVG[] = this.select.map(_.spread(dot));

        return svg`
            <svg width="${frameWidth}" height="${frameHeight}">
                ${fretboard}
                ${frets}
                ${strings}
                ${dots}
            </svg>
        `
    }
}