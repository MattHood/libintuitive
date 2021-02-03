import * as Tone from 'tone'
import _ from 'lodash'
import "@webcomponents/webcomponentsjs/webcomponents-loader"
import "@webcomponents/custom-elements/src/native-shim"

type Maybe<T> = T | null;
type Optional<T> = T | undefined;
type ArrayOf<T> = T[];

interface RawNote {
  pitchClass: string,
  octave: Optional<string>,
  duration: Optional<string>
}

interface Note {
  pitchClass: string;
  octave: string;
  duration: string;
}

export interface MusicEvent {
  time: number,
  note: string,
  duration: string
}

export type Music = ArrayOf<MusicEvent>;


function resolveOptional<T>(input: Optional<T>, sub: T): T {
  return input === undefined ? sub : input as T;
}

function tokenize(input: string): string[] {
  let clean: string = input.trim();
  clean = clean.replace(/[^a-gA-G0-9+\-\.mnt]/gm, ""); // Replace illegal characters with empty string
  let tokens: string[] = clean.split(" ");
  tokens = tokens.filter( t => t == " " || t == "" );
  return tokens;
}

function regexParse(token: string): Maybe<RawNote> {
  // Regex decomposed:
  //
  //  /^    Start of token
  //  (.    First capture group, for pitch class
  //    [a-gA-G]     Mandatory prefix, musical alphabet
  //    (?:bb|b|#|x)? Optional accidental
  //  )    
  //  (     Second capture group, for octave. Range from -4 to 11
  //    -[1-4]
  //    |[0-9]
  //    |10|11
  //  )?   Octave is optional
  //  ,?   Optional comma, to separate pitch and duration. TODO: Make it so that the comma is mandatory if the duration is present?
  //  (    Third capture group, for duration
  //    0|1m|1n|1n\.    Special durations are handled manually. 0 is on its own, 1 has 'm' for measure and no triplet option
  //    |(?:2|4|8|16|32|64|128) Other regular subdivisions
  //     (?:n|n\.|t)  And the available suffixes
  //  )?   Duration is optional
  //  $    Token should end here
  // /gm   Multiple matches, multi-line? shouldn't be necessary
  //
  let reg: RegExp = /^([a-gA-G](?:bb|b|#|x)?)(-[1-4]|[0-9]|10|11)?,?(0|1m|1n|1n\.|(?:2|4|8|16|32|64|128)(?:n|n\.|t))?$/gm;
  let result = reg.exec(token);
  if(result)
    return {pitchClass: result[1],
	    octave: result[2],
	    duration: result[3]};
  else {
    return null;
  }
}

function missingFiller(): (incomplete: RawNote) => Note {
  let previousOctave: string = "3";
  let previousDuration: string = "4n";

  return (incomplete: RawNote): Note => {
    let full: Note = { pitchClass: incomplete.pitchClass,
		       octave: resolveOptional(incomplete.octave, previousOctave),
		       duration: resolveOptional(incomplete.duration, previousDuration) };
    previousOctave = full.octave;
    previousDuration = full.duration;
    return full;
  }
}

function noteToMusicEvent(n: Note, t: number): MusicEvent {
  return {note: n.pitchClass + n.octave, duration: n.duration, time: t};
}

function accumulateTimecodes(notes: Note[]): Music {
  let lastTime = 0;
  let events: Music = [];

  notes.forEach((n) => {
    events.push(noteToMusicEvent(n, lastTime));
    lastTime += Tone.Time(n.duration).toSeconds();
  });
  return events;		 
}
  
  

export function shorthandPart(note_string: string): Music {
  let tokens: string[] = tokenize(note_string);
  let parsed: Maybe<RawNote[]> = tokens.map(regexParse);
  
  let failed: string[] = _.zip(tokens, parsed).map( (t): string | null => {
    return t[1] == null ? t[0] : null;
  }).filter(_.isNull);
  if(!_.isEmpty(failed)) {
    console.warn("Shorthand Note Parser || The following tokens were rejected: ");
    failed.forEach( (f) => { console.warn(f + ", ") } );
  }

  let succeeded: RawNote[] = parsed.filter(_.isNull);
  let filler: (incomplete: RawNote) => Note = missingFiller();
  let complete: Note[] = succeeded.map(filler);
  let withTime: Music = accumulateTimecodes(complete);
  return withTime;
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

  static register(): void {
    window.customElements.define('intuitive-tune-player', TunePlayer);
  }
  
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

//customElements.define('intuitive-tune-player', TunePlayer);
