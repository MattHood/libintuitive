import * as Tone from 'tone'

function equalTemperament(base, steps) {
    return base * Math.pow(2, steps / 12);
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

abstract class  MapperImp {
  lowFreq: number;
  highFreq: number;
  stops: number;
  
  constructor(lowFreq, highFreq, stops) {
    this.lowFreq = lowFreq;
    this.highFreq = highFreq;
    this.stops = stops;
  }
  
  abstract stopToFrequency(stop: number): number;
  abstract stopToHSL(stop: number): HSL;
}

class ContinuousMapper extends MapperImp {
  constructor(lowFreq: number, highFreq: number) {
      super(lowFreq, highFreq, 480);
    }

  stopToHSL(stop: number): HSL {
	let frac = stop / this.stops;
	let hue = 2 * frac * 360;
	let lightness = stop < this.stops / 2 ? 45 : 60;
	return {h: hue, s: 80, l: lightness};
    }

  stopToFrequency(stop: number): number {
	let frac = stop / this.stops;
	let range = this.highFreq - this.lowFreq;
	return (frac * range) + this.lowFreq;
    }
}

class ChromaticMapper extends MapperImp {
    constructor(lowFreq, highFreq) {
      super(lowFreq, highFreq, 24);
    }

  stopToHSL(stop: number): HSL {
	let frac = stop / this.stops;
	let hue = 2 * frac * 360;
	let lightness = stop < this.stops / 2 ? 45 : 60;
	return {h: hue, s: 80, l: lightness};
    }

  stopToFrequency(stop: number): number {
	return equalTemperament(this.lowFreq, stop);
    }
}

class ScaleMapper extends MapperImp {
    constructor(lowFreq, highFreq) {
      super(lowFreq, highFreq, 14);
    }

  stopToHSL(stop: number): HSL {
	let frac = stop / this.stops;
	let hue = 2 * frac * 360;
	let lightness = stop < this.stops / 2 ? 45 : 60;
	return {h: hue, s: 80, l: lightness};
    }

  stopToFrequency(stop: number): number {
	let degrees = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23];
	return equalTemperament(this.lowFreq, degrees[stop]);
    }
}

class ChordMapper extends MapperImp {
    constructor(lowFreq, highFreq) {
      super(lowFreq, highFreq, 6);
    }

    stopToHSL(stop) {
	let frac = (stop + 0.3) / this.stops;
	let hue = 2 * frac * 360;
	let lightness = stop < this.stops / 2 ? 45 : 60;
	return {h: hue, s: 80, l: lightness};
    }

    stopToFrequency(stop) {
	let degrees = [0, 4, 7, 12, 16, 19];
	return equalTemperament(this.lowFreq, degrees[stop]);
    }
}

class Mapper {
  height: number;
  mapper: MapperImp;
    constructor(height, tuning) {
	this.height = height;

	let lowFreq = 400;
	let highFreq = lowFreq * 4;

	if(tuning == "continuous") {
	    this.mapper = new ContinuousMapper(lowFreq, highFreq);
	} else if (tuning == "chromatic") {
	    this.mapper = new ChromaticMapper(lowFreq, highFreq);
	} else if (tuning == "major scale") {
	    this.mapper = new ScaleMapper(lowFreq, highFreq);
	} else if (tuning == "major chord") {
	    this.mapper = new ChordMapper(lowFreq, highFreq);
	} else {
	    throw new TypeError("Undefined Tuning: '" + tuning + "'");
	}
    }

    pixelToStop(pixel) {
        // Ascend from the bottom
        let level = this.height - pixel;
        let stopWidth = this.height / this.mapper.stops;
        let stop = Math.floor(level / stopWidth);
        return stop;
    }

    pixelToHSL(pixel) {
        return this.mapper.stopToHSL(this.pixelToStop(pixel));
    }

    pixelToFrequency(pixel) {
        return this.mapper.stopToFrequency(this.pixelToStop(pixel));
    }

    snapPixelHeight(pixel) {
        let stops = this.mapper.stops;
        let halfHeight = this.height / stops / 2;
        let lowerHeight = Math.floor(pixel * (stops / this.height)) * (this.height / stops);
        let snapped = lowerHeight + halfHeight;
        return snapped;
    }	
}

interface Note {
  freq: number;
  time: number;
}

class Sound {
  noteSequence: Note[];
  synth: any;
  width: number;
  
    constructor(width) {
	this.noteSequence = [];
	this.synth = new Tone.PolySynth().toDestination();
	this.width = width;
    }

    quantizeTime(unquantized) {
	let pixelRate = 100;
	let subdivision = 4;
	let unit = pixelRate / subdivision;

	return Math.round(unquantized / unit) * unit;
    }
    
    addNote(f, t) {
	let quantized = this.quantizeTime(t);
        this.noteSequence.push({freq: f, time: quantized});
	this.noteSequence.sort(function(a, b) {
	    return a.time - b.time;
	});
	this.synth.triggerAttackRelease(f, 0.1);
    }

    clearNotes() {
        this.noteSequence = [];
    }

    

    play() {
	let now = Tone.now();
        this.noteSequence.forEach((function(note) {
            this.synth.triggerAttackRelease(note.freq, 0.1, now + note.time / 100);
        }).bind(this));
    }
}

class Graphics {
  canvas: HTMLCanvasElement;
  ctx: any;
  height: number;
  width: number;
  notehead: HTMLImageElement;
    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.height = canvas.height;
      this.width = canvas.width;
      this.notehead = new Image();
      this.notehead.src = "semibreve.svg";
    }

    toHSLString(x) {
      return 'hsl(' + Math.round(x.h) + ',' + x.s + '%,' + x.l + '%)';
    }

    // Draw the canvas
    drawBackground(mapper) {
      for(let i = 0; i < this.height; i++) {
        this.ctx.fillStyle = this.toHSLString(mapper.pixelToHSL(i));
        this.ctx.fillRect(0, i, this.width, i + 1);
      }
    }
  
    drawNotehead(x, y) {
      let topX = x - Math.abs(this.notehead.width);
      let topY = y - Math.abs(this.notehead.height) + 7;
      this.ctx.drawImage(this.notehead, topX, topY);
    }
    
}

type Div = HTMLDivElement;
type Button = HTMLButtonElement;

class FrequencyResolutionApplet {
  container: Div;
  canvas: HTMLCanvasElement;
  upperContainer: Div;
  playButton: Button;
  clearButton: Button;
  lowerContainer: Div;
  continuousButton: Button;
  chromaticButton: Button;
  scaleButton: Button;
  chordButton: Button;
  break1: HTMLBreakElement;
  break2: HTMLBreakElement;

  height: number;
  sound: Sound;
  graphics: Graphics;
  mapper: Mapper;
  
  
  
  buildUI(width: number, height: number): void {
    function button(text: string): Button {
      let t = document.createElement("button");
      t.innerHTML = text;
      return t;
    }

    function appendTo(parent: HTMLElement, children: HTMLElement): void {
      children.forEach( (el) => parent.appendChild(el) );
    }
	
	this.container = document.createElement("div");

	this.canvas = document.createElement("canvas");
	this.canvas.width = width;
	this.canvas.height = height;

	this.upperContainer = document.createElement("div");
	this.playButton = button("Play");
	this.clearButton = button("Clear");
	appendTo(this.upperContainer, [this.playButton,
				       this.clearButton]);

	this.lowerContainer = document.createElement("div");
	this.continuousButton = button("Continuous");
	this.chromaticButton = button("Chromatic");
	this.scaleButton = button("Scale");
	this.chordButton = button("Chord");
	appendTo(this.lowerContainer, [this.continuousButton,
				       this.chromaticButton,
				       this.scaleButton,
				       this.chordButton]);

	this.break1 = document.createElement("br");
	this.break2 = document.createElement("br");

	appendTo(this.container, [this.upperContainer,
				  this.break1,
				  this.canvas,
				  this.break2,
				  this.lowerContainer]);
    }

    clearCanvas() {
	this.sound.clearNotes();
	this.graphics.drawBackground(this.mapper);
    }

    connectEvents() {
	// TODO Fix scope issues that require bind()
	this.playButton.onclick = (function() {
	    this.sound.play();
	}).bind(this);
	this.clearButton.onclick = (function() {
	    this.sound.clearNotes();
	    this.graphics.drawBackground(this.mapper);
	}).bind(this);

	function resolutionChanger(tuning, caller) {
	    return function() {
		caller.mapper = new Mapper(caller.height, tuning);
		caller.clearCanvas();
		
	    };
	}
	
	this.continuousButton.onclick = resolutionChanger("continuous", this);
	this.chromaticButton.onclick = resolutionChanger("chromatic", this);
	this.scaleButton.onclick = resolutionChanger("major scale", this);
	this.chordButton.onclick = resolutionChanger("major chord", this);

	let handleClick = (function(event) {
	    let rect = this.canvas.getBoundingClientRect();
            let x = event.clientX - rect.left;
            let y = event.clientY - rect.top;

	    

	    let freq = this.mapper.pixelToFrequency(y);
            let time = x;
            let drawY = this.mapper.snapPixelHeight(y);
            let drawX = this.sound.quantizeTime(x); // TODO: Move quantize function to better location

            this.sound.addNote(freq, time);
            this.graphics.drawNotehead(drawX, drawY);
	}).bind(this);
	this.canvas.addEventListener("mousedown", handleClick);
  }

  getApplet(): Div {
    return this.container;
  }

    constructor(width, height, initialTuning) {
	this.buildUI(width, height);
	this.height = height;
	this.sound = new Sound(width);
	this.graphics = new Graphics(this.canvas);
	this.mapper = new Mapper(height, initialTuning);
	this.clearCanvas();
	this.connectEvents();
    }
}

export { FrequencyResolutionApplet };

