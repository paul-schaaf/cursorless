import { FlashStyle } from "@cursorless/common";
import { flatten, zip } from "lodash";
import { RangeUpdater } from "../core/updateSelections/RangeUpdater";
import { performEditsAndUpdateSelections } from "../core/updateSelections/updateSelections";
import { ide } from "../singletons/ide.singleton";
import { Target } from "../typings/target.types";
import { flashTargets, runForEachEditor } from "../util/targetUtils";
import { Action, ActionReturnValue } from "./actions.types";

type RangeGenerator = { start: number };

export default class Replace implements Action {
  constructor(private rangeUpdater: RangeUpdater) {
    this.run = this.run.bind(this);
  }

  private getTexts(
    targets: Target[],
    replaceWith: string[] | RangeGenerator,
  ): string[] {
    if (Array.isArray(replaceWith)) {
      // Broadcast single text to each target
      if (replaceWith.length === 1) {
        return Array(targets.length).fill(replaceWith[0]);
      }
      return replaceWith;
    }
    const numbers = [];
    for (let i = 0; i < targets.length; ++i) {
      numbers[i] = (replaceWith.start + i).toString();
    }
    return numbers;
  }

  async run(
    [targets]: [Target[]],
    replaceWith: string[] | RangeGenerator,
  ): Promise<ActionReturnValue> {
    await flashTargets(ide(), targets, FlashStyle.pendingModification0);

    const texts = this.getTexts(targets, replaceWith);

    if (targets.length !== texts.length) {
      throw new Error("Targets and texts must have same length");
    }

    const edits = zip(targets, texts).map(([target, text]) => ({
      edit: target!.constructChangeEdit(text!),
      editor: target!.editor,
    }));

    const thatMark = flatten(
      await runForEachEditor(
        edits,
        (edit) => edit.editor,
        async (editor, edits) => {
          const [updatedSelections] = await performEditsAndUpdateSelections(
            this.rangeUpdater,
            ide().getEditableTextEditor(editor),
            edits.map(({ edit }) => edit),
            [targets.map((target) => target.contentSelection)],
          );

          return updatedSelections.map((selection) => ({
            editor,
            selection,
          }));
        },
      ),
    );

    return { thatSelections: thatMark };
  }
}
