import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArticleEditor } from './article-editor';

describe('ArticleEditor', () => {
  let component: ArticleEditor;
  let fixture: ComponentFixture<ArticleEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArticleEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArticleEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
