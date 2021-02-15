import { Component, OnInit } from '@angular/core';
import { TwService } from '../tw.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {

  constructor(public twService: TwService) { }

  ngOnInit(): void {
    this.twService.history();
  }

}
