/*
Purpose: This class contains a synthesizer used to play a rhythm generated in audioClass,
inherits synthesizer.js by extension

New functions:
  - noteOnOff

*/

import { Synthesizer } from "./synthesizer.js"

class Rhythmsynth extends Synthesizer {
    constructor(waveform, baseFrequency, baseAmp, preset){
        super(waveform, baseFrequency, baseAmp, preset);
        $.getJSON("/assets/js/synth_presets/presets.json", (parameters) => {
            this.parameters = parameters;
            // Verander this.parameters[0] voor een andere preset
            this.synthesizer = new Tone.NoiseSynth(this.parameters[preset]).toMaster();
            this.reverb = new Tone.JCReverb().toMaster();
            this.delay = new Tone.FeedbackDelay();
            this.chorus = new Tone.Chorus();
            this.delay.connect(this.reverb);
            this.chorus.connect(this.delay);
            this.synthesizer.connect(this.chorus);
        });
    }
    noteOnOff(rhythmNote, length){
        if(this.synthesizer !== undefined){
            this.synthesizer.triggerAttackRelease("C3", '8n');
        }
    }
}

export { Rhythmsynth };
