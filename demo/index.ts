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

Reveal.initialize({
	  width: "100%",
	  height: "100%",
	  margin: 0,
	  minScale: 1,
	  maxScale: 1
});

AllowAudio.register();
Aural.register();
ResponsiveFRA.register();
TunePlayer.register();
KeyboardGraphic.register();

// Slide 1
let startup: HTMLElement = document.getElementById("startup");
startup.onclick = () => {
  Tone.start();
  startup.remove();
}
