import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import {
  BaseEditorForm,
  DefaultForm,
  WorkspaceFormNode,
  WorkspaceHierarchy,
  WorkspaceNode,
} from '../model/types';
import {
  FormStoreDataKind,
  FormStoreRecoveryIssue,
  FormStoreRecoveryRequiredError,
  FormStoreService,
} from './types';
import {
  addNodeToHierarchy,
  buildHierarchyFromFlatForms,
  removeNodeFromHierarchy,
  renameNodeInHierarchy,
} from '../model/workspace-hierarchy.utils';

@Injectable()
export class LocalFormStoreService implements FormStoreService {
  readonly storageKey = 'formly-studio-forms';
  readonly hierarchyStorageKey = 'formly-studio-hierarchy';
  private readonly recoveryIssues = new Map<
    string,
    BehaviorSubject<readonly FormStoreRecoveryIssue[]>
  >();

  addForm$(editorType: string, newForm: DefaultForm) {
    const formMap = this.getFormMap(editorType);
    let hierarchy = this.getHierarchySync(editorType);
    const recoveryError = this.getRecoveryError(editorType);
    if (recoveryError) {
      return throwError(() => recoveryError);
    }

    formMap[newForm.id!] = newForm;
    this.storeFormMap(editorType, formMap);

    const parentId = newForm.parentId ?? null;
    const formNode: WorkspaceFormNode = {
      id: newForm.id!,
      name: newForm.name,
      type: 'form',
      libraryId: newForm.libraryId,
      fieldCount: newForm.fieldCount ?? newForm.fields.length,
      parentId,
      idPath:
        parentId && hierarchy.nodeMap[parentId]
          ? [...hierarchy.nodeMap[parentId].idPath, newForm.id!]
          : [newForm.id!],
    };
    hierarchy = addNodeToHierarchy(hierarchy, formNode);
    this.storeHierarchy(editorType, hierarchy);

    return of(void 0);
  }

  updateForm$(editorType: string, newForm: DefaultForm) {
    const formMap = this.getFormMap(editorType);
    let hierarchy = this.getHierarchySync(editorType);
    const recoveryError = this.getRecoveryError(editorType);
    if (recoveryError) {
      return throwError(() => recoveryError);
    }

    formMap[newForm.id!] = newForm;
    this.storeFormMap(editorType, formMap);

    if (hierarchy.nodeMap[newForm.id!]) {
      hierarchy = renameNodeInHierarchy(hierarchy, newForm.id!, newForm.name);
      const node = hierarchy.nodeMap[newForm.id!];
      if (node && node.type === 'form') {
        node.fieldCount = newForm.fieldCount ?? newForm.fields.length;
        node.libraryId = newForm.libraryId;
      }
      this.storeHierarchy(editorType, hierarchy);
    }
    return of(void 0);
  }

  removeForm$(editorType: string, formId: string) {
    const formMap = this.getFormMap(editorType);
    const hierarchy = this.getHierarchySync(editorType);
    const recoveryError = this.getRecoveryError(editorType);
    if (recoveryError) {
      return throwError(() => recoveryError);
    }

    delete formMap[formId];
    this.storeFormMap(editorType, formMap);

    if (hierarchy.nodeMap[formId]) {
      const res = removeNodeFromHierarchy(hierarchy, formId);
      this.storeHierarchy(editorType, res.hierarchy);
    }
    return of(void 0);
  }

  getFormList$(editorType: string): Observable<BaseEditorForm[]> {
    return of(
      Object.values(this.getFormMap(editorType)).map((f) => ({
        id: f.id!,
        libraryId: f.libraryId,
        fieldCount: f.fieldCount ?? f.fields.length,
        name: f.name,
        parentId: f.parentId,
      })),
    );
  }

  getForm$(editorType: string, formId: string): Observable<DefaultForm | undefined> {
    return of(this.getFormMap(editorType)[formId]);
  }

  getHierarchy$(editorType: string): Observable<WorkspaceHierarchy> {
    return of(this.getHierarchySync(editorType));
  }

  saveHierarchy$(editorType: string, hierarchy: WorkspaceHierarchy): Observable<void> {
    this.getFormMap(editorType);
    this.getHierarchySync(editorType);
    const recoveryError = this.getRecoveryError(editorType);
    if (recoveryError) {
      return throwError(() => recoveryError);
    }

    this.storeHierarchy(editorType, hierarchy);
    return of(void 0);
  }

  getRecoveryIssues$(editorType: string): Observable<readonly FormStoreRecoveryIssue[]> {
    this.getFormMap(editorType);
    this.getHierarchySync(editorType);
    return this.getRecoveryIssuesSubject(editorType).asObservable();
  }

  resetCorruptedStorage$(editorType: string): Observable<void> {
    this.getFormMap(editorType);
    this.getHierarchySync(editorType);
    const issues = this.getRecoveryIssuesSubject(editorType).value;
    if (issues.some((issue) => issue.kind === 'forms')) {
      localStorage.removeItem(`${this.storageKey}-${editorType}`);
      localStorage.removeItem(`${this.hierarchyStorageKey}-${editorType}`);
    } else if (issues.some((issue) => issue.kind === 'hierarchy')) {
      localStorage.removeItem(`${this.hierarchyStorageKey}-${editorType}`);
    }
    this.getRecoveryIssuesSubject(editorType).next([]);
    return of(void 0);
  }

  protected getHierarchySync(editorType: string): WorkspaceHierarchy {
    const hierarchyStorageKey = `${this.hierarchyStorageKey}-${editorType}`;
    const raw = localStorage.getItem(hierarchyStorageKey);
    if (raw) {
      try {
        const hierarchy: unknown = JSON.parse(raw);
        if (this.isWorkspaceHierarchy(hierarchy)) {
          this.clearRecoveryIssue(editorType, 'hierarchy');
          return hierarchy;
        }
        this.setRecoveryIssue(editorType, 'hierarchy', 'invalid-shape', raw);
      } catch {
        this.setRecoveryIssue(editorType, 'hierarchy', 'invalid-json', raw);
      }
    } else {
      this.clearRecoveryIssue(editorType, 'hierarchy');
    }
    // Fallback: build from existing forms map
    const forms = Object.values(this.getFormMap(editorType)).map((f) => ({
      id: f.id!,
      libraryId: f.libraryId,
      fieldCount: f.fieldCount ?? f.fields.length,
      name: f.name,
      parentId: f.parentId,
    }));
    const hierarchy = buildHierarchyFromFlatForms(editorType, forms);
    if (!this.getRecoveryError(editorType)) {
      this.storeHierarchy(editorType, hierarchy);
    }
    return hierarchy;
  }

  protected storeHierarchy(editorType: string, hierarchy: WorkspaceHierarchy) {
    const hierarchyStorageKey = `${this.hierarchyStorageKey}-${editorType}`;
    localStorage.setItem(hierarchyStorageKey, JSON.stringify(hierarchy));
  }

  protected getFormMap(editorType: string): Record<string, DefaultForm> {
    const editorStorageKey = `${this.storageKey}-${editorType}`;
    const raw = localStorage.getItem(editorStorageKey);
    if (!raw) {
      this.clearRecoveryIssue(editorType, 'forms');
      return {};
    }

    try {
      const formMap: unknown = JSON.parse(raw);
      if (this.isFormMap(formMap)) {
        this.clearRecoveryIssue(editorType, 'forms');
        return formMap;
      }
      this.setRecoveryIssue(editorType, 'forms', 'invalid-shape', raw);
      return {};
    } catch {
      this.setRecoveryIssue(editorType, 'forms', 'invalid-json', raw);
      return {};
    }
  }

  protected storeFormMap(editorType: string, formMap: Record<string, DefaultForm>) {
    const editorStorageKey = `${this.storageKey}-${editorType}`;
    localStorage.setItem(editorStorageKey, JSON.stringify(formMap));
  }

  private getRecoveryIssuesSubject(
    editorType: string,
  ): BehaviorSubject<readonly FormStoreRecoveryIssue[]> {
    let subject = this.recoveryIssues.get(editorType);
    if (!subject) {
      subject = new BehaviorSubject<readonly FormStoreRecoveryIssue[]>([]);
      this.recoveryIssues.set(editorType, subject);
    }
    return subject;
  }

  private getRecoveryError(editorType: string): FormStoreRecoveryRequiredError | undefined {
    const issues = this.getRecoveryIssuesSubject(editorType).value;
    return issues.length ? new FormStoreRecoveryRequiredError(issues) : undefined;
  }

  private setRecoveryIssue(
    editorType: string,
    kind: FormStoreDataKind,
    reason: FormStoreRecoveryIssue['reason'],
    rawValue: string,
  ): void {
    const subject = this.getRecoveryIssuesSubject(editorType);
    const issue: FormStoreRecoveryIssue = {
      editorType,
      kind,
      reason,
      rawValue,
      storageKey:
        kind === 'forms'
          ? `${this.storageKey}-${editorType}`
          : `${this.hierarchyStorageKey}-${editorType}`,
    };
    if (kind === 'forms') {
      const storageKey = `${this.hierarchyStorageKey}-${editorType}`;
      const rawValue = localStorage.getItem(storageKey);
      if (rawValue !== null) {
        issue.relatedEntries = [{ storageKey, rawValue }];
      }
    }
    subject.next([...subject.value.filter((value) => value.kind !== kind), issue]);
  }

  private clearRecoveryIssue(editorType: string, kind: FormStoreDataKind): void {
    const subject = this.getRecoveryIssuesSubject(editorType);
    const issues = subject.value.filter((issue) => issue.kind !== kind);
    if (issues.length !== subject.value.length) {
      subject.next(issues);
    }
  }

  private isFormMap(value: unknown): value is Record<string, DefaultForm> {
    return (
      this.isRecord(value) &&
      Object.values(value).every(
        (form) =>
          this.isRecord(form) &&
          (form['id'] === undefined || typeof form['id'] === 'string') &&
          (form['libraryId'] === undefined || typeof form['libraryId'] === 'string') &&
          typeof form['name'] === 'string' &&
          Array.isArray(form['fields']) &&
          this.isRecord(form['model']),
      )
    );
  }

  private isWorkspaceHierarchy(value: unknown): value is WorkspaceHierarchy {
    if (
      !this.isRecord(value) ||
      typeof value['workspaceId'] !== 'string' ||
      !Array.isArray(value['rootNodeIds']) ||
      !value['rootNodeIds'].every((id) => typeof id === 'string') ||
      !this.isRecord(value['nodeMap'])
    ) {
      return false;
    }

    const nodeMap = value['nodeMap'] as Record<string, unknown>;
    return (
      value['rootNodeIds'].every((id) => id in nodeMap) &&
      Object.entries(nodeMap).every(([id, node]) => this.isWorkspaceNode(node) && node.id === id)
    );
  }

  private isWorkspaceNode(value: unknown): value is WorkspaceNode {
    if (
      !this.isRecord(value) ||
      typeof value['id'] !== 'string' ||
      typeof value['name'] !== 'string' ||
      (value['parentId'] !== null && typeof value['parentId'] !== 'string') ||
      !Array.isArray(value['idPath']) ||
      !value['idPath'].every((id) => typeof id === 'string')
    ) {
      return false;
    }

    return value['type'] === 'folder'
      ? Array.isArray(value['childIds']) && value['childIds'].every((id) => typeof id === 'string')
      : value['type'] === 'form' && typeof value['libraryId'] === 'string';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
