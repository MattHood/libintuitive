import { customElement, html, css, LitElement, queryAssignedNodes, property, query, internalProperty } from 'lit-element';
import "@webcomponents/webcomponentsjs/webcomponents-loader"
import "@webcomponents/custom-elements/src/native-shim"
import * as _ from 'lodash'
import IntuitiveElement from './intuitive-element'


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


export class QuizOption extends IntuitiveElement {
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
        const selectStyle = this.selection == "unselected" ? "is-light" : "";
        const colorStyle = this.veracity == "uncorrected" ? "is-info" 
                            : this.veracity == "correct" ? "is-primary" : "is-danger";
        return html`
            <button class="button ${selectStyle} ${colorStyle}" 
                    @click=${this.clickHandler}>
                ${this.auralname}
            </button>
        `
    }

}

// TODO Add Score
export class RegeneratingQuizzer extends IntuitiveElement implements Quizzer {
    static register() {
        customElements.define('intuitive-regenerating-aural-quiz', RegeneratingQuizzer);
    }

    options: QuizOption[];

    auralIDs: string[];

    @property({type: String})
    currentQuestion: string;

    @internalProperty()
    attempts: number = 0;

    @internalProperty()
    correctGuesses: number = 0;


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
        const play = 
            html`<intuitive-aural type="${this.currentQuestion}">
                    <button class="button is-info">Play</button>
                 </intuitive-aural>`;
        const scorePercentage = this.attempts == 0 ? 0 : Math.round((this.correctGuesses / this.attempts) * 100);
        const score = 
            html`${this.correctGuesses} / ${this.attempts} - 
                 ${scorePercentage}%`;

        return html`    
        ${play}
        <slot></slot> <br />
        ${score}
        `
    }

    checkSelection(qo: QuizOption): QuizOptionSelection {
        return "selected";
    }

    checkVeracity(qo: QuizOption): QuizOptionVeracity {
        const veracity = qo.auralname == this.currentQuestion ? "correct" : "incorrect";
        this.attempts += 1;
        if(veracity == "correct") { 
            this.correctGuesses += 1;
            setTimeout(this.newQuestion.bind(this), WAIT_BETWEEN_QUESTIONS_MS); 
        };
        return veracity;
    }
}