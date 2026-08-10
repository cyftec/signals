import { ConnectionsManager } from "./signals-reception-manager";
import { IdGenerator } from "./id-generator";
import { Receiver } from "./_types";

/**
 * Installs and immediately runs a synchronous effect callback.
 *
 * Source signals read during the initial callback run are permanently connected
 * to the returned receiver and rerun the same callback when they are assigned.
 *
 * @param signalsCatcher - The callback whose initial source-signal reads are tracked.
 * @returns The receiver that the reception manager uses for future synchronous runs.
 *
 * @remarks
 * - The callback runs once before effect() returns.
 * - Only source-signal reads during that initial run register dependencies.
 * - dispose() removes the receiver from every captured source-signal dependency.
 * - dispose() is idempotent and run() remains available for manual, non-collecting runs.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const receiver = effect(() => console.log(count.value));
 * count.value = 1;
 * receiver.run();
 * receiver.dispose();
 * ```
 *
 * @see {@link Receiver} - The returned effect receiver.
 * @see {@link signal} - Creates source signals that effects can observe.
 */
export const effect = (signalsCatcher: () => void) => {
  const _id = IdGenerator.newID;

  const receiver: Receiver = {
    get id(): number {
      return _id;
    },

    run(): void {
      signalsCatcher();
    },

    dispose(): void {
      ConnectionsManager.removeReceiver(receiver);
    },
  } as const;

  ConnectionsManager.addReceiver(receiver);

  return receiver;
};
