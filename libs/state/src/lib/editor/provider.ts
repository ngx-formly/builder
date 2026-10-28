import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { CORE_FORM_STORE } from '../persistence/types';
import { LocalFormStoreService } from '../persistence/local-form-store.service';
import { BuilderEngineService } from './builder-engine.service';
import { BuilderFieldStateService } from './builder-field-state.service';
import { BUILDER_ENGINE_CONFIG, BuilderEngineConfig } from './types';

/** Provide an isolated editor engine without configuring a UI shell or a Formly runtime. */
export function provideBuilderEngine(config: BuilderEngineConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: BUILDER_ENGINE_CONFIG, useValue: config },
    { provide: CORE_FORM_STORE, useClass: config.formStore ?? LocalFormStoreService },
    BuilderEngineService,
    BuilderFieldStateService,
  ]);
}
