import BaseTarget from "./BaseTarget";

/**
 * A target that has no leading or trailing delimiters so it's removal range
 * just consists of the content itself. Its insertion delimiter will be
 * inherited from the source in the case of a bring after a bring before
 */
export default class RawSelectionTarget extends BaseTarget {
  /**
   * Note that we use an `undefined` value for `delimiterString` so that
   * "bring" will use the source delimiterString
   * */
  delimiterString = undefined;

  getLeadingDelimiterTarget = () => undefined;
  getTrailingDelimiterTarget = () => undefined;
  getRemovalRange = () => this.contentRange;

  protected getCloneParameters = () => this.state;
}
