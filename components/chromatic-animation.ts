import { property, html, svg } from 'lit-element';
import  IntuitiveElement  from './intuitive-element'
import * as _  from 'lodash'
import * as Tone from 'tone'

// List of indices
const Octaves = 3;
const indices = _.range(12 * 3);
const ViewportWidth = 12 * 36;
const ViewportHeight = 120;
const SquareSize = 9;
const CircleRadius = (ViewportHeight / 2) - 2 * SquareSize;

function linearCoords(index: number): [number, number] {
    const horizontalStride = 12;
    const verticalStride = 3;
    return [horizontalStride * index, ViewportHeight  - SquareSize - (index * verticalStride)];
}

function circularCoords(index: number): [number, number] {
    const phase = ((index % 12) / 12) * 2 * Math.PI;
    // Assign the x coordinate to the sine rather than cosine, to make 0 be at the top of the circle.
    const cx = Math.sin(phase);
    const cy = -1 * Math.cos(phase);
    const x = CircleRadius * cx + (ViewportWidth / 2) - (SquareSize / 2);
    const y = CircleRadius * cy + (ViewportHeight / 2) - (SquareSize / 2);
    return [x, y];
}

function hue(index: number) {
    return (index % 12) * (360 / 12);
}

const synth = new Tone.Synth().toDestination();
let previousNote: number = 0;

function playIndex(index: number, circular: boolean) {
    if(circular) {
        const indexMod = index % 12;
        const previousMod = previousNote % 12;
        let newNote;
        if(previousMod < 6) {
            if(indexMod < 6) {
                newNote = Math.round(previousNote / 12) * 12 + indexMod;
            }
            else {
                newNote = Math.round(previousNote / 12) * 12 + indexMod;
            }
        }
        else {
            if(indexMod < 6) {
                newNote = Math.round(previousNote / 12) * 12 + indexMod;
            }
            else {
                newNote = Math.floor(previousNote / 12) * 12 + indexMod;
            }
        }

        synth.triggerAttackRelease(Tone.Frequency(48 + newNote, "midi").toFrequency(), "8n");
        previousNote = newNote;

    }
    else {
        synth.triggerAttackRelease(Tone.Frequency(48 + index, "midi").toFrequency(), "8n");
    }
}

function rect(index: number, circular: boolean) {
    const coords = circular ? circularCoords(index) : linearCoords(index);
    return svg`<rect 
        @click="${() => playIndex(index, circular)}"
        fill="hsl(${hue(index)}, 80%, 50%)" 
        x="${coords[0]}" 
        y="${coords[1]}" 
        width="${SquareSize}" 
        height="${SquareSize}"
        rx="1" } />`
}

// Map to rects
// x depends on this.circular

export class ChromaticAnimation extends IntuitiveElement {
    @property({type: Boolean})
    circular: boolean = false;

    static register() {
        customElements.define('intuitive-chromatic-animation', ChromaticAnimation);
    }

    render() {
        return html`
        <style>
            rect {
                transition: x 1s, y 1s;
                transition-timing-function: ease-out;
            }
            text {
                fill: grey;
                transition: opacity 1s;
            }
        </style>
        <svg viewBox="0 0 ${ViewportWidth} ${ViewportHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            ${indices.map(i => rect(i, this.circular))}

            <text x="50%" y="50%" style="opacity: ${this.circular ? 1 : 0};"  dominant-baseline="middle" text-anchor="middle">↻</text>
        </svg>`
    }


}