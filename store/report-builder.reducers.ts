import { Action, createReducer, on } from '@ngrx/store';
import * as ReportBuilderActions from './report-builder.actions';
import { ReportInformationDto } from '../dto/report-information.dto';
import { DataTableDto } from '../dto/data-table.dto';


export interface ReportBuilderStateDto {
  reportBuilderDefinitione: DataTableDto | null;
  dataSet: string[];
  reportsInformation: ReportInformationDto[];
  error: HttpErrorResponse | null;
}

export const initialState: ReportBuilderStateDto = {
  reportBuilderDefinitione: null,
  dataSet: [],
  reportsInformation: [],
  error: null
};

export function reportBuilderReducer(state: ReportBuilderStateDto | undefined, action: Action): ReportBuilderStateDto {
  return reducer(state, action);
}

const reducer = createReducer<ReportBuilderStateDto>(
  initialState,

  on(ReportBuilderActions.getReportBuilderDefinitionSuccess, (state: ReportBuilderStateDto , {reportBuilderDefinitione}) => ({
    ...state,
    reportBuilderDefinitione,
  })),

  on(ReportBuilderActions.getReportsSuccess, (state, { reportsInformation }) => ({
    ...state,
    reportsInformation
  })),

  on(ReportBuilderActions.getDataSetsSuccess, (state, { dataSet }) => ({
    ...state,
    dataSet
  })),

  on(ReportBuilderActions.deleteReportSuccess, (state, { ids }) => ({
    ...state,
    reportsInformation:  state.reportsInformation.filter(el => !ids.includes(el.Id) ),
  })),
);
