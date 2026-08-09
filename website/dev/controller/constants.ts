export const CODE_SAMPLES = {
  SHOWCASE: `import { signal, effect } from "@cyftec/signal";

type LightState = "red" | "amber" | "green";

const light = signal<LightState>("red");
const order: LightState[] = ["red", "amber", "green"];

effect(() => {
  trafficLight.dataset.state = light.value;
});

setInterval(() => {
  const current = order.indexOf(light.value);
  light.value = order[(current + 1) % order.length];
}, 1200);`,

  IMPORT: `import { signal, derive, effect } from "@cyftec/signal";`,

  CREATE_STATE: `const count = signal(0);
console.log(count.value); // 0
count.value = 1;
console.log(count.value); // 1`,

  READ_FROM_STATE: `const name = signal("Ada");
console.log(\`Hello, \${name.value}\`); // Hello, Ada`,

  DERIVE_STATE: `const count = signal(2);
const doubled = derive(() => count.value * 2);
console.log(doubled.value); // 4`,

  REACT_TO_CHANGES: `const count = signal(0);

effect(() => {
  console.log(count.value); // 0
});

count.value = 1; // 1`,

  COMBINE_SIGNALS: `const first = signal("Ada");
const last = signal("Lovelace");
const fullName = derive(() => \`\${first.value} \${last.value}\`);

effect(() => {
  console.log(fullName.value); // Ada Lovelace
});`,

  EQUALITY_SHORT_CIRCUIT: `const count = signal(1);

effect(() => {
  console.log(count.value); // 1
});

count.value = 1; // no log`,

  DISPOSE_WHEN_DONE: `const count = signal(0);
const logger = effect(() => {
  console.log(count.value); // 0
});

logger.dispose();
count.value = 1; // no log`,

  ARRAYS_AND_OBJECTS: `const items = signal([1, 2, 3]);
items.mutate.push(4);

const user = signal({ name: "Ada", age: 36 });
user.mutate.set({ age: 37 });`,
};
