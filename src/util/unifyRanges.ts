// TODO
// import { Range } from "vscode";
// import { Target } from "../typings/Types";
// import { performInsideOutsideAdjustment } from "./performInsideOutsideAdjustment";
// import { groupTargetsForEachEditor } from "./targetUtils";

// /** Unifies overlapping/intersecting ranges */
// export default function unifyRanges(ranges: Range[]): Range[] {
//   if (ranges.length < 2) {
//     return ranges;
//   }
//   let run = true;
//   while (run) {
//     [ranges, run] = unifyRangesOnePass(ranges);
//   }
//   return ranges;
// }

// function unifyRangesOnePass(ranges: Range[]): [Range[], boolean] {
//   if (ranges.length < 2) {
//     return [ranges, false];
//   }
//   const result: Range[] = [];
//   let madeChanges = false;
//   ranges.forEach((range) => {
//     const index = result.findIndex((r) => r.intersection(range) != null);
//     // Update existing intersecting range
//     if (index > -1) {
//       result[index] = result[index].union(range);
//       madeChanges = true;
//     }
//     // Add new range
//     else {
//       result.push(range);
//     }
//   });
//   return [result, madeChanges];
// }

// /**
//  * Unifies overlapping/intersecting targets
//  * FIXME This code probably needs to update once we have objected oriented targets
//  * https://github.com/cursorless-dev/cursorless/issues/210
//  */
// export function unifyTargets(targets: Target[]): Target[] {
//   if (targets.length < 2) {
//     return targets;
//   }
//   return groupTargetsForEachEditor(targets).flatMap(([_editor, targets]) => {
//     if (targets.length < 2) {
//       return targets;
//     }
//     let results = [...targets];
//     results.sort((a, b) =>
//       a.contentRange.start.compareTo(b.contentRange.start)
//     );
//     let run = true;
//     // Merge targets untill there are no overlaps/intersections
//     while (run) {
//       [results, run] = unifyTargetsOnePass(results);
//     }
//     return results;
//   });
// }

// function unifyTargetsOnePass(
//   targets: Target[]
// ): [Target[], boolean] {
//   if (targets.length < 2) {
//     return [targets, false];
//   }
//   const results: Target[] = [];
//   let currentGroup: Target[] = [];
//   targets.forEach((target) => {
//     // No intersection. Mark start of new group
//     if (
//       currentGroup.length &&
//       !intersects(currentGroup[currentGroup.length - 1], target)
//     ) {
//       results.push(mergeTargets(currentGroup));
//       currentGroup = [target];
//     } else {
//       currentGroup.push(target);
//     }
//   });
//   results.push(mergeTargets(currentGroup));
//   return [results, results.length !== targets.length];
// }

// function mergeTargets(targets: Target[]): Target {
//   if (targets.length === 1) {
//     return targets[0];
//   }
//   const first = targets[0];
//   const last = targets[targets.length - 1];
//   const typeSelection: Target = {
//     editor: first.editor,
//     contentRange: new Range(first.contentRange.start, last.contentRange.end),
//     leadingDelimiterRange: first.leadingDelimiterRange,
//     trailingDelimiterRange: last.trailingDelimiterRange,
//   };
//   return performInsideOutsideAdjustment(typeSelection);
// }

// function intersects(targetA: Target, targetB: Target) {
//   return !!targetA.contentRange.intersection(targetB.contentRange);
// }
