export const updateSearchParamWithoutReload = (
  searchParams: Record<string, string>,
) => {
  const currentParams = new URLSearchParams(window.location.search);
  Object.entries(searchParams).forEach(([searchParamKey, searchParamValue]) => {
    currentParams.set(searchParamKey, searchParamValue);
  });
  const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
  window.history.pushState({}, "", newUrl);
};
