import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { ModuleConfigurationService } from '@core/services/module-configuration.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { ReportsInputDto } from '../dto/reports-input.dto';
import { RestResourceResponse } from '../dto/rest-resource-response.dto';
import { ReportType } from '../models/report-type';
import { ReportTypePaths } from '../models/report-type-paths.enum';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  public submitFilter = new EventEmitter<ReportType>();
  public resetFilter = new EventEmitter<void>();

  private _chartsTreeMapData$ = new BehaviorSubject<ReportType>({});
  public chartsTreeMapData$ = this._chartsTreeMapData$.asObservable();

  constructor(private http: HttpClient, private moduleConfigurationService: ModuleConfigurationService) { }

  getReport<T>(reportType: ReportType, body: ReportsInputDto | null): Observable<RestResourceResponse<T>> {
    return this.http.post<RestResourceResponse<T>>(`${this.moduleConfigurationService.config$.value.config.url}/Reports/${ReportTypePaths[reportType]}`, body?.ProfileIds);
  }

  changChartsTreeMapData(data: ReportType) {
    this._chartsTreeMapData$.next(data);
  }
}
