import { commands } from "vscode";
import { ActionableError } from "../../errors";
import { PartialTarget, SelectionType } from "../../typings/target.types";
import { ActionType } from "../../typings/Types";
import { getPartialPrimitiveTargets } from "../../util/getPrimitiveTargets";
import {
  Command,
  CommandComplete,
  CommandLatest,
  LATEST_VERSION,
} from "../commandRunner/command.types";
import canonicalizeActionName from "./canonicalizeActionName";
import canonicalizeTargets from "./canonicalizeTargets";
import { upgradeV0ToV1 } from "./upgradeV0ToV1";
import { upgradeV1ToV2 } from "./upgradeV1ToV2";

/**
 * Given a command argument which comes from the client, normalize it so that it
 * conforms to the latest version of the expected cursorless command argument.
 *
 * @param command The command argument to normalize
 * @returns The normalized command argument
 */
export function canonicalizeAndValidateCommand(
  command: Command
): CommandComplete {
  const commandUpgraded = upgradeCommand(command);
  const {
    action: inputActionName,
    targets: inputPartialTargets,
    extraArgs: inputExtraArgs = [],
    usePrePhraseSnapshot = false,
    version,
    ...rest
  } = commandUpgraded;

  const actionName = canonicalizeActionName(inputActionName);
  const partialTargets = canonicalizeTargets(inputPartialTargets);

  validateCommand(actionName, partialTargets);

  return {
    ...rest,
    version: LATEST_VERSION,
    action: actionName,
    targets: partialTargets,
    extraArgs: inputExtraArgs,
    usePrePhraseSnapshot,
  };
}

function upgradeCommand(command: Command): CommandLatest {
  if (command.version > LATEST_VERSION) {
    throw new ActionableError(
      "Cursorless Talon version is ahead of Cursorless VSCode extension version. Please update Cursorless VSCode.",
      [
        {
          name: "Check for updates",
          action: () =>
            commands.executeCommand(
              "workbench.extensions.action.checkForUpdates"
            ),
        },
      ]
    );
  }

  while (command.version < LATEST_VERSION) {
    switch (command.version) {
      case 0:
        command = upgradeV0ToV1(command);
        break;
      case 1:
        command = upgradeV1ToV2(command);
        break;
    }
  }

  return command as CommandLatest; // TODO Better implementation ?
}

export function validateCommand(
  actionName: ActionType,
  partialTargets: PartialTarget[]
) {
  if (
    usesSelectionType("notebookCell", partialTargets) &&
    !["editNewLineBefore", "editNewLineAfter"].includes(actionName)
  ) {
    throw new Error(
      "The notebookCell scope type is currently only supported with the actions editNewLineAbove and editNewLineBelow"
    );
  }
}

function usesSelectionType(
  selectionType: SelectionType,
  partialTargets: PartialTarget[]
) {
  return getPartialPrimitiveTargets(partialTargets).some(
    (partialTarget) => partialTarget.selectionType === selectionType
  );
}
