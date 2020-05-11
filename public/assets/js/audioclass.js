/*
Purpose: This class generates a two-layered music composition (chords and rhythm)

Functions:

General:
  - initAudioEngine(): audio engine, calls both chord and rythm algorhythm every this.speed

Chords:
  - riemann(): changes one note in chord by following the Riemann theory
      --> info: https://en.wikipedia.org/wiki/Riemannian_theory
  - readChord(): reads the chord en specifies the index numbers of the note functions and whether the chord is major or minor
  - playNotesSynth(): plays new notes and deletes old notes by controlling the noteOn/noteOff functions in the synth

Rhythm:
  - rhythmPlayer(): counts 12 beats and calls fourbeatAlg() and threebeatAlg()
  - fourbeatAlg() and threebeatAlg() have chance x to play a note on fourth or third positions
  - chance(): calculates the chance of a note being played between 0 and 9

*/

import { Synthesizer } from "./synthesizer.js"
import Store from "./Store.js"

class AudioClass{
  constructor(){
    // Init variables
    console.log("AudioClass started")
    this.groupid = -1;
    this.isHerding = false;
    this.speed = 200;

    // chords
    this.chord=[60,64,67];
    this.bassNote=[48];
    this.grondtoonIndex=0;
    this.tertsIndex=1;
    this.kwintIndex=2;
    this.chordType="major";
    this.chordBeat=0;
    //this.callBreak=false; //TODO: use callBreak to initiate breaks

    // Rythm
    this.voorkomkans = 8; //TODO: moet gekoppeld worden aan een variabele
    this.chancement = 0;
    this.rhythmNote = 'C3';
    this.rhythmNote2 = 'G3';
    this.rhythmBeat = 0;

    // Start audio
    this.initAudioEngine();
    this.randomPercentage = 0;
    this.moved = false; // Zegt of er een noot in het akkoord veranderd is
    this.counter = 0;
    this.newStart = false;
    this.synthesizer = new Synthesizer("chords",0);
    this.rhythmSynthesizer = new Synthesizer("rhythm",1);
    this.rhythmSynthesizer2 = new Synthesizer("drum",3);
  }

//-----------------------Chord generator-------------------------------------------//

  readChord(chordToRead){
    chordToRead.forEach((element,index)=>{
      chordToRead.forEach((element2,index2)=>{
        if (element-element2==7||element2-element==5){ // zoek naar kwint
          this.kwintIndex=index;
          this.grondtoonIndex=index2;
          this.tertsIndex=3-index2-index;
          // grote of kleine terts?
          if (chordToRead[this.tertsIndex]-chordToRead[this.grondtoonIndex]==4||chordToRead[this.grondtoonIndex]-chordToRead[this.tertsIndex]==8){
            this.chordType="major";
          } else {
            this.chordType="minor";
          }
        }
      });
      if (element>78){
        element-=12; // don't go to above f#5
      }
      if (element<46){
        element+=12; // don't go to below f#3
      }
    });
  }

  riemann(){
    this.prevChord = this.chord.slice();
    this.chordBeat+=1;
    if (this.chordBeat==13){
      this.chordBeat=1;
    }
    if (this.chordBeat==1){
      let choice = Math.round(randomInt(0,100)); // random keuze voor welke noot verandert
      // console.log(this.chord);
      // console.log(this.chordType);
      // console.log("Grondtoon= ", Tone.Frequency(this.chord[this.grondtoonIndex], "midi").toNote());
      // console.log("Terts= ", Tone.Frequency(this.chord[this.tertsIndex], "midi").toNote());
      // console.log("Kwint= ", Tone.Frequency(this.chord[this.kwintIndex], "midi").toNote());
      if (choice < 30){
        // Grondtoonverandering
        if(this.chordType == "major"){
          this.chord[this.grondtoonIndex]-=1;
        } else{
            this.chord[this.grondtoonIndex]-=2;
          }
      }
      if (choice >= 30 && choice < 60){
        // Tertsverandering
        if(this.chordType == "major"){
          this.chord[this.tertsIndex]-=1;
        } else{
            this.chord[this.tertsIndex]+=1;
          }
      }
      if (choice >= 60 && choice < 90){
        // Kwintverandering
        if(this.chordType == "major"){
          this.chord[this.kwintIndex]+=2;
        } else{
            this.chord[this.kwintIndex]+=1;
          }
      }
    }
    this.readChord(this.chord);
    if(this.synthesizer != undefined){
        this.playNotesSynth();
    }
  }

  //TODO:Make starter chord available
  playNotesSynth(){
    let prevBassNote = this.bassNote.slice();
    this.bassNote = [(this.chord[this.grondtoonIndex]-12)];
    let sortedPrev = prevBassNote.concat(this.prevChord.slice());
    let sortedNew = this.bassNote.concat(this.chord.slice());
    // Sort numbers from hight to low
    sortedPrev.sort((a, b) => a - b);
    sortedNew.sort((a, b) => a - b);
    let chordToPlay = [];
    let chordToNotPlay = [];
    let push = true;
    sortedNew.forEach((note,indexNote) => {
      sortedPrev.forEach((prevNote) => {
        if(note == prevNote){
          push = false;
          return;
        }
      });
      if(push){
        // push noten naar leesbare lijst voor synth (C4 ipv 60 naar)
        chordToNotPlay.push(Tone.Frequency(sortedPrev[indexNote], "midi").toNote());
        chordToPlay.push(Tone.Frequency(sortedNew[indexNote], "midi").toNote());
      } else {
        push = true;
      }
    });
    // Noten uit vorige lijst die niet o
    this.synthesizer.noteOff(chordToNotPlay);
    // Nieuwe noten naar noteOn
    this.synthesizer.noteOn(chordToPlay);
  }

  // Set data vanuit buiten de class
  setGroupID(groupid){
    // console.log("set groupID", groupid);
    this.groupid = groupid;
  }

  setIsHerding(isHerding,groupHerding){
    this.isHerding = isHerding;
    this.synthesizer.setFilter(isHerding);
    if(groupHerding <= 25){
      this.speed = 200;
    } else if(groupHerding > 25 && groupHerding <= 50){
      this.speed = 175;
    } else if(groupHerding > 50 && groupHerding <= 75){
      this.speed = 150;
    } else if(groupHerding > 75){
      this.speed = 125;
    }
  }

//-----------------------Beat generator-------------------------------------------//
  chance(){
    if (this.rhythmBeat == 0){
      this.voorkomkans = 10;
    } else {
      this.chancement = Math.floor(Math.random() * 10 + 1) // 1 tot 10
    }
  }

  fourbeatAlg(){
    if (this.rhythmBeat == 0 || this.rhythmBeat == 4 || this.rhythmBeat == 8) {
      this.chance();
      if (this.voorkomkans >= this.chancement){
        this.rhythmSynthesizer.noteOnOff();
      }
    }
  }

  threebeatAlg(){
    if (this.rhythmBeat == 0 || this.rhythmBeat == 3 || this.rhythmBeat == 6 || this.rhythmBeat == 9) {
      this.chance();
      if (this.voorkomkans >= this.chancement){
        this.rhythmSynthesizer2.noteOnOff();
      }
    }
  }


  rhythmPlayer(){ //Nieuwe synth maken met noise (attack is nu te lang)
    if (this.synthesizer === undefined) return;
    if (this.rhythmBeat < 11){
      this.fourbeatAlg();
      this.threebeatAlg();

      this.rhythmBeat += 1;
    } else {
      this.rhythmBeat = 0;
    }
  }

  //Recusive function to make sure this.speed can be variable
  clocker(){
    if(!Store.get("server/ready")){
      if(this.synthesizer === undefined || this.rhythmSynthesizer === undefined || this.rhythmSynthesizer2 === undefined){} else{
        this.synthesizer.noteOffAll(this.chord);
        this.rhythmSynthesizer.noteOffAll(this.chord);
        this.rhythmSynthesizer2.noteOffAll(this.chord);
      }
    } else {
      this.rhythmPlayer();
      this.riemann();
    }
    console.log("arm")
    setTimeout(() => {this.clocker();},this.speed);
  }

//-----------------------------General-----------------------------------------------//

  // Functie voor audio engine
  initAudioEngine(){
    this.clocker();
  }
}

export { AudioClass };
