import {Component, OnDestroy} from '@angular/core';
import { AudioRecordingService } from '../services/audio-recording.service';
import { DomSanitizer } from '@angular/platform-browser';
import { AngularFireStorage } from '@angular/fire/storage';
import {finalize} from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { auth } from 'firebase/app';
import { Observable, from} from 'rxjs';
import {concatMap} from 'rxjs/operators';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {ProgressDialogComponent} from './progress-dialog/progress-dialog.component';

export interface Item { msgURL: string; name: string; }


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  isRecording = false;
  recordedTime;
  blobUrl;
  blobData;
  isUploading = false;
  uploadPercent;
  downloadURL;
  username;
  password;
  private itemDoc: AngularFirestoreDocument<Item>;
  item: Observable<Item>;
  name: string;
  documentid: string;
  modalRef;

  constructor(private audioRecordingService: AudioRecordingService, private sanitizer: DomSanitizer, private storage: AngularFireStorage,
              public afAuth: AngularFireAuth, private afs: AngularFirestore, private modal: MatDialog) {

    this.audioRecordingService.recordingFailed().subscribe(() => {
      this.isRecording = false;
    });

    this.audioRecordingService.getRecordedTime().subscribe((time) => {
      this.recordedTime = time;
    });

    this.audioRecordingService.getRecordedBlob().subscribe((data) => {
      this.blobData = data.blob;
      this.blobUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(data.blob));
    });
  }

  startRecording() {
    if (!this.isRecording) {
      this.isRecording = true;
      this.audioRecordingService.startRecording();
    }
  }

  abortRecording() {
    if (this.isRecording) {
      this.isRecording = false;
      this.audioRecordingService.abortRecording();
    }
  }

  stopRecording() {
    if (this.isRecording) {
      this.audioRecordingService.stopRecording();
      this.isRecording = false;
    }
  }

  clearRecordedData() {
    this.blobUrl = null;
    this.blobData = null;
    this.isUploading = false;
    this.downloadURL = null;
  }

  uploadFile() {
    if (this.documentid === null || this.documentid === undefined) {
      return;
    }
    const fileName = this.name != null ? `${this.documentid}.mp3` : 'blankname.mp3';
    this.isUploading = true;
    const fileRef = this.storage.ref(fileName);
    const task = this.storage.upload(fileName, this.blobData);
    this.uploadPercent = task.percentageChanges();
    task.snapshotChanges().pipe(
      finalize(() => {
          this.downloadURL = fileRef.getDownloadURL();
          this.isUploading = false;
        }
      )
    ).subscribe();
    this.openModal();
  }

  login() {
    this.afAuth.auth.signInWithEmailAndPassword(this.username, this.password);
  }
  logout() {
    this.afAuth.auth.signOut();
  }
  openModal() {
    this.modalRef = this.modal.open(ProgressDialogComponent, {
      data: {progress: this.uploadPercent, documentid: this.documentid, downloadURL: this.downloadURL, name: this.name.trim()}
    });
  }

  ngOnDestroy(): void {
    this.abortRecording();
  }
}
