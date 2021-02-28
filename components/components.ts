import ResponsiveFRA from './frequency-resolution-applet'
import Aural from './aural-object';
import TunePlayer from './note-parser'
import KeyboardGraphic from './keyboard-graphic'
import BasicFretboardGraphic from './fretboard-graphic'
import ChromaticScaleGraphic from './chromatic-scale-graphic'
import PlayPauseButton from './play-pause-button'
import { QuizOption, RegeneratingQuizzer } from './aural-quizzer'
import _bulmaStyle from 'bundle-text:bulma/css/bulma.css'



export default function RegisterComponents(): void {
    const sheet: any = new CSSStyleSheet();
    sheet.replaceSync(_bulmaStyle as string);
    (window as any).BulmaStyle = sheet;


    ResponsiveFRA.register();
    Aural.register();
    KeyboardGraphic.register();
    BasicFretboardGraphic.register();
    ChromaticScaleGraphic.register();
    TunePlayer.register();
    PlayPauseButton.register();
    QuizOption.register();
    RegeneratingQuizzer.register();
}