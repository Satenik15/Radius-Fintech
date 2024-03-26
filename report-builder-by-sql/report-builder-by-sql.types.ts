import {DataTableDto} from "@app/pages/radius/analytics/report-builder/dto/data-table.dto";

export type ExecutionResult = {
    succeeded: boolean;
    message: string;
};

export type VisualBySqlDataDto = {
    DataTable: DataTableDto;
    RowData: [any];
};