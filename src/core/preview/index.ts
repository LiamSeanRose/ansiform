/**
 * Public surface of the device-CLI preview (issue #5). Downstream (#6
 * integration) imports from `../core/preview`, not individual files.
 */
export { renderPreview, type PreviewResult, type Scope } from './render';
export {
  extractTemplate,
  MAX_TEMPLATE_LENGTH,
  type TemplateExtraction,
  type FilterUse,
} from './render';
export { PreviewPane, type PreviewPaneProps, type PreviewMessages } from './PreviewPane';
