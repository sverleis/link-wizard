/**
 * External dependencies
 */
// Disable reason: `eslint-plugin-import` doesn't support `exports` (https://github.com/import-js/eslint-plugin-import/issues/1810)
// eslint-disable-next-line import/no-unresolved
import _sprintf from '@tannin/sprintf';
import type { SprintfArgs } from '@tannin/sprintf/types';

/**
 * Internal dependencies
 */
import type { TranslatableText } from './types';

type DistributeSprintfArgs< T extends string > = T extends any
	? SprintfArgs< T >
	: never;

export function sprintf< T extends string >(
	format: T | TranslatableText< T >,
	...args: DistributeSprintfArgs< T >
): string;
export function sprintf< T extends string >(
	format: T | TranslatableText< T >,
	args: DistributeSprintfArgs< T >
): string;

/**
 * Returns a formatted string.
 *
 * @template {string} T
 * @param {T | TranslatableText<T>}  format The format of the string to generate.
 * @param {DistributeSprintfArgs<T>} args   Arguments to apply to the format.
 *
 * @see https://www.npmjs.com/package/@tannin/sprintf
 *
 * @return {string} The formatted string.
 */
export function sprintf< T extends string >(
	format: T | TranslatableText< T >,
	...args: DistributeSprintfArgs< T >
): string {
	return _sprintf( format as T, ...( args as DistributeSprintfArgs< T > ) );
}
