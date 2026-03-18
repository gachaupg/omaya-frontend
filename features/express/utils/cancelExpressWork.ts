export let expressWorkCancelled = false;

export const markExpressCancelled = () => {
  expressWorkCancelled = true;
};

export const clearExpressCancelled = () => {
  expressWorkCancelled = false;
};

export const isExpressCancelled = () => expressWorkCancelled;

