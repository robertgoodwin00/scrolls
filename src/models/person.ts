

// src/models/actor.ts
export class Person {
    //id: string; // Unique ID for each actor
    name: string;
    years: number;
    traits: string;
    bio: string;
    gender: string;

    



    // random int between min and max
    randomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }



    //constructor
    constructor(
      name: string = 'unnamed',
      years: number = 30,
      bio: string = '',
      gender: string = 'girl',   // girl or boy or whatever, default is girl
    ) {
      this.name = name;
      this.years = years;
      this.traits =  '';
      if (this.randomInt(1,10)<7)
        this.traits += 'shy,';
      if (this.randomInt(1,10)<8)
        this.traits += 'innocent,';
      if (this.randomInt(1,10)<7) {
        this.traits += 'curious,';
        if (this.randomInt(1,10)<5)
          this.traits += 'inquisitive,';
      }
      if (this.randomInt(1,10)<5)
        this.traits += 'submissive,';
      if (this.randomInt(1,10)<6)
        this.traits += 'terse,';
      if (this.randomInt(1,10)<4)
        this.traits += 'adventurous,';
      if (this.randomInt(1,10)<6)
        this.traits += 'juvenile,';
      if (this.randomInt(1,10)<3)
        this.traits += 'happy,';
      if (this.randomInt(1,10)<4)
        this.traits += 'uses LOTS of emoji,';
      if (this.randomInt(1,5)<3)
        this.traits += 'fun-loving,';
      if (this.randomInt(1,10)<2)
        this.traits += 'naughty,';
      if (this.randomInt(1,10)<6)
        this.traits += 'sweet,';
      if (this.randomInt(1,10)<2)
        this.traits += 'emotional,';
      if (this.randomInt(1,10)<2)
        this.traits += 'funny,';
      if (this.randomInt(1,10)<3)
        this.traits += 'quirky,';
      if (this.randomInt(1,10)<2)
        this.traits += 'giggly,';
      if (this.randomInt(1,10)<3)
        this.traits += 'energetic,';
      if (this.randomInt(1,10)<2)
        this.traits += 'sporty,';
      if (this.randomInt(1,10)<2)
        this.traits += 'quizzical,';
      if (this.randomInt(1,10)<2)
        this.traits += 'spiritual,';
      if (this.randomInt(1,10)<3)
        this.traits += 'lovelorn,';
      
      this.traits += 'cute';
      this.bio = bio;
      this.gender = gender;


    }

    

}
