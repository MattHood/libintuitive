import * as Tone from 'tone'
import * as _ from'lodash'
import "@webcomponents/webcomponentsjs/webcomponents-loader"
import "@webcomponents/custom-elements/src/native-shim"
import { customElement, html, LitElement, property } from 'lit-element';

type Maybe<T> = T | null;
type Optional<T> = T | undefined;
type ArrayOf<T> = T[];
type Warning<T> = { data: T; warning: Optional<string> };

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

export function resolveWarning<T>(w: Warning<T>, header?: string): T {
  if(w.warning) {
    let msg: string = header ? header + ": " + w.warning : w.warning;
    console.warn(msg)
  }

  return w.data;
}

function tokenize(input: string): string[] {
  let clean: string = input.trim();
  clean = clean.replace(/[^a-gA-G0-9+\-\#bx\.mnt, ]/gm, ""); // Replace illegal characters with empty string
  let tokens: string[] = clean.split(" ");
  tokens = tokens.filter( t => t.trim() != "" );
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
  
  

function shorthandPart(note_string: string): Warning<Music> {
  let tokens: string[] = tokenize(note_string);
  let parsed: Maybe<RawNote>[] = tokens.map(regexParse);

  let failed: string[] =
    _.zip(tokens, parsed)
      .filter(([ , parse]): boolean => _.isNull(parse))
      .map( ([token, ]): string => token.trim())
      .filter(_.negate(_.isEmpty));
  let warning: string | undefined = _.isEmpty(failed) ? undefined : failed.join(", ");
 
  let succeeded: RawNote[] = parsed.filter(_.negate(_.isNull));
  let filler: (incomplete: RawNote) => Note = missingFiller();
  let complete: Note[] = succeeded.map(filler);
  let withTime: Music = accumulateTimecodes(complete);

  return {data: withTime, warning: warning};
}

export function playMusic(music: Music, synth: Tone.PolySynth, tempo: number = 120) {
  let transformed: Music = music.map( (mu) => {
    mu.time *= 120 / tempo;
    return mu; } );

  transformed.forEach( (n) => {
    synth.triggerAttackRelease(n.note, n.duration, n.time + Tone.now());
  });
}

export function stringToMusic(input: string): Music {
  return resolveWarning(shorthandPart(input),
			"Failed to parse the tokens"); // TODO, use inner text?
}

// WebComponent for this thing
export default class TunePlayer extends LitElement {
  music: Music;
  synth: Tone.PolySynth;

  @property({type: String})
  title: string;

  static register() {
    customElements.define('intuitive-tune-player', TunePlayer);
  }
  
  constructor() {
    super();

    this.synth = new Tone.PolySynth().toDestination();
    console.log(this.innerHTML);
    this.music = stringToMusic(this.innerHTML);
  }

  clickHandler() {
    playMusic(this.music, this.synth)
  }

  render() {
    return html`
<button @click=${this.clickHandler}>${this.title}</button>
`
  }
}
