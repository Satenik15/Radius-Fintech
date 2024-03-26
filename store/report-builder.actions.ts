import { createAction, props } from '@ngrx/store';
import { DataTableDto } from '../dto/data-table.dto';
import { ReportInformationDto } from '../dto/report-information.dto';

export const getReportBuilderDefinition = createAction('[Report Builder] Get Report Builder Definitione', props<{ dataSet: string }>());
export const getReportBuilderDefinitionSuccess = createAction('[Report Builder] Get Report Builder Definitione Success', props<{ reportBuilderDefinitione: DataTableDto }>());

export const getDataSets = createAction('[Report Builder] Get DataSets');
export const getDataSetsSuccess = createAction('[Report Builder] Get DataSets Success', props<{ dataSet: string[] }>());

export const getReports = createAction('[Report Builder] Get Reports');
export const getReportsSuccess = createAction('[Report Builder] Get Reports Success', props<{ reportsInformation: ReportInformationDto[] }>());

export const deleteReport = createAction('[Report Builder] Delete report', props<{ params: number[] }>());
export const deleteReportSuccess = createAction('[Report Builder] Delete Report Success', props<{ ids: number[] }>());

export const showError = createAction('[Report Builder] Show Error', props<{ error: HttpErrorResponse }>());
export const resetError = createAction('[Report Builder] Reset Error');

