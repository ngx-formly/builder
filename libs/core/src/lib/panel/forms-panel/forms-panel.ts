import { CoreFormService } from '../../editor/core-form.service';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { ButtonGroup } from 'primeng/buttongroup';
import { Empty } from '../../empty/empty';
import { CreateFormDialogService } from './create-form-dialog.service';
import { ImportDialogService } from './import-dialog.service';
import { MouseInsideService } from '../../editor/mouse-inside.service';
import { Filter } from '../../shared/filter';
import { PanelHeader } from '../../shared/panel-header';
import { Tooltip } from '../../shared/tooltip';
import { WorkspaceTreeItem } from './workspace-tree-item';

@Component({
  selector: 'core-forms-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MouseInsideService],
  imports: [
    Empty,
    ButtonDirective,
    ButtonIcon,
    ButtonLabel,
    ButtonGroup,
    Tooltip,
    Filter,
    PanelHeader,
    WorkspaceTreeItem,
  ],
  host: {
    class: 'overflow-hidden h-full block',
  },
  template: `
    <core-panel-header
      header="Workspace"
      subHeader="Create and manage forms"
    >
      <span
        actions
        class="inline-flex items-center gap-2"
      >
        <p-buttongroup aria-label="Workspace actions">
          <button
            pButton
            severity="secondary"
            aria-label="New folder"
            coreTooltip="New folder"
            tooltipPosition="top"
            [disabled]="hasStorageRecoveryIssues()"
            (click)="addNewFolder()"
          >
            <i
              pButtonIcon
              class="material-symbols-outlined"
            >
              create_new_folder
            </i>
          </button>
          <button
            pButton
            severity="secondary"
            aria-label="Import Form"
            coreTooltip="Import Form"
            tooltipPosition="top"
            [disabled]="hasStorageRecoveryIssues()"
            (click)="openImportDialog()"
          >
            <i
              pButtonIcon
              class="material-symbols-outlined"
            >
              upload
            </i>
          </button>
          <button
            pButton
            aria-label="Create Form"
            coreTooltip="Create Form"
            tooltipPosition="top"
            [disabled]="hasStorageRecoveryIssues()"
            (click)="addNewForm()"
          >
            <i
              pButtonIcon
              class="material-symbols-outlined"
            >
              add
            </i>
            <span pButtonLabel>Create Form</span>
          </button>
        </p-buttongroup>
      </span>
    </core-panel-header>

    @if (hasStorageRecoveryIssues()) {
      <div
        role="alert"
        class="m-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
      >
        <strong>Saved workspace data could not be read.</strong>
        <p class="mt-1">
          Download a backup before resetting the affected local data. Other editor workspaces will
          not be changed.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            pButton
            severity="secondary"
            outlined
            (click)="downloadRecoveryBackup()"
          >
            Download backup
          </button>
          <button
            pButton
            severity="danger"
            (click)="resetCorruptedStorage()"
          >
            Reset local data
          </button>
        </div>
      </div>
    }

    @if (showFilter()) {
      <div class="flex min-h-0 flex-1 flex-col">
        <div class="min-h-(--sub-panel-header-height) shrink-0 px-4">
          <core-filter
            [(value)]="filterValue"
            (clear)="clearFilter()"
          />
        </div>

        @if (isFiltering() && !filteredVisibleNodeIds().length) {
          <core-empty
            label="No forms or folders found"
            description="Try adjusting your filter criteria."
          />
        } @else if (hierarchyRootNodeIds().length) {
          <ul
            class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4"
            (mouseenter)="setMouseInside(true)"
            (mouseleave)="setMouseInside(false)"
          >
            @for (nodeId of hierarchyRootNodeIds(); track nodeId) {
              <li [class.hidden]="isFiltering() && !filteredVisibleNodeIds().includes(nodeId)">
                <core-workspace-tree-item
                  [nodeId]="nodeId"
                  [isFiltering]="isFiltering()"
                  [filteredVisibleNodeIds]="filteredVisibleNodeIds()"
                />
              </li>
            }
          </ul>
        }
      </div>
    } @else {
      <core-empty
        label="No Forms Yet"
        description="Click the + button to add a new form. You can also add the default form"
      >
        <button
          pButton
          text
          [disabled]="hasStorageRecoveryIssues()"
          (click)="addNewForm()"
        >
          <i class="material-symbols-outlined">assignment</i>
          Create Form
        </button>
      </core-empty>
    }
  `,
})
export class FormsPanel {
  protected formService = inject(CoreFormService);
  protected mouseInsideService = inject(MouseInsideService);
  protected createFormDialogService = inject(CreateFormDialogService);
  private readonly importDialogService = inject(ImportDialogService);
  private readonly document = inject(DOCUMENT);

  formList = this.formService.formList;
  hierarchyRootNodeIds = this.formService.hierarchyRootNodeIds;
  hierarchyNodeMap = this.formService.hierarchyNodeMap;
  hasStorageRecoveryIssues = this.formService.hasStorageRecoveryIssues;

  readonly filterValue = signal('');
  readonly isFiltering = computed(() => !!this.filterValue().trim());
  readonly showFilter = computed(
    () => this.isFiltering() || this.hierarchyRootNodeIds().length > 0,
  );
  readonly filteredVisibleNodeIds = computed(
    () => {
      const query = this.filterValue().trim().toLowerCase();
      if (!query) {
        return [];
      }

      const nodes = Object.values(this.hierarchyNodeMap());
      const visibleNodeIds = new Set<string>();

      nodes
        .filter((node) => node.name.toLowerCase().includes(query))
        .forEach((node) => {
          node.idPath.forEach((id) => visibleNodeIds.add(id));

          nodes
            .filter(
              (candidate) =>
                candidate.idPath.length >= node.idPath.length &&
                node.idPath.every((id, index) => candidate.idPath[index] === id),
            )
            .forEach((candidate) => visibleNodeIds.add(candidate.id));
        });

      return Array.from(visibleNodeIds);
    },
    {
      equal: (a, b) => a.length === b.length && a.every((val, index) => val === b[index]),
    },
  );

  addNewForm(): void {
    this.createFormDialogService.open();
  }

  addNewFolder(): void {
    this.formService.createFolder?.('New Folder');
  }

  openImportDialog(): void {
    this.importDialogService.open();
  }

  setMouseInside(isInside: boolean) {
    this.mouseInsideService.setMouseInside(isInside);
  }

  clearFilter() {
    this.filterValue.set('');
  }

  downloadRecoveryBackup(): void {
    const backup = this.formService.getStorageRecoveryBackup();
    const editorType = this.formService.storageRecoveryIssues()[0]?.editorType ?? 'workspace';
    const url = URL.createObjectURL(new Blob([backup], { type: 'application/json' }));
    const link = this.document.createElement('a');
    link.href = url;
    link.download = `formly-storage-recovery-${editorType}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  resetCorruptedStorage(): void {
    const confirmed = this.document.defaultView?.confirm(
      'Reset the corrupted local data for this workspace? Download a backup first if you may need it.',
    );
    if (confirmed) {
      this.formService.resetCorruptedStorage();
    }
  }
}
