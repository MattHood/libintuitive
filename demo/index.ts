import Reveal from 'reveal.js'
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/black.css'
import "@webcomponents/webcomponentsjs/webcomponents-loader"
import "@webcomponents/custom-elements/src/native-shim"
import * as Tone from 'tone'

import { FrequencyResolutionApplet } from '../components/frequency-resolution-applet'
import * as Aural from '../components/aural-object';
import * as NP from '../components/note-parser'

Reveal.initialize({
	  width: "100%",
	  height: "100%",
	  margin: 0,
	  minScale: 1,
	  maxScale: 1
});

// Slide 1
let startup: HTMLElement = document.getElementById("startup");
startup.onclick = () => {
  Tone.start();
  startup.remove();
}


// Slide 2
let parent = document.getElementById("applet");
let FRA = new FrequencyResolutionApplet(700, 500, "major scale");
parent.appendChild(FRA.getApplet());

// Slide 3
Aural.fillSpans();

// Slide 4
let play = document.getElementById("aha");
let synth = new Tone.PolySynth().toDestination();
let tune: NP.Music = NP.shorthandPart("e4,16n e c a3,8n a d4 d d,16n f# f# g a g g g d,8n c e4 e e,16n d d e d");

play.onclick = (e) => {
  NP.playMusic(tune, synth);
}

// Slide 5
customElements.define('intuitive-tune-player', NP.TunePlayer);

