import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CanvasEditorComponent } from './canvas-editor.component';
import { EditorService } from '../editor.service';
import { MarketplaceService } from '../../marketplace/marketplace.service';

describe('CanvasEditorComponent page actions', () => {
  let component: CanvasEditorComponent;
  let fixture: ComponentFixture<CanvasEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasEditorComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => null } },
          },
        },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
        {
          provide: MarketplaceService,
          useValue: { getAssets: () => of({ data: [] }) },
        },
        {
          provide: EditorService,
          useValue: {
            toolMode: signal('select'),
            zoom: signal(1),
            saveState: signal('idle'),
            dirty: signal(false),
            layers: signal([]),
            selectedLayerIds: signal(new Set<string>()),
            selectedLayerType: signal(null),
            canUndo: signal(false),
            canRedo: signal(false),
            exportState: signal('idle'),
            aiJobState: signal({ status: 'idle', previewUrl: '' }),
            colorPalette: signal([]),
            gridVisible: signal(true),
            snapEnabled: signal(true),
            project: signal({ title: 'Test', width: 800, height: 600, canvasJson: '{}' }),
            initProject: () => of({}),
            startAutosave: () => {},
            stopAutosave: () => {},
            saveProject: () => of({}),
            registerCanvasApi: () => {},
            pushUndoState: () => {},
            syncLayers: () => {},
            setDirty: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CanvasEditorComponent);
    component = fixture.componentInstance;
    spyOn(component as any, 'ngAfterViewInit').and.resolveTo();
    fixture.detectChanges();
  });

  it('duplicates the current page and selects the copy', () => {
    component.addPage();
    component.currentPageIndex.set(0);

    component.duplicatePage();

    expect(component.pages().length).toBe(4);
    expect(component.currentPageIndex()).toBe(3);
    expect(component.currentPage().name).toContain('Copy');
  });

  it('deletes the current page and keeps the remaining page active', () => {
    component.addPage();
    component.currentPageIndex.set(1);

    component.deletePage();

    expect(component.pages().length).toBe(2);
    expect(component.currentPageIndex()).toBe(1);
    expect(component.currentPage().name).toBe('Page 3');
  });

  it('reorders pages when moving a page up', () => {
    component.addPage();

    component.movePage(1, -1);

    expect(component.pages()[0].name).toBe('Page 2');
    expect(component.pages()[1].name).toBe('Page 1');
  });

  it('toggles rulers visibility', () => {
    component.toggleRulers();
    expect(component.rulersVisible()).toBeTrue();

    component.toggleRulers();
    expect(component.rulersVisible()).toBeFalse();
  });

  it('toggles guide overlays and smart guides', () => {
    component.toggleGuides();
    expect(component.guidesVisible()).toBeFalse();

    component.toggleSmartGuides();
    expect(component.smartGuidesEnabled()).toBeFalse();

    component.toggleGuides();
    component.toggleSmartGuides();

    expect(component.guidesVisible()).toBeTrue();
    expect(component.smartGuidesEnabled()).toBeTrue();
  });

  it('toggles page margins and independent snap modes', () => {
    expect(component.pageMarginsVisible()).toBeTrue();
    expect(component.snapToGridEnabled()).toBeTrue();
    expect(component.snapToObjectsEnabled()).toBeTrue();

    component.togglePageMargins();
    component.toggleSnapToGrid();
    component.toggleSnapToObjects();

    expect(component.pageMarginsVisible()).toBeFalse();
    expect(component.snapToGridEnabled()).toBeFalse();
    expect(component.snapToObjectsEnabled()).toBeFalse();
  });

  it('snaps an object to the closest page margin edge and center', () => {
    const page = component.currentPage();
    const target = {
      left: 110,
      top: 122,
      width: 80,
      height: 60,
      getBoundingRect: () => ({ left: 110, top: 122, width: 80, height: 60 }),
    };

    (component as any).canvas = {
      getObjects: () => [],
      getWidth: () => 1200,
      getHeight: () => 900,
    };

    const snapped = (component as any).applySnapping(target);

    expect(page).toBeDefined();
    expect(snapped.left).toBe(page!.margin);
    expect(snapped.top).toBe(page!.margin);
  });
});
