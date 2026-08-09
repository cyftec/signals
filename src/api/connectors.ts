import { effect, MaybeSignal, Effect, SourceSignal } from "../_core";
import { value } from "../utils";

/**
 * Connects several signal-capable transmitters to one mutable receiver.
 *
 * One effect is created per transmitter. Each effect immediately copies its
 * transmitter into the receiver, then repeats for future changes when that
 * transmitter is live.
 *
 * @template T - The transmitted value type.
 * @param receiver - The source signal that receives values.
 * @param transmittors - Plain values or signals to connect, in initialization order.
 * @returns One disposable effect per transmitter.
 *
 * @remarks
 * - Initialization is synchronous; the last argument supplies the final initial value.
 * - Plain and dead transmitters perform only their immediate copy.
 * - A live transmitter continues updating the receiver until its effect is disposed.
 * - Passing no transmitters returns an empty array.
 *
 * @example
 * ```typescript
 * const first = signal("first");
 * const second = signal("second");
 * const receiver = signal("");
 * const connections = receive(receiver, first, second);
 * console.log(receiver.value); // "second"
 * first.value = "updated";
 * connections.forEach((connection) => connection.dispose());
 * ```
 *
 * @see {@link transmit} - Connects one transmitter to several receivers.
 * @see {@link effect} - Implements each connection.
 * @see {@link value} - Unwraps transmitter values.
 */
export const receive = <T>(
  receiver: SourceSignal<T>,
  ...transmittors: MaybeSignal<T>[]
): Effect[] => {
  const effects = transmittors.map((transmittor) =>
    effect(() => (receiver.value = value(transmittor))),
  );
  return effects;
};

/**
 * Connects one signal-capable transmitter to several mutable receivers.
 *
 * A single effect immediately copies the transmitter into each receiver in
 * argument order and repeats that ordered broadcast when a live transmitter changes.
 *
 * @template T - The transmitted value type.
 * @param transmittor - The plain value or signal whose value is broadcast.
 * @param receivers - Source signals to update in argument order.
 * @returns The disposable effect controlling the broadcast.
 *
 * @remarks
 * - Receiver initialization is synchronous during this call.
 * - Plain and dead transmitters perform only the immediate broadcast.
 * - Receivers remain independently mutable between broadcasts.
 * - Passing no receivers creates an effect with no signal dependencies.
 *
 * @example
 * ```typescript
 * const source = signal(1);
 * const left = signal(0);
 * const right = signal(0);
 * const connection = transmit(source, left, right);
 * source.value = 2;
 * console.log(left.value, right.value); // 2, 2
 * connection.dispose();
 * ```
 *
 * @see {@link receive} - Connects several transmitters to one receiver.
 * @see {@link effect} - Implements the broadcast.
 * @see {@link value} - Unwraps the transmitter.
 */
export const transmit = <Receiver, Transmittor extends Receiver>(
  transmittor: MaybeSignal<Transmittor>,
  ...receivers: SourceSignal<Receiver>[]
): Effect =>
  effect(() => {
    receivers.forEach((receiver) => (receiver.value = value(transmittor)));
  });
