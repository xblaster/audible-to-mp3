import { Input, Component, OnInit, NgZone } from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
const { ipcRenderer } = window.require('electron');

@Component({
  selector: 'app-filediv',
  templateUrl: './filediv.component.html',
  styleUrls: ['./filediv.component.scss']
})
export class FiledivComponent implements OnInit {

  @Input() filename: String;
  content: BehaviorSubject<String>;
  observableContent: Observable<String>;

  constructor(private zone: NgZone) {
    this.content = new BehaviorSubject(null);
    this.observableContent = this.content.asObservable();
    ipcRenderer.on('get-base64-img-reply', (event, arg) => {
      if (arg.filename === this.filename) {
        this.content.next(arg.content);
        this.zone.run(() => {});
      }
    });
   }

  ngOnInit() {
    ipcRenderer.send('get-base64-img', this.filename);
  }

}
