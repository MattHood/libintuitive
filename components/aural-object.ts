import * as Tone from 'tone'

interface AuralObject {
 /**
  * Describes an "aural object" (e.g. major triad, interval, scale) specified with relative pitch.
  * @remarks
  * - '0' represents the root note
  * - Positive 'n' represents semitones above the root note
  * - Negative 'n' represents semitones below the root note
  *
  * @example Major triad in first inversion
  * '''ts
  * let majorTriadFirstInversion: AuralObject = {degrees: [-8, -5, 0]};
  * '''
  */
  degrees: number[];
  description?: string;
}

const majorTriad: AuralObject = {degrees: [0, 4, 7]};
const minorTriad: AuralObject = {degrees: [0, 3, 7]};
const major3rd: AuralObject = {degrees: [0, 4]};


const NOTE_RANGE: [number, number] = [60, 80];

function randomRoot(): number {
  let min = NOTE_RANGE[0];
  let max = NOTE_RANGE[1];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function range(start:number , end: number): number[] {
  let arr: number[] = new Array();
  for(let i = start; i < end; i++) {
    arr.push(i);
  }
  return arr;
}

function play(object: AuralObject, synth: Tone.PolySynth): void {

  let unit = Tone.Time("8n").toSeconds();
  let root = randomRoot();
  let notes = object.degrees.map( (x) =>  Tone.mtof((x + root) as Tone.Unit.MidiNote));
  let indices: number[] = range(0, notes.length);
  let now = Tone.now();
  let arpeggio_times = indices.map( (i) => (i * unit + now));
  let chord_time: number = notes.length * unit + now;

  arpeggio_times.forEach((time, index) => {
    synth.triggerAttackRelease(notes[index], "8n", time);
  });

  let velocity: number = 1 / Math.sqrt(notes.length);
  synth.triggerAttackRelease(notes, "4n", chord_time, velocity);
  
}

function ao(_degrees: number[]): AuralObject {
  return {degrees: _degrees};
}

type AuralName = "Triad.Major" |
  "Triad.Minor" |
  "Interval.Unison" |
  "Interval.Minor2nd" |
  "Interval.Major2nd" |
  "Interval.Minor3rd" |
  "Interval.Major3rd" |
  "Interval.Perfect4th" |
  "Interval.Diminished5th" |
  "Interval.Perfect5th" | 
  "Interval.Minor6th" | 
  "Interval.Major6th" | 
  "Interval.Minor7th" | 
  "Interval.Major7th" | 
  "Interval.Octave";

let ao_map: Record<string, AuralObject> = {
  "Triad.Major": ao([0, 4, 7]),
  "Triad.Minor": ao([0, 3, 7]),
  "Interval.Unison": ao([0, 0]),
  "Interval.Minor2nd": ao([0, 1]),
  "Interval.Major2nd": ao([0, 2]),
  "Interval.Minor3rd": ao([0, 3]),
  "Interval.Major3rd": ao([0, 4]),
  "Interval.Perfect4th": ao([0, 5]),
  "Interval.Diminished5th": ao([0, 6]),
  "Interval.Perfect5th": ao([0, 7]),
  "Interval.Minor6th": ao([0, 8]),
  "Interval.Major6th": ao([0, 9]),
  "Interval.Minor7th": ao([0, 10]),
  "Interval.Major7th": ao([0, 11]),
  "Interval.Octave": ao([0, 12])
}

let word_map: Record<string, AuralName> = {
  "major triad": "Triad.Major",
  "major chord": "Triad.Major",
  "minor triad": "Triad.Minor",
  "minor chord": "Triad.Minor",
  "unison": "Interval.Unison",
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
  "octave": "Interval.Octave"
};



function toAuralObject(key: string): AuralObject {
  // TODO undefined interval check. Whip out a Maybe?
  return ao_map[word_map[key]];
}

// Front
let verb = new Tone.Reverb({wet: 0.6}).toDestination();
let synth = new Tone.PolySynth().connect(verb);

function populateSpan(el): void {
  let a: HTMLAnchorElement = document.createElement("a");
  a.href = "javascript:void(0)";
  let text = el.innerHTML;
  a.innerHTML = text;
  let AO = toAuralObject(text);
  
  a.onclick = (event) => {
    play(AO, synth);
  };

  el.innerHTML = "";
  el.appendChild(a);
}

function fillSpans(): void {
  let spans: NodeListOf<HTMLSpanElement> = document.querySelectorAll("span.aural-object");
  spans.forEach(populateSpan);
  
}


export {AuralObject, majorTriad, minorTriad, major3rd, play, toAuralObject, fillSpans};
