import { Connector } from "./connector";
import { IdGenerator } from "./id-generator";
import { Receiver } from "./_types";

/**
 * Installs and immediately runs a synchronous effect callback.
 *
 * Source signals read during the initial callback run are permanently connected
 * to the returned receiver and rerun the same callback when they are assigned.
 *
 * @param signalsCatcher - The callback whose initial source-signal reads are tracked.
 * @returns The receiver that the connector uses for future synchronous runs.
 *
 * @remarks
 * - The callback runs once before effect() returns.
 * - Only source-signal reads during that initial run register dependencies.
 * - The returned receiver has no disposal method.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const receiver = effect(() => console.log(count.value));
 * count.value = 1;
 * receiver.run();
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
  } as const;

  Connector.installReceiver(receiver);

  return receiver;
};
