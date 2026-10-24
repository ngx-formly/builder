import { withTabsType } from '@ngx-formly/builder-material-fields';
import { ConfigOption } from '@ngx-formly/core';
import { TabsTypeBuilder } from './tabs.builder';

export function withTabsTypeBuilder(): ConfigOption {
  const config = withTabsType();
  return {
    ...config,
    types: config.types?.map((type) => ({ ...type, component: TabsTypeBuilder })),
  };
}
