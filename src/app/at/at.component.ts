import { Component, ElementRef, ViewChild, Input, OnChanges, SimpleChanges, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { atService } from './at.service';
import { SummarizationService } from './summarization.service';
import { API_CONFIGS } from './api-config';
import { Person } from '../../models/person';

interface AtMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Component({  
  selector: 'app-at',
  standalone: false,
  templateUrl: './at.component.html',
  styleUrls: ['./at.component.css']
})
//export class AtComponent implements OnChanges, AfterViewChecked {
export class AtComponent implements  AfterViewChecked {

  //@ViewChild('atContainer') atContainer?: ElementRef;
  // Add this new ViewChild for the scrollable inner container
  @ViewChild('atScrollContainer') atScrollContainer?: ElementRef<HTMLDivElement>;  // Targets .at-container
 
  //@Input() currentNPC: Actor | undefined = undefined; // New: Input to receive current NPC from parent
  @Input() isCtrlPressed: boolean = false; // New: Input to receive Ctrl key state from parent

  private atHistories: Map<number, AtMessage[]> = new Map(); // New: Per-NPC histories (keyed by NPC id)
  message: string = '';
  selectedApi: number = 1;
  maxHistoryLength: number = 12;
  summarizeThreshold: number = 10;
  private needsScroll: boolean = false; // Track if scrolling is needed
  private scrollRetryCount: number = 0; // Track retry attempts
  private maxScrollRetries: number = 5; // Increase max retries for robustness
  public mostRecent: string = "";

  public turns: number = 0;
  public num_ppl: number = 1;
  public ppl: Person[] = [];

  public system = "";
  public additional = "Usually reply briefly.";
  public initial = "";


  constructor(
    private atService: atService,
    private summarizationService: SummarizationService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {


    
    this.additional = "Only use English. Usually reply very briefly. Often go along with what the user wants. Occasionally your response can include ONLY one single, very brief roleplay actions enclosed in asterisks. You might find the user attractive. Occasionally use girly emotes."; 

  }


  // New: Check for scroll after view updates
  ngAfterViewChecked() {
    if (this.needsScroll) {
      //console.log('AfterViewChecked: needsScroll=true, isCtrlPressed=', this.isCtrlPressed);
      this.cdr.detectChanges(); // Force change detection
      this.scrollToBottom();
      this.needsScroll = false;
    }
  }

  changeApi(apiNumber: number) {
    this.selectedApi = apiNumber;
    this.atService.setApi(apiNumber);
  }

  async sendMessage() {
    if (!this.message.trim()) return;

    this.turns += 1;
    console.log('turns=' + this.turns);


    const mess = this.message;
    this.message = '';
    this.cdr.detectChanges();


    if (this.turns==1) {
      let indiv = mess.split('-');
      //console.log('test:' + indiv[0]);
      for (let i=0; i<indiv.length; i++) {
        let fields = indiv[i].split(',');
        let person = new Person(fields[0], Number(fields[1]), fields[2]);
        this.ppl.push(person);

        let bio_string = `Name: ${this.ppl[i].name}, Age: ${this.ppl[i].years}, Traits: ${this.ppl[i].traits}, Bio: ${this.ppl[i].bio}`;
        await this.fleshOut(bio_string, i);
        
      }
      this.num_ppl = this.ppl.length;
      //console.log('persons:' + this.ppl[0].traits.toString());
      //console.log('persons:' + this.ppl[1].traits.toString());
      this.system += `You are ${this.num_ppl} ${this.ppl[0].gender}(s). You should indicate who is speaking with a colon, for instance 'Jim:' and it is okay for characters to speak separately. Not all characters may be present at a given time either, which is ok.`
      for (let i=0; i<this.num_ppl; i++) {
        let bio_string = `Name: ${this.ppl[i].name}, Age: ${this.ppl[i].years}, Traits: ${this.ppl[i].traits}, Bio: ${this.ppl[i].bio}`;
        this.system += bio_string;
      }
      console.log("system after turn 1:" + this.system);


      
      //console.log(this.system);
      return;
    }
    
    if (this.turns==2) {
      this.initial = mess;
      console.log('system on turn 2:' + this.system);
      console.log('initial:' + this.initial);


      
      if (!this.atHistories.has(0)) {
        let theContent = this.system + " " + this.additional;
        this.atHistories.set(0, [
          { role: 'system', content: theContent } as AtMessage
        ]);
      }
      if (this.initial) {
        const history = this.atHistories.get(0) || [];
        history.push({ role: 'system', content: this.initial } as AtMessage);
        this.atHistories.set(0, history);
        
      }

      return;
    }
      

    
    
    const history = this.atHistories.get(0) || [];
    history.push({ role: 'user', content: mess } as AtMessage);
    //console.log('Message added to history:', history);
    this.atHistories.set(0, history);

    if (history.length > this.summarizeThreshold) {
      await this.summarizeHistory();
    }

    const truncatedHistory = history.length > this.maxHistoryLength
      ? [
          ...history.filter(msg => msg.role === 'system'),
          ...history.slice(-this.maxHistoryLength + history.filter(msg => msg.role === 'system').length)
        ]
      : history;

    const config = {
      ...API_CONFIGS[this.selectedApi],
      bodyFormatter: () => API_CONFIGS[this.selectedApi].bodyFormatter(truncatedHistory)
    };

    this.atService.sendMessageWithConfig(truncatedHistory, config).subscribe(
      (response) => {
        const parseResponse = this.atService.getResponseParser();
        const responseContent = parseResponse(response);
        console.log('Parsed response content:', responseContent); // Debugging
        history.push({ role: 'assistant', content: responseContent } as AtMessage);
        this.atHistories.set(0, history);
        this.mostRecent = responseContent;
        this.needsScroll = true; // Mark for scrolling
        console.log('Message sent, needsScroll=true, isCtrlPressed=', this.isCtrlPressed);
        this.cdr.detectChanges(); // Force change detection before scrolling
        this.scrollToBottom();
      },
      (error) => {
        console.error('Error:', error);
        history.push({ role: 'assistant', content: 'Error occurred while fetching response.' } as AtMessage);
        this.atHistories.set(0, history);
        this.needsScroll = true; // Mark for scrolling
        console.log('Error occurred, needsScroll=true, isCtrlPressed=', this.isCtrlPressed);
        this.cdr.detectChanges(); // Force change detection before scrolling
        this.scrollToBottom();
      }
    );

    this.message = '';
  }

  private async summarizeHistory() {
    //if (!this.currentNPC) return;
    //const npcId = this.currentNPC.id;
    const history = this.atHistories.get(0) || [];
    console.log(`Summarizing history...`);

    const existingSummaries = history
      .filter(msg => msg.role === 'system' && msg.content.startsWith('Summary of previous conversation:'))
      .map(msg => msg.content)
      .join('\n\n');

    const historyText = [
      existingSummaries ? `Previous Summaries:\n${existingSummaries}` : '',
      ...history
        .filter(msg => msg.role !== 'system' || !msg.content.startsWith('Summary of previous conversation:'))
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    ].filter(Boolean).join('\n\n');

    try {
      const summary = await this.summarizationService.summarize(historyText, []).toPromise();
      const updatedHistory: AtMessage[] = [
        history[0], // Persistent system prompt
        ...history.filter(msg => msg.role === 'system' && msg !== history[0]),
        { role: 'system', content: `Summary of previous conversation: ${summary}` } as AtMessage,
        ...history.slice(-2)
      ];
      this.atHistories.set(0, updatedHistory);
    } catch (error) {
      console.error('Failed to summarize history:', error);
    }
  }

  private async fleshOut(bio_string: string, person_id: number = 0) {
    //if (!this.currentNPC) return;
    //const npcId = this.currentNPC.id;
    const history = this.atHistories.get(0) || [];
    console.log(`Fleshing out ${person_id}...`);

    const existingSummaries = history
      .filter(msg => msg.role === 'system' && msg.content.startsWith('Summary of previous conversation:'))
      .map(msg => msg.content)
      .join('\n\n');

    const historyText = [
      existingSummaries ? `Previous Summaries:\n${existingSummaries}` : '',
      ...history
        .filter(msg => msg.role !== 'system' || !msg.content.startsWith('Summary of previous conversation:'))
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    ].filter(Boolean).join('\n\n');

    try {
      const new_bio = await this.summarizationService.fleshOut(bio_string).toPromise();
      this.ppl[person_id].bio = this.ppl[person_id].bio + '' + new_bio;
      //console.log('new_bio: ' + new_bio);

    } catch (error) {
      console.error('Failed to flesh out:', error);
    }
  }

  // Rest of the code (HostListeners, isOverlayVisible, scrollToBottom) remains unchanged
  isOverlayVisible(): boolean {
    return this.isCtrlPressed;
  }

  private scrollToBottom(): void {
    if (!this.isOverlayVisible() || !this.atScrollContainer?.nativeElement) {
      console.log('Cannot scroll: Overlay is hidden or scroll container not found');
      return;  // Don't scroll if the overlay is hidden (avoids errors with display: none)
    }

    // Use a short timeout to ensure Angular has updated the DOM after adding messages
    setTimeout(() => {
      try {
        const element = this.atScrollContainer!.nativeElement;
        element.scrollTop = element.scrollHeight;  // Simple scroll to bottom
        console.log('Scrolled to bottom successfully. scrollHeight:', element.scrollHeight, 'scrollTop:', element.scrollTop);
      } catch (error) {
        console.error('Error during scroll:', error);
      }
    }, 100);  // 100ms delay is usually enough; adjust if needed (e.g., to 200ms)
  }

  // New: Helper to get current history for template (e.g., in HTML)
  get currentHistory(): AtMessage[] {
    const history = this.atHistories.get(0) || [];
    //console.log('Current History:', history);
    return history;
  }
}