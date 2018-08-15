// const fs = require('fs');
// const remoteElec = require('electron').remote;
// const electroFs = remoteElec.require('fs');
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
const { ipcRenderer } = window.require('electron');

import { Component, OnInit, NgZone } from '@angular/core';
import { NgForm } from '@angular/forms';

import * as jsPDF from 'jspdf';
import { Observable } from 'rxjs/Observable';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private zone: NgZone, private _electronService: ElectronService) {
    this.book = new BehaviorSubject(null);
    this.chapters = new BehaviorSubject([]);
    this.observableFiles = this.chapters.asObservable();
    this.chapters.subscribe(function () { });
    this.syncChap = [];
    this.zone = zone;
  }

  public chapters: BehaviorSubject<any[]>;
  public book: BehaviorSubject<any>;
  public observableFiles: Observable<any[]>;
  private syncChap = [];
  private inPath = '';

  slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '_SPACE_')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      //.replace(/^-+/, '')             // Trim - from start of text
      //.replace(/-+$/, '');            // Trim - from end of text
      .replace(/_SPACE_/g, ' ');           // Replace spaces with -
  }

  ngOnInit() {



    ipcRenderer.on('get-chapters-list', (event, arg) => {
      console.log(arg);
      this.book.next(arg);
      this.chapters.next(arg.chapters);
      this.syncChap = arg.chapters;
      this.zone.run(() => { });
    });

  }

  asyEncode(chapter): Promise<string> {
    const p = new Promise<string>(resolve => {
      ipcRenderer.send('encode-chapter', chapter);
      ipcRenderer.on('encode-chapter-ok', (event, arg) => {
        resolve(arg);
      });
    });

    return p;

  }

  async encode() {
    console.log('encode');
    console.log(this.syncChap);
    for (const chapter of this.syncChap) {
      const cloned = Object.assign({}, chapter);
      cloned.in = this.inPath;
      cloned.out = this.slugify(chapter.name) + '.mp3';
      console.log(cloned);
      await this.asyEncode(chapter);
    }
  }

  onSubmit(f: NgForm) {
    console.log(f.value);  // { first: '', last: '' }
    console.log(f.valid);  // false
  }

  onChange(file) {
    // console.log('on change !');
    // console.log(files[0].path);

    // console.log(file);
    const path = file[0].path;
    this.inPath = path;
    console.log(path);
    ipcRenderer.send('get-chapters', path);

    /*const myNotification = new Notification('Title', {
      body: 'Lorem Ipsum Dolor Sit Amet'
    });*/
  }

  getPDF() {
    /*console.log(jsPDF);
    const doc = new jsPDF();
    doc.fromHTML(document.getElementById('images'), 0, 0, {
      'width': 1400, // max width of content on PDF
    }, function(bla) {   doc.save('saveInCallback.pdf');
   }, 12);*/
    window.print();
    // doc.save('a4.pdf');
  }
}
