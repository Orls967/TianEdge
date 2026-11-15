import {
  ArchitectureReference,
  ChipComponent,
  CitationEntry,
  EngineeringInsightTopic,
  FormulaEntry,
  GlossaryTerm,
  LearningPath,
  SemiconductorPrimer,
  TechnicalDiagramEntry,
} from '../types/models';

export interface ContentBundle {
  components: ChipComponent[];
  insights: EngineeringInsightTopic[];
  glossary: GlossaryTerm[];
  fundamentals: SemiconductorPrimer[];
  references: ArchitectureReference[];
  diagrams: TechnicalDiagramEntry[];
  formulas: FormulaEntry[];
  learningPaths: LearningPath[];
  citations: CitationEntry[];
}

export interface ContentValidationReport {
  valid: boolean;
  errors: string[];
}

export const CANONICAL_COMPONENT_COUNT = 36;
export const CANONICAL_INSIGHT_COUNT = 13;
export const CANONICAL_FORMULA_COUNT = 6;

export function validateContentBundle(bundle: ContentBundle): ContentValidationReport {
  const errors: string[] = [];

  if (bundle.components.length !== CANONICAL_COMPONENT_COUNT) {
    errors.push(`Expected ${CANONICAL_COMPONENT_COUNT} components, got ${bundle.components.length}`);
  }
  if (bundle.insights.length !== CANONICAL_INSIGHT_COUNT) {
    errors.push(`Expected ${CANONICAL_INSIGHT_COUNT} insights, got ${bundle.insights.length}`);
  }
  if (bundle.formulas.length !== CANONICAL_FORMULA_COUNT) {
    errors.push(`Expected ${CANONICAL_FORMULA_COUNT} formulas, got ${bundle.formulas.length}`);
  }

  const componentIds = new Set<string>();
  for (const comp of bundle.components) {
    if (componentIds.has(comp.id)) {
      errors.push(`Duplicate component id: ${comp.id}`);
    }
    componentIds.add(comp.id);
    if (!comp.modelReference?.meshPrefix.startsWith(`tianedge__${comp.id}`)) {
      errors.push(`Invalid meshPrefix on ${comp.id}: ${comp.modelReference?.meshPrefix}`);
    }
    if (comp.representationType === 'conceptual_enlarged' && !comp.scaleDisclaimer?.trim()) {
      errors.push(`Missing scaleDisclaimer on conceptual_enlarged component ${comp.id}`);
    }
    if (!comp.citationIds.length) {
      errors.push(`Component ${comp.id} has zero citations`);
    }
  }

  const insightIds = new Set(bundle.insights.map((i) => i.id));
  const citationIds = new Set(bundle.citations.map((c) => c.id));
  const formulaIds = new Set(bundle.formulas.map((f) => f.id));

  for (const comp of bundle.components) {
    for (const rel of comp.relationships) {
      if (!componentIds.has(rel.targetComponentId)) {
        errors.push(`Component ${comp.id} references unknown target ${rel.targetComponentId}`);
      }
    }
    for (const iid of comp.relatedInsightIds) {
      if (!insightIds.has(iid)) {
        errors.push(`Component ${comp.id} references unknown insight ${iid}`);
      }
    }
    for (const cid of comp.citationIds) {
      if (!citationIds.has(cid)) {
        errors.push(`Component ${comp.id} references unknown citation ${cid}`);
      }
    }
  }

  for (const ins of bundle.insights) {
    for (const cid of ins.relatedComponentIds) {
      if (!componentIds.has(cid)) {
        errors.push(`Insight ${ins.id} references unknown component ${cid}`);
      }
    }
    for (const fid of ins.formulaIds) {
      if (!formulaIds.has(fid)) {
        errors.push(`Insight ${ins.id} references unknown formula ${fid}`);
      }
    }
    for (const cit of ins.citationIds) {
      if (!citationIds.has(cit)) {
        errors.push(`Insight ${ins.id} references unknown citation ${cit}`);
      }
    }
  }

  for (const term of bundle.glossary) {
    for (const cid of term.relatedComponentIds) {
      if (!componentIds.has(cid)) {
        errors.push(`Glossary ${term.id} references unknown component ${cid}`);
      }
    }
    for (const cit of term.citationIds) {
      if (!citationIds.has(cit)) {
        errors.push(`Glossary ${term.id} references unknown citation ${cit}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
