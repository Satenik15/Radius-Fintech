import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";

import { ReportBuilderService } from "@app/pages/radius/analytics/report-builder/service/report-builder.service";

import { TableData } from 'ag-grid-lib';
import { ColDef } from "@ag-grid-community/core";
import { DisplayGrid, GridType, GridsterConfig, GridsterItem } from 'angular-gridster2';
import * as moment from "moment/moment";

import { ExecutionResult } from "@app/pages/radius/analytics/report-builder/components/report-builder-by-sql/report-builder-by-sql.types";
import { ReportSaveInputDto } from "@app/pages/radius/analytics/report-builder/dto/report-save-input.dto";
import { ReportData, VisualData } from "@app/pages/radius/analytics/report-builder/components/report-builder-by-datasource/report-builder.models";
import { VisualType } from "@app/pages/radius/analytics/report-builder/dto/visual-type";
import { DataTableDto } from "@app/pages/radius/analytics/report-builder/dto/data-table.dto";
import { ReportVisualSql } from './report-visual-by-sql/report-visual-by-sql.models';
import { DatePeriod } from '@app/pages/radius/shared/models/date-period';
import { ExternalFilters, ExternalFiltersMapping, IExternalFiltersValue } from '../../models/external-filters.model';
import { Subject } from 'rxjs';
import { ReportAssetAndGroupMask } from '../../models/report-asset-and-group-mask.model';
import { FilterMappingType, FilterMappingsDto } from '../../dto/filter-mapping.dto';
import { HttpErrorResponse } from '@angular/common/http';
import { ToolbarStateService } from '@app/shared/utils/toolbar-state.service';
import { BaseComponent } from '@app/core/base/base.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { TableFilterStateService } from '@app/pages/radius/shared/services/table-filter-state.service';
import { VisualState } from '../../models/visual-state.model';

@Component({
    templateUrl: './report-builder-by-sql.component.html',
    styleUrl: './report-builder-by-sql.component.scss'
})
export class ReportBuilderBySqlComponent extends BaseComponent implements OnInit, OnDestroy {

    protected colDefs: ColDef[] = [];
    protected colData?: TableData<any>;
    protected codeModel: string = "/*Type in an SQL Query*/";
    protected dataModel: DataTableDto | null = null;
    protected datePeriod?: DatePeriod;
    protected reportAssetAndGroupMask?: ReportAssetAndGroupMask;

    protected readonly executionResult: ExecutionResult = {
        succeeded: true,
        message: 'Please enter a query to execute.'
    };

    protected gridsterConfig: GridsterConfig = {
        gridType: GridType.Fixed,
        displayGrid: DisplayGrid.None,
        margin: 0,
        maxItemCols: 1000,
        maxItemRows: 1000,
        fixedColWidth: 100,
        fixedRowHeight: 80,
        defaultItemCols: 1,
        defaultItemRows: 1,
        mobileBreakpoint: 1200,
        pushItems: true,
        floating: true,
        pushDirections: {
            north: false,
            east: true,
            west: false,
            south: true
        },
        draggable: {
            enabled: true,
            ignoreContentClass: 'ignore-draggable',
        },
        resizable: {
            enabled: true
        },
        enableEmptyCellDrop: true,
        enableOccupiedCellDrop: true,
    };

    protected report: ReportData = {
        id: 0,
        name: '',
        dateFrom: moment().subtract(1, 'days').set({ hour: 0, minute: 0, second: 0, }).toDate(),
        dateTo: moment().subtract(1, 'days').set({ hour: 23, minute: 59, second: 59 }).toDate(),
        visuals: []
    };

    public externalFilters: { [visualId: number]: Partial<ExternalFilters> } = {};
    public hiddenExternalFilters: ExternalFiltersMapping = { datetime: true, assetmask: true, groupmask: true };
    public requiredExternalFilters: ExternalFiltersMapping = { datetime: false, assetmask: false, groupmask: false };

    public previousStateReportVisualsPosition?: { visualId: number, gridsterItemPosition: GridsterItem };
    public saveVisualState: VisualState = { assetAndGroupMask: {} };
    public enableColumnTotal: { [key: number]: boolean } = {};
    public showEditBar: boolean = true;
    public isViewMode: boolean = false;
    public isEditMode: boolean = false;
    public isValid: boolean = false;

    public reportVisualSql: ReportVisualSql[] = [];

    private destroy$ = new Subject<void>();

    public constructor(
        private readonly activatedRoute: ActivatedRoute,
        private readonly reportBuilderService: ReportBuilderService,
        private readonly cd: ChangeDetectorRef,
        private toolbarStateService: ToolbarStateService,
        private tableFilterStateService: TableFilterStateService
    ) {
        super();
    }

    public async ngOnInit(): Promise<void> {
        if (this.activatedRoute.snapshot.params.edit || this.activatedRoute.snapshot.params.view) {
            this.showEditBar = false;
            this.activatedRoute.snapshot.params.view && (this.isViewMode = true);
            this.activatedRoute.snapshot.params.edit && (this.isEditMode = true);

            this.gridsterConfig = {
                ...this.gridsterConfig,
                draggable: {
                    ...this.gridsterConfig.draggable,
                    enabled: !this.isViewMode
                },
                resizable: { enabled: !this.isViewMode }
            }

            this.getEditedReport();
            this.updateGridLayout();
        }

        if (!this.activatedRoute.snapshot.params.view) {
            setTimeout(() => {
                this.toolbarStateService.toolBarToggle$.next({ shift: 0, isOpened: false });
            });
        }

        this.datePeriod = { to: this.report.dateTo, from: this.report.dateFrom };
    }

    protected async onSaveReport(): Promise<void> {
        this.saveVisualState = {
            ...this.saveVisualState,
            dateFrom: this.report.dateFrom,
            dateTo: this.report.dateTo
        }

        if (!this.report.name || this.report.name.length === 0) {
            this.toastService.show('Please enter the report name', { classname: 'error' });
            return;
        } else {
            this.tableFilterStateService.saveFilterState(this.report.name, this.saveVisualState);
        }

        if (!this.codeModel || this.codeModel.length === 0) {
            this.toastService.show('Please enter a query to execute', { classname: 'error' });
            return;
        }

        if (!this.reportVisualSql.length) {
            this.toastService.show('No visuals sent. At least one visual is required.', { classname: 'error' });
            return;
        }

        const data: ReportSaveInputDto = {
            Id: this.report.id,
            Name: this.report.name,
            Description: this.report.description ?? null,
            Visuals: []
        }

        for (const visual of this.reportVisualSql) {

            if (this.previousStateReportVisualsPosition && this.previousStateReportVisualsPosition.visualId === visual.sqlId) {
                const previousPosition = this.previousStateReportVisualsPosition.gridsterItemPosition;
                visual.x = previousPosition.x;
                visual.y = previousPosition.y;
                visual.rows = previousPosition.rows;
                visual.cols = previousPosition.cols;
            }

            if (!visual.name || visual.name.length === 0) {
                this.toastService.show('Please enter a name for the visual', { classname: 'error' });
                return;
            }

            const foundedHeaderName = visual.dataModel?.Columns?.find(item => !item.HeaderName);

            if (foundedHeaderName) {
                this.toastService.show('Columns name is required', { classname: 'error' });
                return;
            }

            if (visual.dataModel?.ExternalFilterMappings) {
                this.isValid = this.checkExternalFiltersMapping(visual.dataModel?.ExternalFilterMappings);
            }


            data.Visuals.push({
                Id: visual.id || 0,
                Name: visual.name,
                Type: VisualType.Query,
                DataSet: visual.dataSet,
                Description: visual.description ?? null,
                GridPosition: {
                    X: visual.x,
                    Y: visual.y,
                    Rows: visual.rows,
                    Columns: visual.cols
                },
                TableState: JSON.stringify(visual.state) ?? JSON.stringify({}),
                Query: visual.codeModel,
                DataTable: visual.dataModel ?? undefined,
                IsMaximized: visual.isMaximized
            });
        }

        if (!this.isValid) return;

        await this.reportBuilderService.saveReport(data).then(() => {
            this.toastService.show('Report successfully saved.', { classname: 'accent' });
            if (this.reportAssetAndGroupMask && Object.values(this.reportAssetAndGroupMask).length) {
                this.saveVisualState = {
                    ...this.saveVisualState,
                    assetAndGroupMask: this.reportAssetAndGroupMask,
                }

                this.tableFilterStateService.saveFilterState(this.report.name, this.saveVisualState);
            }
        }).catch((err: HttpErrorResponse) => {
            this.handleError(err);
        });
    }

    protected executeSql(): void {
        this.loadData().then();
    }

    protected onExecutionResult(event: ExecutionResult) {
        this.executionResult.succeeded = event.succeeded;
        this.executionResult.message = event.message;

        !event.succeeded && this.toastService.show(event.message, { classname: 'error' });
    }

    protected async loadData(): Promise<void> {
        try {
            if (this.requiredExternalFilters.groupmask && !this.reportAssetAndGroupMask?.reportGroupMask) {
                return this.onExecutionResult({ succeeded: false, message: "Failed to execute query. Group mask value is required." });
            }

            if (this.requiredExternalFilters.assetmask && !this.reportAssetAndGroupMask?.reportAssetMask) {
                return this.onExecutionResult({ succeeded: false, message: "Failed to execute query. Asset mask value is required." });
            }

            this.reportVisualSql.forEach(item => {
                if (item.dataModel?.ExternalFilterMappings) {
                    this.isValid = this.checkExternalFiltersMapping(item.dataModel?.ExternalFilterMappings);
                    if (!this.isValid) return;
                }

                item.preventRequest = false;
                item.refresh.emit();
            });
        } catch (e: any) {
            console.error(e);
            this.onExecutionResult({ succeeded: false, message: e?.error?.Detail ?? "Failed to execute query." });
        }
    }

    onVisualRefresh(visual: ReportVisualSql) {
        if (this.requiredExternalFilters.groupmask && !this.reportAssetAndGroupMask?.reportGroupMask) {
            return this.onExecutionResult({ succeeded: false, message: "Failed to execute query. Group mask value is required." });
        }

        if (this.requiredExternalFilters.assetmask && !this.reportAssetAndGroupMask?.reportAssetMask) {
            return this.onExecutionResult({ succeeded: false, message: "Failed to execute query. Asset mask value is required." });
        }

        visual.refresh.emit();
    }

    onDateChange(period: DatePeriod): void {
        this.datePeriod = period;
        this.report.dateFrom = period.from;
        this.report.dateTo = period.to;
    }

    onReportFilter(filter: ReportAssetAndGroupMask) {
        this.reportAssetAndGroupMask = filter;
    }

    onExternalFiltersMappingChange({ visualId, changes }: { visualId: number, changes: { name: FilterMappingType, filter: IExternalFiltersValue } }) {
        if (!this.externalFilters[visualId]) {
            this.externalFilters[visualId] = {};
        }

        this.externalFilters[visualId][changes.name] = changes.filter;
        this.setExternalFiltersMapping();
    }

    setExternalFiltersMapping() {
        const hiddenExternalFilters = {
            datetime: true,
            assetmask: true,
            groupmask: true,
        }

        const requiredExternalFilters = {
            datetime: false,
            assetmask: false,
            groupmask: false,
        }

        Object.values(this.externalFilters).forEach(filters => {
            filters.datetime?.enabled && (hiddenExternalFilters.datetime = false);
            filters.assetmask?.enabled && (hiddenExternalFilters.assetmask = false);
            filters.groupmask?.enabled && (hiddenExternalFilters.groupmask = false);

            filters.datetime?.required && (requiredExternalFilters.datetime = true);
            filters.assetmask?.required && (requiredExternalFilters.assetmask = true);
            filters.groupmask?.required && (requiredExternalFilters.groupmask = true);
        });

        this.hiddenExternalFilters = hiddenExternalFilters
        this.requiredExternalFilters = requiredExternalFilters
    }

    checkExternalFiltersMapping(filter: FilterMappingsDto): boolean {
        let isValide = true;

        if (filter.assetmask && !filter.assetmask.ColumnName) {
            this.onExecutionResult({ succeeded: false, message: "Please enter a field for external filter 'Assetmask." });
            isValide = false;
        }

        if (filter.groupmask && !filter.groupmask.ColumnName) {
            this.onExecutionResult({ succeeded: false, message: "Please enter a field for external filter 'Groupmask." });
            isValide = false;
        }

        if (filter.datetime && !filter.datetime.ColumnName) {
            this.onExecutionResult({ succeeded: false, message: "Please enter a field for external filter 'Datetime." });
            isValide = false;
        }

        return isValide;
    }

    protected onVisualMaximized(maximized: boolean, visualData: VisualData): void {

        if (maximized) {
            this.previousStateReportVisualsPosition = structuredClone(
                {
                    visualId: visualData.sqlId,
                    gridsterItemPosition: {
                        x: visualData.x,
                        y: visualData.y,
                        cols: visualData.cols,
                        rows: visualData.rows
                    }
                }
            )

            visualData.x = 0;
            visualData.y = 0;
        }

        if (!this.isViewMode) {
            this.gridsterConfig.resizable!.enabled = !maximized;
            this.gridsterConfig.draggable!.enabled = !maximized;
        }

        if (this.previousStateReportVisualsPosition) {
            if (!maximized) {
                const previousItem = structuredClone(this.previousStateReportVisualsPosition);
                visualData.x = previousItem.gridsterItemPosition.x;
                visualData.y = previousItem.gridsterItemPosition.y;
                delete this.previousStateReportVisualsPosition;
            };
        }
        visualData.isMaximized = maximized;
        this.updateGridLayout();
    }

    protected onCreateVisuals() {
        this.reportVisualSql.length && (this.reportVisualSql = this.reportVisualSql.map(item => {
            return {
                ...item,
                isMaximized: false
            }
        }))
        this.reportVisualSql.push(
            {
                colDefs: [...this.colDefs],
                codeModel: this.codeModel,
                dataModel: this.dataModel,
                colData: this.colData,
                x: 0,
                y: this.reportVisualSql.length,
                rows: 6,
                cols: 8,
                name: '',
                description: '',
                dataSet: 'dynsql',
                type: VisualType.Table,
                sqlId: this.reportVisualSql.length,
                refresh: new EventEmitter<void>(),
                isMaximized: true,
                preventRequest: false
            }
        );
    }

    protected async getEditedReport() {
        const edit = Number(this.activatedRoute.snapshot.params.edit || this.activatedRoute.snapshot.params.view);
        const saved = await this.reportBuilderService.getReport(edit);
        const savedState: VisualState = this.tableFilterStateService.getFilterState(saved.Name);
        const preventRequest: { [key: number]: boolean } = {};

        if (savedState) {
            this.saveVisualState = savedState;
            this.enableColumnTotal = savedState;
            if (savedState.dateFrom && savedState.dateTo) {
                this.report.dateFrom = savedState.dateFrom;
                this.report.dateTo = savedState.dateTo;
                this.datePeriod = {
                    from: savedState.dateFrom,
                    to: savedState.dateTo
                };
            }
        }

        saved.Visuals.filter(item => {
            if (item.TableDefinition.DataTable) {
                const externalFilterMappings = item.TableDefinition.DataTable.ExternalFilterMappings;

                if (externalFilterMappings.assetmask) {
                    this.requiredExternalFilters.assetmask = externalFilterMappings.assetmask?.IsRequired || false;
                    this.hiddenExternalFilters.assetmask = false;

                    if (!savedState?.assetAndGroupMask?.reportAssetMask) {
                        preventRequest[item.Id] = true;
                        return;
                    }

                    this.reportAssetAndGroupMask && (this.reportAssetAndGroupMask.reportAssetMask = savedState.assetAndGroupMask?.reportAssetMask || '');
                }

                if (externalFilterMappings.groupmask) {
                    this.requiredExternalFilters.groupmask = externalFilterMappings.groupmask?.IsRequired || false;
                    this.hiddenExternalFilters.groupmask = false;

                    if (!savedState?.assetAndGroupMask?.reportGroupMask) {
                        preventRequest[item.Id] = true;
                        return;
                    }

                    this.reportAssetAndGroupMask && (this.reportAssetAndGroupMask.reportGroupMask = savedState.assetAndGroupMask?.reportGroupMask || '');
                }

                if (externalFilterMappings.datetime) {
                    this.requiredExternalFilters.datetime = externalFilterMappings.datetime?.IsRequired || false;
                    this.hiddenExternalFilters.datetime = false;
                }
            }
        });

        this.reportVisualSql = saved.Visuals.map(item => {

            if (item.IsMaximized) {
                this.previousStateReportVisualsPosition = structuredClone(
                    {
                        visualId: item.Id,
                        gridsterItemPosition: {
                            x: item.GridPosition.X,
                            y: item.GridPosition.Y,
                            cols: item.GridPosition.Columns,
                            rows: item.GridPosition.Rows
                        }
                    }
                );
            }

            return {
                x: item.GridPosition.X,
                y: item.GridPosition.Y,
                rows: item.GridPosition.Rows,
                cols: item.GridPosition.Columns,
                dataSet: item.DataSet,
                name: item.Name,
                description: item.Description,
                sqlId: item.Id,
                id: item.Id,
                type: item.VisualType.Id,
                codeModel: item.TableDefinition.Query,
                colDefs: item.TableDefinition.DataTable?.Columns,
                dataModel: item.TableDefinition.DataTable ?? null,
                isMaximized: item.IsMaximized,
                refresh: new EventEmitter<void>(),
                preventRequest: preventRequest[item.Id]
            }
        });

        this.report = {
            ...this.report,
            name: saved.Name,
            id: saved.Id,
            description: saved.Description || '',
            groupMask: savedState?.assetAndGroupMask?.reportGroupMask || '',
            assetMask: savedState?.assetAndGroupMask?.reportAssetMask || ''
        };
    }

    protected onVisualChanges(event: { value: any, id: number }) {
        this.isValid = event.value.isValid;
        this.reportVisualSql = this.reportVisualSql.map(item => {
            if (event.id === item.sqlId) {
                item.codeModel = event.value.codeModel;
                item.colDefs = event.value.colDefs;
                item.dataModel = event.value.dataModel;
            }
            return item;
        })
    }

    protected onReseteReportSql() {
        this.reportVisualSql = [];
        if (this.isEditMode) {
            this.getEditedReport();
            return;
        }
        this.report = {
            id: 0,
            name: '',
            dateFrom: moment().subtract(1, 'days').set({ hour: 0, minute: 0, second: 0, }).toDate(),
            dateTo: moment().subtract(1, 'days').set({ hour: 23, minute: 59, second: 59 }).toDate(),
            visuals: []
        };
        this.onExecutionResult({ succeeded: true, message: 'Please enter a query to execute.' });
    }

    protected onVisualRemoved(visual: VisualData): void {
        this.reportVisualSql = this.reportVisualSql.filter(x => x !== visual);
        if (!this.reportVisualSql.length) {
            this.onExecutionResult({ succeeded: true, message: 'Please enter a query to execute.' });
        }
        this.updateGridLayout();
    }

    protected onRenderOptionsChanged(event: { value: MatCheckboxChange, visualId: number }): void {
        this.saveVisualState = {
            ...this.saveVisualState,
            [event.visualId]: event.value.checked
        }

        this.enableColumnTotal = this.saveVisualState;

        if (this.report.name) {
            this.tableFilterStateService.saveFilterState(this.report.name, this.saveVisualState);
        }
    }

    protected updateGridLayout() {
        setTimeout(() => {
            this.gridsterConfig.api?.optionsChanged && this.gridsterConfig.api.optionsChanged();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.unsubscribe();
    }
}
