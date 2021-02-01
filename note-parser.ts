import * as Tone from 'tone'
import "@webcomponents/webcomponentsjs/webcomponents-loader"
import "@webcomponents/custom-elements/src/native-shim"

interface Note {
  pitchClass: string;
  octave: string;
  duration: string;
}

interface ToneEvent {
  duration: Tone.TimeClass,
  note: Tone.FrequencyClass,
  time: number
}

type ToneNote = Pick<ToneEvent, "duration" | "note">

type Maybe<T> = T | null;
type Optional<T> = T | undefined;

function emptyStringIsUndefined(str: string): string | undefined {
  return str == "" ? undefined : str;
}

function resolveOptional<T>(input: Optional<T>, sub: T): T {
  return input === undefined ? sub : input as T;
}

function containsNull<T>(input: Maybe<T[]>): boolean {
  return input.some( (t) => { t === null });
}

function stringToDuration(token: string): Optional<string> {
  if(/,/.test(token)) {
    return token.split(",")[1];
  }
  else {
    return undefined;
  }
}

function stringToPitch(token: string): Maybe<{pitchClass: string, octave?: string}> {
  let pitch: string;
  let pitchClass: string;
  let octave: string;

  if(/,/.test(token)) {
    pitch = token.split(",")[0];
  }
  else {
    pitch = token;
  }

  let octaveSpec: RegExp = /([0-9\-+])/;
  let classSpec: RegExp = /([a-z])/i;
  if(classSpec.exec(pitch) == null) {
    return null;
  }
  else {
    let octaveTest = octaveSpec.exec(pitch);
    if(octaveTest) {
      pitchClass = pitch.substring(0, octaveTest.index);
      octave = pitch.substring(octaveTest.index, pitch.length);
    }
    else {
      pitchClass = pitch;
      octave = undefined;
    }
    return {pitchClass: pitchClass, octave: octave};
  }
}

interface PhraseState {
  previousOctave: string,
  previousDuration: string;
}

function tokenToNote(input: string, state: PhraseState): Maybe<Note> {
  let duration: Optional<string> = stringToDuration(input);
  let pitch:  Maybe<{pitchClass: string, octave?: string}> = stringToPitch(input);

  if(pitch == null) {
    return null;
  }
  else {
    return {pitchClass: pitch.pitchClass,
	    duration: resolveOptional(emptyStringIsUndefined(duration), state.previousDuration),
	    octave: resolveOptional(emptyStringIsUndefined(pitch.octave), state.previousOctave)
	   };
  }
}



function phraseToNotes(input: string): Maybe<Note[]> {
  let tokens: string[] = input.split(" ");
  let state: PhraseState = {previousOctave: "4", previousDuration: "4n"};
  let notes: Maybe<Note>[] = tokens.map((token) => {
    let out: Maybe<Note> = tokenToNote(token, state);
    if(out !== null) {
      state.previousDuration = out.duration;
      state.previousOctave = out.octave;
    }
    return out;
  });

  if(containsNull(notes)) {
    return null;
  }
  else {
    return notes;
  }
}

function notesToToneNotes(notes: Note[]): Maybe<ToneNote[]> {
  function castToTone(n: Note): Maybe<ToneNote> {
    let pitch: string = n.pitchClass + n.octave;
    if(pitch in Tone.FrequencyClass && n.duration in Tone.TimeClass) {
      return {note: Tone.Frequency(pitch), duration: Tone.Time(n.duration)};
    }
    else {
      return null;
    }
  };

  let toneNotes: Maybe<ToneNote>[] = notes.map(castToTone);
  if(containsNull(toneNotes)) {
    return null;
  }
  else {
    return toneNotes;
  }
}

export type Music = { time: number; note: string; duration: string; }[];
    

function accumulateTimecodes(notes: Note[]): Music {
  let lastTime = 0;
  let events: Music = [];

  notes.forEach((n) => {
    events.push({note: n.pitchClass + n.octave, duration: n.duration, time: lastTime});
    lastTime += Tone.Time(n.duration).toSeconds();
  });
  return events;		 
}
  

export function shorthandPart(note_string: string): Music {
  let phrase: Maybe<Note[]> = phraseToNotes(note_string);
  if(phrase === null) {
    throw new SyntaxError("Token was not recognised as a valid note");
  }

  //let toneNotes: Maybe<ToneNote[]> = notesToToneNotes(phrase);
  //if(phrase === null) {
 //   throw new TypeError("Note is not representable by Tone.js");
  //}

  return accumulateTimecodes(phrase);

}

export function playMusic(music: Music, synth: Tone.PolySynth) {
  music.forEach( (n) => {
    synth.triggerAttackRelease(n.note, n.duration, n.time + Tone.now());
  });
}

// WebComponent for this thing
export class TunePlayer extends HTMLElement {
  music: Music;
  synth: Tone.PolySynth;
  constructor() {
    super();

    let shadow: ShadowRoot = this.attachShadow({mode: 'open'});
    let button: HTMLButtonElement = document.createElement("button");
    this.synth = new Tone.PolySynth().toDestination();
    this.music = shorthandPart(this.innerHTML); // TODO, use inner text?
    this.innerHTML = "";

    button.innerHTML = this.getAttribute("title");
    //button.style.width = "300px";
    //button.style.height = "100px";
    button.onclick = () => { playMusic(this.music, this.synth) };
    shadow.appendChild(button);
  }
}

// Check below if error, button
//customElements.define('intuitive-tune-player', TunePlayer);
