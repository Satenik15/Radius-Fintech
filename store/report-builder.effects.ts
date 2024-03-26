import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, map } from 'rxjs/operators';
import * as ReportBuilderActions from './report-builder.actions';
import { ReportBuilderService } from '../service/report-builder.service';



@Injectable()
export class ReportBuilderEffects {
  constructor(
    private actions$: Actions,
    private reportBuilderService: ReportBuilderService
  ) { }
  
  getReportBuilderDefinition$ = createEffect(() => this.actions$.pipe(
    ofType(ReportBuilderActions.getReportBuilderDefinition),
    switchMap(({ dataSet }) => {
      return this.reportBuilderService.getReportBuilderDefinition(dataSet).pipe(
        map((reportBuilderDefinitione) => ReportBuilderActions.getReportBuilderDefinitionSuccess({ reportBuilderDefinitione })),
      );
    })
  ));

  getDataSets$ = createEffect(() => this.actions$.pipe(
    ofType(ReportBuilderActions.getDataSets),
    switchMap(() => {
      return this.reportBuilderService.getDataSets().pipe(
        map((dataSet) => ReportBuilderActions.getDataSetsSuccess({ dataSet })),
      );
    })
  ));

  getReports$ = createEffect(() => this.actions$.pipe(
    ofType(ReportBuilderActions.getReports),
    switchMap(() => {
      return this.reportBuilderService.getReports().pipe(
        map((reportsInformation) => ReportBuilderActions.getReportsSuccess({ reportsInformation })),
      );
    })
  ));

  deleteReport$ = createEffect(() => this.actions$.pipe(
    ofType(ReportBuilderActions.deleteReport),
    switchMap(({params}) => {
      return this.reportBuilderService.deleteReport(params).pipe(
        map(() => {
        return  ReportBuilderActions.deleteReportSuccess({ ids: params })
        }),
      );
    })
  ));
}
