import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportBuilderBySqlComponent } from './report-builder-by-sql.component';

describe('ReportBuilderBySqlComponent', () => {
  let component: ReportBuilderBySqlComponent;
  let fixture: ComponentFixture<ReportBuilderBySqlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportBuilderBySqlComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReportBuilderBySqlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
