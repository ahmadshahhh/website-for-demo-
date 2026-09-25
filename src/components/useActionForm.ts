"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * Like useActionState, but submits via onSubmit so React does NOT reset the
 * form afterwards — a validation error never wipes what the user typed.
 */
export function useActionForm<S>(action: (state: Awaited<S>, form: FormData) => S | Promise<S>, initial: Awaited<S>) {
  const [state, dispatch, pending] = useActionState(action, initial);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  return [state, onSubmit, pending] as const;
}
