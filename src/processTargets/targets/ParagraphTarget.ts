import { Range } from "vscode";
import { Position, RemovalRange } from "../../typings/target.types";
import { parseRemovalRange } from "../../util/targetUtils";
import BaseTarget, {
  CommonTargetParameters,
  extractCommonParameters,
} from "./BaseTarget";

interface ParagraphTargetParameters extends CommonTargetParameters {
  leadingDelimiter?: RemovalRange;
  trailingDelimiter?: RemovalRange;
}

export default class ParagraphTarget extends BaseTarget {
  constructor(parameters: ParagraphTargetParameters) {
    super({
      ...extractCommonParameters(parameters),
      delimiter: "\n\n",
    });
  }

  get isLine() {
    return true;
  }

  get isParagraph() {
    return true;
  }

  withPosition(position: Position): ParagraphTarget {
    return new ParagraphTarget({ ...this.state, position });
  }

  getRemovalContentRange(): Range {
    const removalRange = new Range(
      this.editor.document.lineAt(this.contentRange.start).range.start,
      this.editor.document.lineAt(this.contentRange.end).range.end
    );
    const delimiterRange = (() => {
      const leadingDelimiter = parseRemovalRange(this.leadingDelimiter);
      const trailingDelimiter = parseRemovalRange(this.trailingDelimiter);
      if (trailingDelimiter != null) {
        const { document } = this.editor;
        // Trailing delimiter to end of file. Need to remove leading new line delimiter
        if (
          trailingDelimiter.range.end.line === document.lineCount - 1 &&
          leadingDelimiter != null
        ) {
          return new Range(
            document.lineAt(this.contentRange.start.line - 1).range.end,
            trailingDelimiter.range.end
          );
        }
        return trailingDelimiter.range;
      }
      if (leadingDelimiter) {
        return leadingDelimiter.range;
      }
      return undefined;
    })();
    return delimiterRange != null
      ? removalRange.union(delimiterRange)
      : removalRange;
  }

  protected getRemovalBeforeRange(): Range {
    return this.leadingDelimiter != null
      ? new Range(
          this.leadingDelimiter.range.start,
          this.editor.document.lineAt(
            this.contentRange.start.line - 1
          ).range.start
        )
      : this.contentRange;
  }
}
