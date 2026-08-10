export const IdGenerator = (() => {
  let _id = 0;

  const idGen = {
    get newID(): number {
      return ++_id;
    },
  } as const;

  return idGen;
})();
