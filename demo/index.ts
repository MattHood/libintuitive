import Reveal from 'reveal.js'
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/white.css'
import "@webcomponents/webcomponentsjs/webcomponents-loader"
import "@webcomponents/custom-elements/src/native-shim"
import * as Tone from 'tone'

import ResponsiveFRA from '../components/frequency-resolution-applet'
import Aural from '../components/aural-object';
import TunePlayer from '../components/note-parser'
import AllowAudio from '../components/allow-audio'
import KeyboardGraphic from '../components/keyboard-graphic'
import BasicFretboardGraphic from '../components/fretboard-graphic'
import PlayPauseButton from '../components/play-pause-button'

import {AuralPlayback, AuralOptions, AuralPlaybackCallback} from '../utilities/aural-playback'

Reveal.initialize({
	  width: "100%",
	  height: "100%",
	  margin: 0,
	  minScale: 1,
	  maxScale: 1,
	  showNotes: true
});

AllowAudio.register();
Aural.register();
ResponsiveFRA.register();
TunePlayer.register();
KeyboardGraphic.register();
BasicFretboardGraphic.register();
PlayPauseButton.register();

let pb: HTMLElement = document.getElementById("pbtest");
let opts: AuralOptions = {root: "C5", transpose: "random", arpeggio: true, noteDuration: "auto", onFinish: () => { console.log("Done") }};
let player: AuralPlayback = new AuralPlayback("minor 3rd", opts);
pb.onclick = () => { 
	let p: AuralPlaybackCallback = player.play();
}
