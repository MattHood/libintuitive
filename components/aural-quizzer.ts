import { customElement, html, LitElement, queryAssignedNodes, property, query } from 'lit-element';
import "@webcomponents/webcomponentsjs/webcomponents-loader"
import "@webcomponents/custom-elements/src/native-shim"
import * as _ from 'lodash'

const WAIT_BETWEEN_QUESTIONS_MS = 1000; 

function guardToFirst<T>(first: T, ...rest: T[]): (s: T) => T {
    return (s: T) => rest.includes(s) ? s : first;
}

type QuizOptionSelection = "unselected" | "selected";
type QuizOptionVeracity = "uncorrected" | "incorrect" | "correct"

interface Quizzer {
    checkSelection: (qo: QuizOption) => QuizOptionSelection;
    checkVeracity: (qo: QuizOption) => QuizOptionVeracity;
}


export class QuizOption extends LitElement {
    static register() {
        customElements.define('intuitive-quiz-option', QuizOption);
    }
    @property({converter: guardToFirst("unselected", "selected") })
    selection: QuizOptionSelection = "unselected";

    @property({converter: guardToFirst("uncorrected", "incorrect", "correct") })
    veracity: QuizOptionVeracity = "uncorrected";

    @property({type: String})
    auralname: string = "Major 3rd";

    @property({type: String})
    slot  = "quizoption";

    parentQuiz: Quizzer;

    constructor() {
        super();
    }

    reset() {
        this.selection = "unselected";
        this.veracity = "uncorrected";
    }


    clickHandler() {
        this.selection = this.parentQuiz.checkSelection(this);
        this.veracity = this.parentQuiz.checkVeracity(this);
        if(this.veracity != "uncorrected") {
            setTimeout(this.reset.bind(this), WAIT_BETWEEN_QUESTIONS_MS);
        }
    }
    

    render() {
        return html`
            <button @click=${this.clickHandler}>${this.auralname} - ${this.selection.slice(0, 3)} - ${this.veracity.slice(0, 3)}</button>
        `
    }

}

// TODO Add Score
export class RegeneratingQuizzer extends LitElement implements Quizzer {
    static register() {
        customElements.define('intuitive-regenerating-aural-quiz', RegeneratingQuizzer);
    }

    options: QuizOption[];

    auralIDs: string[];

    @property({type: String})
    currentQuestion: string;

    constructor() {
        super();
    }

    firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);

        const isQuizOption = (n: Node): boolean => n.nodeName.toLowerCase() == 'intuitive-quiz-option';

        this.options = this.shadowRoot
            .querySelector('slot')
            .assignedNodes({flatten: true})
            .filter(isQuizOption)
            .map((n: Node) => n as QuizOption);
        this.auralIDs = this.options.map(qo => qo.auralname);

        this.options.forEach((qo) => { qo.parentQuiz = this; });

        this.newQuestion();
    }
       
    updated(changedProperties) { 
        super.updated(changedProperties);
        
    }

    newQuestion() {
        this.currentQuestion = _.sample(this.auralIDs);
    }

    render() {
        return html`
        <intuitive-aural type="${this.currentQuestion}"><button>Play</button></intuitive-aural>
        <slot></slot>
        `
    }

    checkSelection(qo: QuizOption): QuizOptionSelection {
        return "selected";
    }

    checkVeracity(qo: QuizOption): QuizOptionVeracity {
        const veracity = qo.auralname == this.currentQuestion ? "correct" : "incorrect";
        if(veracity == "correct") { 
            setTimeout(this.newQuestion.bind(this), WAIT_BETWEEN_QUESTIONS_MS); 
        };
        return veracity;
    }
}