import { html, internalProperty, property, TemplateResult } from 'lit-element'
import IntuitiveElement from './intuitive-element'
import * as AuOb from './aural-object'
import * as _ from 'lodash'
import * as Tone from 'tone'

type Unit = "S" | "T"

abstract class Consecutive {
    components: Unit[] = [];
    abstract MAX_COMPONENTS: number;
    synth: Tone.PolySynth;

    constructor() {
        //super();
        let verb = new Tone.Reverb().toDestination();
        verb.wet.value = 0.4;
        this.synth = new Tone.PolySynth().connect(verb);
    }

    addComponent(u: Unit): () => void {
        
        return () => {
            if (this.components.length < this.MAX_COMPONENTS) {
                this.components.push(u);
            }
        }
    }
    clearComponents() {
        this.components = [];
    }

    canPlay(): boolean {
        return this.components.length == this.MAX_COMPONENTS;
    }

    canClear(): boolean {
        return this.components.length > 0;
    }

    isFull(): boolean {
        return this.components.length == this.MAX_COMPONENTS;
    }

    makeTag(u: string | number): TemplateResult {
        const colour = u == "S" ? "is-primary" : u == "T" ? "is-info" : "";
        return html`<span class="tag is-rounded is-large ${colour}">${u}</span>`;
    }

    smallTag(u: string | number): TemplateResult {
        const colour = u == "S" ? "is-primary" : u == "T" ? "is-info" : "";
        return html`<span class="tag is-rounded ${colour}">${u}</span>`;
    }

    abstract render(): TemplateResult;
    abstract play(): void;
}

class Scale extends Consecutive {
    MAX_COMPONENTS = 7;

    constructor() {
        super();
    }

    render() {
        const explanation = 
            html`<div class="content box is-medium"><ul style="display: inline-block; text-align: left; margin: 0;">
                    <li>A sequence of notes, often numbering seven.</li>
                    <li>Many songs contain notes from just one scale</li>
                    <li>Given a starting note, 
                        build a scale by adding semitones/tones,<br/> 
                        collecting each new note along the way.</li>
                    <li> Try a <b>major scale</b>: 
                        <div class="tags">${["T", "T", "S", "T", "T", "T","S"].map(this.smallTag)}
                        </div></li>
                        </ul></div>`
        let display: (Unit | number)[] = _.range(7)
            .map(n => n < this.components.length ? this.components[n] : n + 1);
        const footer = html`${explanation}<br /><div class="tags is-centered">${display.map(this.makeTag)}</div>`

        return footer;
    }

    play() {
        const stepMapper = (u: Unit) => u == "S" ? 1 : 2;
        let steps = this.components
            .map(stepMapper)
            .map((val, ind, arr) => arr.slice(0, ind).reduce(_.add, 0));
        if(steps[steps.length - 1] < 12) {
            steps = [...steps, 12];
        }
        AuOb.play(AuOb.ao(steps), 0.8,this.synth);
    }
}

type ChordSteps = "Root" | "3rd" | "5th"
class Chord extends Consecutive {
    MAX_COMPONENTS = 4;

    constructor() {
        super();
    }

    render() {
        const explanation = 
            html`<div class="content box is-medium"><ul style="display: inline-block; text-align: left;margin: 0;">
                    <li>Three or more notes, often played at the same time</li>
                    <li>May be built out of notes from a scale</li>
                    <li>Combine two semitones/tones to achieve bigger gaps</li>
                    <li> Try a <b>major chord</b>: 
                        <div class="tags">
                            ${["T", "T"].map(this.smallTag)} + &nbsp; ${["T", "S"].map(this.smallTag)}
                        </div></li>
                    </ul></div>`

        const C = (n: number) => n < this.components.length ? this.components[n] : "_";
        const list: (Unit | ChordSteps | "_")[] = ["Root", C(0), C(1), "3rd", C(2), C(3), "5th"];
        return html`${explanation}<br/><div class="tags is-centered">${list.map(this.makeTag)}</div>`
    }

    play() {
        console.assert(this.components.length == 4);
        const steps: number[] = this.components.map( u => u == "S" ? 1 : 2);
        const third: number = steps[0] + steps[1];
        const fifth: number = third + steps[2] + steps[3];
        const chord: number[] = [0, third, fifth];
        AuOb.play(AuOb.ao(chord), 0.5,this.synth);
    }
}

class Interval extends Consecutive {
    MAX_COMPONENTS = 12;
    components: Unit[] = [];


    constructor() {
        super();
    }

    canPlay(): boolean {
        return this.components.length > 0;
    }

    render(): TemplateResult {
        const explanation = 
            html`<div class="content box is-medium"><ul style="display: inline-block; text-align: left; margin: 0;">
                    <li>A bigger measure of musical distance</li>
                    <li>Can be used to make melodies more interesting</li>
                    <li>Combine an arbitrary number of semitones/tones</li>
                    <li> Try a <b>perfect 5th</b>: <br/>
                        <div class="tags">${["T", "T", "T", "S"].map(this.smallTag)}
                        </div></li>
                </ul></div>`

        let steps: TemplateResult[] = this.components.map(this.makeTag);
        return html`
            ${explanation}<br />
            <div class="tags is-centered">
                <span class="tag is-large">Bottom</span>
                ${steps.length == 0 ? this.makeTag("..") : steps}
                <span class="tag is-large">Top</span>
            </div>`
    }

    play() {
        const steps = this.components.map(u => u == "S" ? 1 : 2);
        AuOb.play(AuOb.ao([0, _.sum(steps)]), 0.5, this.synth);
    }
}

export default class ConsecutiveIntervals extends IntuitiveElement {
    scale: Scale;
    chord: Chord;
    interval: Interval;
    @internalProperty()
    modeClass: Consecutive;

    static register() {
        //customElements.define('intuitive-consecutive-intervals-scale', Scale);
        customElements.define('intuitive-consecutive-intervals', ConsecutiveIntervals);
    }

    constructor() {
        super();
        this.scale = new Scale();
        this.chord = new Chord();
        this.interval = new Interval();
        this.modeClass = this.scale;
    }

    updated(changedProperties) {
        super.updated(changedProperties);
    }

    withUpdate(func) {
        return () => {
            func();
            this.requestUpdate();
        }
    }
    // A bit of carnage here
    renderControls() {
        const mc = this.modeClass;
        const playButton = html`<button class="button" 
                                        ?disabled="${!mc.canPlay()}"
                                        @click=${mc.play.bind(mc)}>
                                    Play
                                </button>`;
        const clearButton = html`<button class="button"
                                         ?disabled="${!mc.canClear()}"
                                         @click=${this.withUpdate(mc.clearComponents.bind(mc))}>
                                    Clear
                                </button>`;
        const semitoneButton = html`<button class="button is-primary"
                                            ?disabled="${mc.isFull()}"
                                            @click=${this.withUpdate(mc.addComponent("S").bind(mc))}>
                                        + Semitone
                                    </button>`;
        const toneButton = html`<button class="button is-info"
                                        ?disabled="${mc.isFull()}"
                                        @click=${this.withUpdate(mc.addComponent("T").bind(mc))}>
                                    + Tone
                                </button>`;

        const controls = html`<div>${semitoneButton} ${toneButton} ${playButton} ${clearButton}</div>`;
        return controls;
    }

    modeChanger(cons: Consecutive): () => void {
        return (function() {
            this.modeClass = cons;
        }).bind(this);
    }

    render() {
        const isActive = (cons: Consecutive) => cons == this.modeClass ? "is-active" : "";
        
        const tabs = 
            html`<div class="tabs is-centered is-large" style="margin: 0;">
                    <ul>
                        <li class="${isActive(this.scale)}"><a @click=${this.modeChanger(this.scale)}>Scales</a></li>
                        <li class="${isActive(this.chord)}"><a @click=${this.modeChanger(this.chord)}>Chords</a></li>
                        <li class="${isActive(this.interval)}"><a @click=${this.modeChanger(this.interval)}>Intervals</a></li>
                    </ul> 
                </div><br />
                ${this.modeClass.render.bind(this.modeClass)()}`;
        
                const controls = this.renderControls();
        return html`${tabs} <br /> ${controls}`;
    }
}