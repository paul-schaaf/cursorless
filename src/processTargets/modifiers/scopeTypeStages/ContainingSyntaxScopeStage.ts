import { Location, Selection } from "vscode";
import { SyntaxNode } from "web-tree-sitter";
import { getNodeMatcher } from "../../../languages/getNodeMatcher";
import {
  ContainingScopeModifier,
  EveryScopeModifier,
  SimpleScopeType,
  Target,
} from "../../../typings/target.types";
import {
  NodeMatcher,
  ProcessedTargetsContext,
  SelectionWithEditor,
  SelectionWithEditorWithContext,
} from "../../../typings/Types";
import { selectionWithEditorFromRange } from "../../../util/selectionUtils";
import { ModifierStage } from "../../PipelineStages.types";
import ScopeTypeTarget from "../../targets/ScopeTypeTarget";

export interface SimpleContainingScopeModifier extends ContainingScopeModifier {
  scopeType: SimpleScopeType;
}

export interface SimpleEveryScopeModifier extends EveryScopeModifier {
  scopeType: SimpleScopeType;
}

export default class implements ModifierStage {
  constructor(
    private modifier: SimpleContainingScopeModifier | SimpleEveryScopeModifier
  ) {}

  run(context: ProcessedTargetsContext, target: Target): ScopeTypeTarget[] {
    const isEveryScope = this.modifier.type === "everyScope";

    const nodeMatcher = getNodeMatcher(
      target.editor.document.languageId,
      this.modifier.scopeType.type,
      isEveryScope
    );

    const node: SyntaxNode | null = context.getNodeAtLocation(
      new Location(target.editor.document.uri, target.contentRange)
    );

    const scopeNodes = findNearestContainingAncestorNode(node, nodeMatcher, {
      editor: target.editor,
      selection: new Selection(
        target.contentRange.start,
        target.contentRange.end
      ),
    });

    if (scopeNodes == null) {
      throw new Error(
        `Couldn't find containing ${this.modifier.scopeType.type}`
      );
    }

    return scopeNodes.map((scope) => {
      const {
        containingListDelimiter,
        leadingDelimiterRange,
        trailingDelimiterRange,
        removalRange,
      } = scope.context;
      const { editor, selection: contentSelection } = scope.selection;

      return new ScopeTypeTarget({
        scopeTypeType: this.modifier.scopeType.type,
        editor,
        isReversed: target.isReversed,
        contentRange: contentSelection,
        contentRemovalRange: removalRange,
        delimiter: containingListDelimiter,
        leadingDelimiterRange,
        trailingDelimiterRange,
        previousTarget: isEveryScope ? undefined : target,
      });
    });
  }
}

function findNearestContainingAncestorNode(
  startNode: SyntaxNode,
  nodeMatcher: NodeMatcher,
  selection: SelectionWithEditor
): SelectionWithEditorWithContext[] | null {
  let node: SyntaxNode | null = startNode;
  while (node != null) {
    const matches = nodeMatcher(selection, node);
    if (matches != null) {
      return matches
        .map((match) => match.selection)
        .map((matchedSelection) => ({
          selection: selectionWithEditorFromRange(
            selection,
            matchedSelection.selection
          ),
          context: matchedSelection.context,
        }));
    }
    node = node.parent;
  }

  return null;
}
