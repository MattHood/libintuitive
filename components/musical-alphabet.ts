import { LitElement, html, svg, css, customElement, unsafeCSS, internalProperty, property } from 'lit-element'
import * as Tone from 'tone'
import IntuitiveElement from './intuitive-element'

////////
// Types
////////
interface Enharmonic { revealed: boolean, readonly name: string }
interface Column {
    readonly colour: Colour,
    readonly enharmonics: Enharmonic[],
    readonly midiNote: number,
    centreEnharmonic: number,
    active: boolean
}
interface Row { coloumns: Column[] }
interface Colour { h: number, s: number, l: number }
type Product = <T>(arrA: T[], arrB: T[], f: (a: T, b: T) => T) => T[][];



///////////////////////////
// Initialisers & Utilities
///////////////////////////
const Enharmonic = (name: string): Enharmonic => ({ revealed: false, name: name });
const Column = (colour: Colour, enharmonics: Enharmonic[], midiNote: number): Column => 
    ({colour: colour, enharmonics: enharmonics, midiNote: midiNote, centreEnharmonic: 1, active: false});
const Row = (coloumns: Column[]): Row => ({coloumns: coloumns});
const Colour = (h: number, s: number, l: number): Colour => ({h: h, s: s, l: l});
const colourToCss = (c: Colour) => unsafeCSS(`hsl(${c.h}, ${c.s}%, ${c.l}%)`);
const product: Product = (arrA, arrB, f) => arrA.map(a => arrB.map(b => f(a, b)));
const mod = (i, n) => ((i % n) + n) % n;


///////////////////////
// Data for Enharmonics
///////////////////////
const naturals = ["F", "C", "G", "D", "A", "E", "B"];
const accidentals = ["bb", "b", "", "#", "x"];
const archOfFifths = product(naturals, accidentals, (a, b) => a + b).flat();
const cOffset = archOfFifths.findIndex(el => el == "C" + accidentals[2]);
const arch = (index) => archOfFifths[cOffset + index];
const chromaticScaleOffsets = [0, -5, 2, -3, 4, -1, -6, 1, -4, 3, -2, 5]; // C Db D Eb E F Gb G Ab A Bb B
const enharmonicOffsets = [-12, 0, 12];
const isInArch = (index: number) => 0 <= index && index < archOfFifths.length;
const enharmonicNames = product(chromaticScaleOffsets, enharmonicOffsets, (c, e) => c * e)
    .map(column => column.filter(isInArch).map(arch));
const enharmonics = enharmonicNames.map(column => column.map(Enharmonic));

///////////////////
// Data for Columns
///////////////////
const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const hues = indices
    .map(index => index * (360 / 12));
const midiNotes = indices.map(i => i + 60);
const columns = indices.map(i => Column(Colour(hues[i], 80, 50), enharmonics[i], midiNotes[i]));

const MajorScale = [0, 2, 4, 5, 7, 9, 11];

//////
// Row
//////
const row = Row(columns);

////////
// Audio
////////
const synth = new Tone.Synth().toDestination();
const playMajorScale = (offset: number) => {
    const now = Tone.now();
    MajorScale.concat(12).forEach((n, i) => {
        synth.triggerAttackRelease(Tone.Frequency(48 + n + offset, "midi").toFrequency(), "8n", now + i * 0.2)
    })
}

/////////////
// Components
/////////////
@customElement('intuitive-musical-alphabet-note')
class MusicalAlphabetNote extends LitElement {
    @property({type: Number})
    trueIndex: number;

    @property({type: Boolean})
    selected: boolean;

    @property({type: String, reflect: true})
    text: string = '';

    @property({type: Number, reflect: true})
    hue: number;

    setText() {
            const input = this.shadowRoot.querySelector('input');
            if(input.value.length > 0) {
                const head = input.value[0];
                const tail = input.value.slice(1)
                    .replace('#', '♯')
                    .replace('x', '𝄪')
                    .replace('bb', '𝄫')
                    .replace('b', '♭');
                this.text = head + tail;
            }
            else {
                this.text = "";
            }
            input.value = this.text;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('keydown', (evt) => {
            evt.stopPropagation();
        });
    }

    render() {
        if(this.hue === null || this.hue === undefined) this.hue = hues[this.trueIndex];
        const background = Colour(this.hue, 80, this.selected ? 50 : 10);
        const border = Colour(this.hue, 80, this.selected ? 80 : 20);
        const outline = Colour(this.hue, 70, 50)
        const shadow = Colour(this.hue, 40, this.selected ? 70 : 30);
        const textShadow = (sz, col) => css`0 0 ${sz}px ${col}, 0 0 ${sz}px ${col}, 0 0 ${sz}px ${col}, 0 0 ${sz}px ${col};`
        const style = css`
            background-color: ${colourToCss(background)};
            border-color: ${colourToCss(border)};
            outline-color: ${colourToCss(shadow)};
            text-shadow: ${textShadow(3, colourToCss(shadow))};
        `
        return html`
        <style>
        .note {
            width: 3rem;
            height: 3rem;
            margin: 0.75rem;
            border-radius: 5px;
            text-align: center;
            font-size: 1.7rem;
            text-shadow: 0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white;
        }
        </style>
        <input class="note"
                        type="text"
                        @focusout=${this.setText.bind(this)}
                        style="${style}"
                        value=${this.text}>
                    </input>`
    }
}

export class MusicalAlphabet extends IntuitiveElement {
    @internalProperty()
    offset: number = 0;

    static register() {
        customElements.define('intuitive-musical-alphabet', MusicalAlphabet);
      }

    // constructor() {
    //     super();
    // }
    
    render() {
        console.log(MajorScale);
        
        const mapper = i => mod(i - this.offset, 12);
        return html`
        <style>
                div.container {
                    display: flex;
                    flex-direction: row;
                }
        </style>
        <div class="container">
            <br/>
            ${indices.map(i => html`<intuitive-musical-alphabet-note
                                        @dblclick=${() => this.offset = i}
                                        id="n${i}"
                                        trueIndex="${i}"
                                        ?selected="${MajorScale.includes(mapper(i))}"
                                        style="order: ${mapper(i)}">
                </intuitive-musical-alphabet-note>
            `)} 
            </div>
            <br/>
            <button class="button is-info" @click="${() => playMajorScale(this.offset)}">Play</button>
        `
    }
}