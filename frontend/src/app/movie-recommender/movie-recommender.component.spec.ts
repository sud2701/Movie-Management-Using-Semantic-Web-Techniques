import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovieRecommenderComponent } from './movie-recommender.component';

describe('MovieRecommenderComponent', () => {
  let component: MovieRecommenderComponent;
  let fixture: ComponentFixture<MovieRecommenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MovieRecommenderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MovieRecommenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
