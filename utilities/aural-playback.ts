import * as Tone from 'tone'
import * as _ from 'lodash'
import { fill } from 'lodash';
import { isArray } from 'tone';

const AUTO_NOTE_DURATION_TOTAL_SEC = 1;

// TODO Optional and non-optional version
export interface AuralPlaybackOptions {
    root: string,
    transpose: number | "random",
    arpeggio: boolean,
    chord: boolean,
    noteDuration: number | "auto",
    onFinish?: () => void
}

export type AuralOptions = Partial<AuralPlaybackOptions>;

const DefaultPlaybackOptions: AuralPlaybackOptions = {
    root: "F4",
    transpose: 0,
    arpeggio: true,
    chord: true,
    noteDuration: 0.6
}

function resolveUndefined<T>(thing: Partial<T> | undefined, replace: T): T {
    if(thing == undefined) {
        return replace;
    }
    else {
        return thing as T;
    }
}

function fillInPlaybackOptions(options: Partial<AuralPlaybackOptions> | undefined): AuralPlaybackOptions {
    let _options: AuralPlaybackOptions;
    if(options == undefined) {
        _options = resolveUndefined(options, DefaultPlaybackOptions);
    }
    else {
        _options = { root: resolveUndefined(options.root, DefaultPlaybackOptions.root),
            transpose:resolveUndefined(options.transpose, DefaultPlaybackOptions.transpose),
            arpeggio: resolveUndefined(options.arpeggio, DefaultPlaybackOptions.arpeggio),
            chord: resolveUndefined(options.chord, DefaultPlaybackOptions.chord),
            noteDuration: resolveUndefined(options.noteDuration, DefaultPlaybackOptions.noteDuration),
            onFinish: options.onFinish };
    }
    return _options;
}

function defaultSynth(): Tone.PolySynth {
    let rev = new Tone.Reverb();
    rev.wet.value = 0.4;
    return new Tone.PolySynth().connect(rev).toDestination();
}



export interface AuralPlaybackCallback {
    length: number,
    stopPlayback: () => void,
    hasFinished: () => boolean
}

type AuralObject = number[];


let ao_map = {
    "Silent": [],
    "Triad.Major": [0, 4, 7],
    "Triad.Minor": [0, 3, 7],
    "Triad.Diminished": [0, 3, 6],
    "Interval.Unison": [0, 0],
    "Interval.Minor2nd": [0, 1],
    "Interval.Major2nd": [0, 2],
    "Interval.Minor3rd": [0, 3],
    "Interval.Major3rd": [0, 4],
    "Interval.Perfect4th": [0, 5],
    "Interval.Diminished5th": [0, 6],
    "Interval.Perfect5th": [0, 7],
    "Interval.Minor6th": [0, 8],
    "Interval.Major6th": [0, 9],
    "Interval.Minor7th": [0, 10],
    "Interval.Major7th": [0, 11],
    "Interval.Octave": [0, 12],
    "Scale.Major": [0,2,4,5,7,9,11,12],
    "Scale.NaturalMinor": [0,2,3,5,7,8,10,12]
  }
  type AuralID = keyof typeof ao_map;

  
  let word_map: {[key: string]: AuralID} = {
    "silent": "Silent",
    "major triad": "Triad.Major",
    "major chord": "Triad.Major",
    "minor triad": "Triad.Minor",
    "minor chord": "Triad.Minor",
    "diminished triad": "Triad.Diminished",
    "diminshed chord": "Triad.Diminished",
    "unison": "Interval.Unison",
    "semitone": "Interval.Minor2nd",
    "tone": "Interval.Major2nd",
    "minor 2nd": "Interval.Minor2nd",
    "major 2nd": "Interval.Major2nd",
    "minor 3rd": "Interval.Minor3rd",
    "major 3rd": "Interval.Major3rd",
    "perfect 4th": "Interval.Perfect4th",
    "tritone": "Interval.Diminished5th",
    "perfect 5th": "Interval.Perfect5th",
    "minor 6th": "Interval.Minor6th",
    "major 6th": "Interval.Major6th",
    "minor 7th": "Interval.Minor7th",
    "major 7th": "Interval.Major7th",
    "octave": "Interval.Octave",
    "major scale": "Scale.Major",
    "minor scale": "Scale.NaturalMinor",
    "natural minor scale": "Scale.NaturalMinor"
  };

  
  export type Shorthand = string;

  export function isValidShorthand(input: string): boolean {
    return Object.keys(word_map).includes(input);
  }


  function inputToAuralObject(input: Shorthand | number[]): AuralObject {
    // 'string' inputs are interpreted as shorthand, 
    // 'number[]' is interpreted as (relative pitch) semitones away from root.
    if(typeof(input) == "string") {
        return ao_map[word_map[input]];
    }
    else {
        return input;
    }
}

  export interface MusicEvent {
    time: number,
    note: string | string[],
    duration: string | number
  }
  
  export type Music = MusicEvent[];

  export class AuralPlayback {
      options: AuralPlaybackOptions;
      input?: Shorthand | number[];
      synth: Tone.PolySynth;

      static Play(input: Shorthand | number[], synth?: Tone.PolySynth, _options?: Partial<AuralPlaybackOptions>): AuralPlaybackCallback {
        if(synth == undefined) {
            synth = defaultSynth();
        }
        

        // Takes any undefined options and sets them to defaults
        const options = fillInPlaybackOptions(_options);

        if(input == "silent") {
            return { length: 0, hasFinished: () => true, stopPlayback: options.onFinish };
        }

        let steps: AuralObject = inputToAuralObject(input);
        const noteDuration: number = options.noteDuration == "auto" ?
                                        AUTO_NOTE_DURATION_TOTAL_SEC / steps.length :
                                        options.noteDuration as number; 
        
        // Convert to a midi note, which is an integer, for easy transposing
        let startingNote = Tone.Frequency(options.root).toMidi();

        // Set transposition by random or fixed amount
        if(options.transpose == "random") {
            startingNote += _.random(-5, 6);
        }
        else {
            startingNote += options.transpose as number;
        }

        // Now transpose all notes, before converting back to string representation.
        let notes = steps.map(s => Tone.Frequency(startingNote + s, "midi").toNote() as string);
        let score: (string | string[])[] = []; // The sequence to actually be played back
        if(options.arpeggio) {
            score = _.cloneDeep(notes);
        }
        if(options.chord) {
            score.push(notes);
        }

        const times: number[] = _.range(score.length).map(n => n * noteDuration);

        const events: MusicEvent[] = _.zipWith(times, score, 
            (t, s) => { return {time: t, note: s, duration: noteDuration} });
 
        const player: (e: MusicEvent) => void = (e: MusicEvent) => {
            const velocity = isArray(e.note) ? 0.65 : 1; // Avoid clipping chords
            const timeOffset = isArray(e.note) ? Tone.Time(e.duration).toSeconds() / 2 : 0; // Delay chord onset
            synth.triggerAttackRelease(e.note, e.duration, Tone.now() + timeOffset, velocity);
        }

        let noteTimers: number[] = events.map( 
            (e: MusicEvent) =>  window.setTimeout(() => { player(e) }, e.time * 1000));
        
        let isPlaying = true;
        const onFinish: () => void = () => {
            isPlaying = false;
            if(options.onFinish != undefined) {
                options.onFinish();
            }
        };

        const length: number = score.length * noteDuration;
        let finalTimer = window.setTimeout(onFinish, length * 1000);
        
        const hasFinished = (): boolean => !isPlaying;
        const stopPlayback = () => {
            if(isPlaying) {
                noteTimers.forEach(clearTimeout);
                clearTimeout(finalTimer);
                isPlaying = false;
                if(options.onFinish != undefined) {
                    options.onFinish();
                }
            }
        };

        return {length: length, hasFinished: hasFinished, stopPlayback: stopPlayback};
      }

      play(): AuralPlaybackCallback | undefined {
          if(this.input != undefined) {
            return AuralPlayback.Play(this.input, this.synth, this.options);
          }
          else {
              return undefined;
          }
      }

      constructor(_input: string | number[], _options?: Partial<AuralPlaybackOptions>) {
        this.options = fillInPlaybackOptions(_options);
        
        if(typeof(_input) == 'string') {
            if(isValidShorthand(_input)) {
                this.input = _input as Shorthand;
            }
            else {
                console.error("AuralPlayback: Unrecognised aural shorthand");
            }
        }
        else {
            this.input = _input as number[];
        }

        const verb = new Tone.Reverb();
        verb.wet.value = 0.4;
        this.synth = new Tone.PolySynth().connect(verb).toDestination();
      }
  }