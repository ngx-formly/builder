import { DOCUMENT } from '@angular/common';
import {
  Overlay,
  OverlayContainer,
  OverlayKeyboardDispatcher,
  OverlayOutsideClickDispatcher,
  OverlayPositionBuilder,
  ScrollStrategyOptions,
} from '@angular/cdk/overlay';
import { ScrollDispatcher, ViewportRuler } from '@angular/cdk/scrolling';
import {
  afterNextRender,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  computed,
  createComponent,
  createEnvironmentInjector,
  DestroyRef,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  input,
  Renderer2,
  RendererFactory2,
  signal,
  viewChild,
} from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormPreviewRenderer } from './form-preview-renderer';
import { PreviewDeviceToolbar } from './preview-device-toolbar';
import { PreviewViewportService } from './preview-viewport.service';

@Component({
  selector: 'core-form-preview-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PreviewDeviceToolbar],
  host: { class: 'flex h-full w-full min-h-0 flex-col overflow-hidden' },
  template: `
    <core-preview-device-toolbar [scale]="scale()" />
    <div
      #canvas
      class="min-h-0 grow overflow-hidden px-4 pb-4"
    >
      <div
        class="relative mx-auto overflow-hidden"
        [style.width]="scaledWidth()"
        [style.height.px]="canvasHeight()"
      >
        <iframe
          #previewFrame
          class="block origin-top-left"
          title="Responsive form preview"
          [style.width]="frameWidth()"
          [style.height.px]="frameHeight()"
          [style.transform]="'scale(' + scale() + ')'"
          (load)="initializeFrame()"
        ></iframe>
      </div>
    </div>
  `,
})
export class FormPreviewContent {
  readonly formFields = input<FormlyFieldConfig[]>([]);
  protected readonly viewport = inject(PreviewViewportService);
  private readonly applicationRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly previewFrame = viewChild.required<ElementRef<HTMLIFrameElement>>('previewFrame');
  private rendererRef: ComponentRef<FormPreviewRenderer> | null = null;
  private frameInjector: EnvironmentInjector | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private styleObserver: MutationObserver | null = null;
  private readonly frameStyles = new Map<Element, Element>();

  protected readonly canvasWidth = signal(0);
  protected readonly canvasHeight = signal(0);
  protected readonly scale = computed(() => {
    const targetWidth = this.viewport.targetWidth();
    if (targetWidth === null) {
      return 1;
    }

    const canvasWidth = this.canvasWidth();
    return canvasWidth > 0 ? Math.min(1, canvasWidth / targetWidth) : 1;
  });
  protected readonly scaledWidth = computed(() => {
    const targetWidth = this.viewport.targetWidth();
    return targetWidth ? `${targetWidth * this.scale()}px` : 'auto';
  });
  protected readonly frameWidth = computed(() => {
    const targetWidth = this.viewport.targetWidth();
    return targetWidth ? `${targetWidth}px` : '100%';
  });
  protected readonly frameHeight = computed(() => {
    const scale = this.scale();
    return scale > 0 ? this.canvasHeight() / scale : 0;
  });

  constructor() {
    effect(() => {
      const fields = this.formFields();
      this.rendererRef?.setInput('formFields', fields);
    });

    afterNextRender(() => this.observeCanvas());
    this.destroyRef.onDestroy(() => this.destroyFrame());
  }

  protected async initializeFrame(): Promise<void> {
    this.destroyRenderer();

    const frameDocument = this.previewFrame().nativeElement.contentDocument;
    if (!frameDocument) {
      return;
    }

    frameDocument.open();
    frameDocument.write('<!doctype html><html><head></head><body></body></html>');
    frameDocument.close();
    this.syncFrameAppearance(frameDocument);
    this.syncFrameStyles(frameDocument);
    this.observeStyles(frameDocument);

    await Promise.all(
      Array.from(frameDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(
        (link) =>
          link.sheet
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                link.addEventListener('load', () => resolve(), { once: true });
                link.addEventListener('error', () => resolve(), { once: true });
              }),
      ),
    );
    if (
      this.destroyRef.destroyed ||
      this.previewFrame().nativeElement.contentDocument !== frameDocument
    ) {
      return;
    }

    const hostElement = frameDocument.createElement('core-form-preview-renderer');
    frameDocument.body.append(hostElement);
    this.frameInjector = createEnvironmentInjector(
      [
        { provide: DOCUMENT, useValue: frameDocument },
        { provide: RendererFactory2, useValue: this.createFrameRendererFactory(frameDocument) },
        Overlay,
        OverlayContainer,
        OverlayPositionBuilder,
        OverlayKeyboardDispatcher,
        OverlayOutsideClickDispatcher,
        ScrollStrategyOptions,
        ScrollDispatcher,
        ViewportRuler,
      ],
      this.environmentInjector,
    );
    const rendererRef = createComponent(FormPreviewRenderer, {
      environmentInjector: this.frameInjector,
      hostElement,
    });
    this.applicationRef.attachView(rendererRef.hostView);
    this.rendererRef = rendererRef;
    rendererRef.setInput('formFields', this.formFields());
  }

  private createFrameRendererFactory(document: Document): RendererFactory2 {
    const factory: RendererFactory2 = Object.create(this.rendererFactory);
    factory.createRenderer = (host, type) => {
      const parentRenderer = this.rendererFactory.createRenderer(host, type);
      const renderer: Renderer2 = Object.create(parentRenderer);
      // Global listeners must follow the preview document, including resize and Escape.
      renderer.listen = (target, ...args) => {
        if (target === 'window') target = document.defaultView!;
        else if (target === 'document') target = document;
        else if (target === 'body') target = document.body;
        return parentRenderer.listen(target, ...args);
      };
      return renderer;
    };
    return factory;
  }

  private observeCanvas(): void {
    this.resizeObserver = new ResizeObserver(([entry]) => {
      this.canvasWidth.set(entry.contentRect.width);
      this.canvasHeight.set(entry.contentRect.height);
    });
    this.resizeObserver.observe(this.canvas().nativeElement);
  }

  private observeStyles(frameDocument: Document): void {
    this.styleObserver?.disconnect();
    this.styleObserver = new MutationObserver(() => {
      this.syncFrameAppearance(frameDocument);
      this.syncFrameStyles(frameDocument);
    });
    this.styleObserver.observe(this.document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private syncFrameAppearance(frameDocument: Document): void {
    frameDocument.documentElement.className = this.document.documentElement.className;
    frameDocument.documentElement.style.cssText = this.document.documentElement.style.cssText;
  }

  private syncFrameStyles(frameDocument: Document): void {
    const sources = Array.from(
      this.document.head.querySelectorAll('link[rel="stylesheet"], style'),
    );
    for (const [source, copy] of this.frameStyles) {
      if (!sources.includes(source)) {
        copy.remove();
        this.frameStyles.delete(source);
      }
    }

    let previous: Element | null = null;
    for (const source of sources) {
      let copy = this.frameStyles.get(source);
      if (!copy || !copy.isEqualNode(source)) {
        const updated = source.cloneNode(true) as Element;
        copy?.replaceWith(updated);
        copy = updated;
        this.frameStyles.set(source, copy);
      }
      // Keep loaded stylesheets in place while overlays add their component styles.
      if (copy.parentElement !== frameDocument.head || copy.previousElementSibling !== previous) {
        frameDocument.head.insertBefore(
          copy,
          previous ? previous.nextSibling : frameDocument.head.firstChild,
        );
      }
      previous = copy;
    }
  }

  private destroyRenderer(): void {
    const rendererRef = this.rendererRef;
    if (rendererRef) {
      this.applicationRef.detachView(rendererRef.hostView);
      rendererRef.destroy();
      this.rendererRef = null;
    }
    this.frameInjector?.destroy();
    this.frameInjector = null;
    this.frameStyles.clear();
  }

  private destroyFrame(): void {
    this.resizeObserver?.disconnect();
    this.styleObserver?.disconnect();
    this.destroyRenderer();
  }
}
