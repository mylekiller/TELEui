import {Component, Input, OnInit, Inject} from '@angular/core';
import {from, Observable} from 'rxjs';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {concatMap, finalize, switchMap, mergeMap, map} from 'rxjs/operators';
import {Item} from '../app.component';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';

export interface ProgressData {
  progress: Observable<any>;
  documentid: number;
  downloadURL: Observable<any>;
  name: string;
}
@Component({
  selector: 'app-progress-dialog',
  templateUrl: './progress-dialog.component.html',
  styleUrls: ['./progress-dialog.component.css']
})
export class ProgressDialogComponent implements OnInit {

  buttonMessage = 'Uploading...';

  constructor(public dialogRef: MatDialogRef<ProgressDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ProgressData, private afs: AngularFirestore, private storage: AngularFireStorage) {
    this.data.progress.pipe(finalize(() => {
      this.updateDatabase();
    })).subscribe(_ => {
    }, error => {
      this.buttonMessage = 'Upload Failure!';
    });
  }

  updateDatabase() {
    const fileName = this.data.name != null ? `${this.data.documentid}.mp3` : 'blankname.mp3';
    const fileRef = this.storage.ref(fileName);
    let item: Item;
    const databaseDoc = this.afs.doc<Item>(`users/${this.data.documentid}`);
    fileRef.getDownloadURL().subscribe(url => {
      item = {msgURL: '/' + url.split('/').slice(3).join('/'), name: this.data.name};
      databaseDoc.set(item).then(() => {
        this.buttonMessage = 'Success!';
      }, () => {
        this.buttonMessage = 'Database Failure!';
      });
    });
  }
  ngOnInit() {
  }
  close() {
    this.dialogRef.close();
  }
}
