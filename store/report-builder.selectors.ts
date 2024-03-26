import { createSelector } from '@ngrx/store';
import { ReportBuilderStateDto } from './report-builder.reducers';

export const selectReportBuilderState = (state: any) => state.reportBuilder;

export const selectReportBuilderDefinitione = createSelector(
    selectReportBuilderState,
    (state: ReportBuilderStateDto) => {
        return state.reportBuilderDefinitione;
    }
);


export const selectReportsInformation = createSelector(
    selectReportBuilderState,
    (state: ReportBuilderStateDto) => {
        return state.reportsInformation;
    }
);

export const selectDataSet = createSelector(
    selectReportBuilderState,
    (state: ReportBuilderStateDto) => {
        return state.dataSet;
    }
);

export const selectError = createSelector(
    selectReportBuilderState,
    (state: ReportBuilderStateDto) => {
        return state.error;
    }
);
