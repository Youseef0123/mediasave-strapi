import type { Schema, Struct } from '@strapi/strapi';

export interface SharedListItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_list_items';
  info: {
    description: 'Repeatable list item for responsibilities and requirements';
    displayName: 'List Item';
    icon: 'bulletList';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'shared.list-item': SharedListItem;
    }
  }
}
