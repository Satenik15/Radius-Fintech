import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PendingChangesGuard } from '../../shared/guards/pending-changes.guard';
import { ReportBuilderBySqlComponent } from "@app/pages/radius/analytics/report-builder/components/report-builder-by-sql/report-builder-by-sql.component";
import { ReportBuilderByDatasourceComponent } from './components/report-builder-by-datasource/report-builder-by-datasource.component';
import { ReportsListComponent } from './components/reports-list/reports-list.component';

const routes: Routes = [
    {
        path: '',
        component: ReportsListComponent,
        pathMatch: 'full',
    },
    {
        path: 'new',
        canDeactivate: [PendingChangesGuard],
        component: ReportBuilderByDatasourceComponent
    },
    {
        path: 'edit',
        data: { skip: true },
        children: [{
            path: ':edit',
            canDeactivate: [PendingChangesGuard],
            data: { skip: true },
            component: ReportBuilderByDatasourceComponent,
        }]
    },
    {
        path: 'view-datasource',
        data: { skip: true, skipPrev: true },
        children: [{
            path: ':view',
            data: { skip: true },
            component: ReportBuilderByDatasourceComponent,
        }]
    },
    {
        path: 'query',
        component: ReportBuilderBySqlComponent
    },
    {
        path: 'query/:edit',
        component: ReportBuilderBySqlComponent
    },
    {
        path: 'view-query/:view',
        component: ReportBuilderBySqlComponent
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ReportBuilderRoutingModule {
}
